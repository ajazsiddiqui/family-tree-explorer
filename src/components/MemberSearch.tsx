import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useFamily } from "@/lib/family-store";
import { initials } from "@/lib/family-tree";

export function MemberSearch() {
  const family = useFamily();
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return family
      .filter(
        (m) =>
          m.name.toLowerCase().includes(s) ||
          m.occupation?.toLowerCase().includes(s) ||
          m.birthPlace?.toLowerCase().includes(s),
      )
      .slice(0, 6);
  }, [q, family]);

  return (
    <div className="relative w-full">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, place, profession…"
        className="w-full rounded-full border border-border bg-card px-5 py-3 text-sm shadow-[var(--shadow-soft)] focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      {results.length > 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-border bg-popover shadow-[var(--shadow-pop)] overflow-hidden">
          {results.map((m) => (
            <Link
              key={m.id}
              to="/member/$id"
              params={{ id: m.id }}
              onClick={() => setQ("")}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
                {initials(m.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{m.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {m.occupation} {m.birthPlace ? `· ${m.birthPlace}` : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
