import { useSyncExternalStore } from "react";
import { family as seedFamily, type FamilyMember } from "@/data/family";

const STORAGE_KEY = "family-tree:data:v1";

type Listener = () => void;

let current: FamilyMember[] = loadInitial();
const listeners = new Set<Listener>();

function loadInitial(): FamilyMember[] {
  if (typeof window === "undefined") return seedFamily;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedFamily;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seedFamily;
    return parsed as FamilyMember[];
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
    // keep spouse links bidirectional
    persist(syncSpouses(next));
  },

  remove: (id: string) => {
    const next = current
      .filter((m) => m.id !== id)
      .map((m) => ({
        ...m,
        fatherId: m.fatherId === id ? undefined : m.fatherId,
        motherId: m.motherId === id ? undefined : m.motherId,
        spouseId: m.spouseId === id ? undefined : m.spouseId,
      }));
    persist(next);
  },

  linkSpouse: (aId: string, bId: string | undefined) => {
    const next = current.map((m) => {
      if (m.id === aId) return { ...m, spouseId: bId };
      // Clear any old reverse links to aId, then set the new partner
      if (bId && m.id === bId) return { ...m, spouseId: aId };
      if (m.spouseId === aId && m.id !== bId) return { ...m, spouseId: undefined };
      if (bId && m.spouseId === bId && m.id !== aId) return { ...m, spouseId: undefined };
      return m;
    });
    persist(next);
  },
};

function syncSpouses(members: FamilyMember[]): FamilyMember[] {
  const map = new Map(members.map((m) => [m.id, { ...m }]));
  for (const m of map.values()) {
    if (m.spouseId) {
      const other = map.get(m.spouseId);
      if (other && other.spouseId !== m.id) {
        other.spouseId = m.id;
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
    persist(syncSpouses(parsed as FamilyMember[]));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
