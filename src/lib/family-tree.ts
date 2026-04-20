import type { FamilyMember } from "@/data/family";

export interface TreeNode {
  member: FamilyMember;
  spouse?: FamilyMember;
  children: TreeNode[];
}

const byId = (members: FamilyMember[]) =>
  Object.fromEntries(members.map((m) => [m.id, m]));

/** Build a forest of family trees rooted at members with no parents in the list. */
export function buildForest(members: FamilyMember[]): TreeNode[] {
  const map = byId(members);
  const usedAsSpouse = new Set<string>();

  // Children grouped by primary parent (the parent that is a blood descendant if both are in the family)
  const childrenOf = new Map<string, FamilyMember[]>();
  for (const m of members) {
    const parentId = m.fatherId ?? m.motherId;
    if (!parentId) continue;
    if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
    childrenOf.get(parentId)!.push(m);
  }

  // Decide roots: members with no parents (top of tree)
  const roots = members.filter((m) => !m.fatherId && !m.motherId);

  // To avoid duplicating spouses as separate roots: if a root's spouse is also a root,
  // we keep the one referenced first and mark the other as spouse.
  const buildNode = (member: FamilyMember): TreeNode => {
    const spouse = member.spouseId ? map[member.spouseId] : undefined;
    if (spouse) usedAsSpouse.add(spouse.id);

    // Children are those whose father OR mother is this member or the spouse
    const childIds = new Set<string>();
    const addKids = (parentId: string) => {
      (childrenOf.get(parentId) ?? []).forEach((c) => childIds.add(c.id));
    };
    addKids(member.id);
    if (spouse) addKids(spouse.id);

    const kids = Array.from(childIds)
      .map((id) => map[id])
      .filter(Boolean)
      .sort((a, b) => (a.dob ?? "").localeCompare(b.dob ?? ""));

    return {
      member,
      spouse,
      children: kids.map(buildNode),
    };
  };

  const nodes: TreeNode[] = [];
  for (const r of roots) {
    if (usedAsSpouse.has(r.id)) continue;
    nodes.push(buildNode(r));
  }
  return nodes;
}

export function findMember(members: FamilyMember[], id: string) {
  return members.find((m) => m.id === id);
}

export function getChildren(members: FamilyMember[], id: string) {
  return members.filter((m) => m.fatherId === id || m.motherId === id);
}

export function getParents(members: FamilyMember[], m: FamilyMember) {
  return {
    father: m.fatherId ? findMember(members, m.fatherId) : undefined,
    mother: m.motherId ? findMember(members, m.motherId) : undefined,
  };
}

export function getSpouse(members: FamilyMember[], m: FamilyMember) {
  return m.spouseId ? findMember(members, m.spouseId) : undefined;
}

export function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ageOf(m: FamilyMember) {
  if (!m.dob) return null;
  const start = new Date(m.dob);
  const end = m.dod ? new Date(m.dod) : new Date();
  const years = end.getFullYear() - start.getFullYear();
  const adj =
    end.getMonth() < start.getMonth() ||
    (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())
      ? -1
      : 0;
  return years + adj;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function generationOf(members: FamilyMember[], id: string): number {
  const m = findMember(members, id);
  if (!m) return 0;
  const parentId = m.fatherId ?? m.motherId;
  if (!parentId) return 1;
  return generationOf(members, parentId) + 1;
}

/** Upcoming birthdays within the next N days (default 60). */
export function upcomingBirthdays(members: FamilyMember[], days = 60) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const items = members
    .filter((m) => m.dob && m.alive !== false)
    .map((m) => {
      const d = new Date(m.dob!);
      const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
      if (next < today)
        next.setFullYear(today.getFullYear() + 1);
      const diff = Math.round(
        (next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return { member: m, date: next, days: diff };
    })
    .filter((x) => x.days <= days)
    .sort((a, b) => a.days - b.days);
  return items;
}
