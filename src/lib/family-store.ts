import { useSyncExternalStore } from "react";
import { family as seedFamily, type FamilyMember } from "@/data/family";

const STORAGE_KEY = "family-tree:data:v1";

type Listener = () => void;

let current: FamilyMember[] = loadInitial();
const listeners = new Set<Listener>();

/** Migrate old single-spouseId records to spouseIds array. */
function migrate(members: FamilyMember[]): FamilyMember[] {
  return members.map((m) => {
    const legacy = m as FamilyMember & { spouseId?: string };
    if (legacy.spouseId && !m.spouseIds?.length) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { spouseId, ...rest } = legacy;
      return { ...rest, spouseIds: [spouseId] } as FamilyMember;
    }
    return m;
  });
}

function loadInitial(): FamilyMember[] {
  if (typeof window === "undefined") return seedFamily;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedFamily;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seedFamily;
    return migrate(parsed as FamilyMember[]);
  } catch {
    return seedFamily;
  }
}

function persist(next: FamilyMember[]) {
  current = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage may be full / disabled — ignore
    }
  }
  listeners.forEach((l) => l());
}

export const familyStore = {
  get: () => current,
  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  set: (next: FamilyMember[]) => persist(next),
  reset: () => persist(seedFamily),

  upsert: (member: FamilyMember) => {
    const exists = current.some((m) => m.id === member.id);
    const next = exists
      ? current.map((m) => (m.id === member.id ? { ...m, ...member } : m))
      : [...current, member];
    persist(syncSpouses(next));
  },

  remove: (id: string) => {
    const next = current
      .filter((m) => m.id !== id)
      .map((m) => ({
        ...m,
        fatherId: m.fatherId === id ? undefined : m.fatherId,
        motherId: m.motherId === id ? undefined : m.motherId,
        spouseIds: m.spouseIds?.filter((sid) => sid !== id) || undefined,
      }));
    persist(next);
  },

  addSpouse: (aId: string, bId: string) => {
    const next = current.map((m) => {
      if (m.id === aId) {
        const ids = m.spouseIds ?? [];
        return ids.includes(bId) ? m : { ...m, spouseIds: [...ids, bId] };
      }
      if (m.id === bId) {
        const ids = m.spouseIds ?? [];
        return ids.includes(aId) ? m : { ...m, spouseIds: [...ids, aId] };
      }
      return m;
    });
    persist(next);
  },

  removeSpouse: (aId: string, bId: string) => {
    const next = current.map((m) => {
      if (m.id === aId) return { ...m, spouseIds: (m.spouseIds ?? []).filter((id) => id !== bId) || undefined };
      if (m.id === bId) return { ...m, spouseIds: (m.spouseIds ?? []).filter((id) => id !== aId) || undefined };
      return m;
    });
    persist(next);
  },
};

function syncSpouses(members: FamilyMember[]): FamilyMember[] {
  const map = new Map(members.map((m) => [m.id, { ...m }]));
  for (const m of map.values()) {
    for (const spId of m.spouseIds ?? []) {
      const other = map.get(spId);
      if (other && !(other.spouseIds ?? []).includes(m.id)) {
        other.spouseIds = [...(other.spouseIds ?? []), m.id];
      }
    }
  }
  return Array.from(map.values());
}

export function useFamily(): FamilyMember[] {
  return useSyncExternalStore(
    familyStore.subscribe,
    familyStore.get,
    () => seedFamily,
  );
}

export function newId(prefix = "m") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function exportJson(): string {
  return JSON.stringify(current, null, 2);
}

export function importJson(json: string): { ok: true } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return { ok: false, error: "JSON must be an array of members." };
    for (const m of parsed) {
      if (!m || typeof m !== "object" || typeof m.id !== "string" || typeof m.name !== "string") {
        return { ok: false, error: "Each member needs at least { id, name }." };
      }
    }
    persist(syncSpouses(migrate(parsed as FamilyMember[])));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
