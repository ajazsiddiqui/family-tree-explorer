import { createFileRoute } from "@tanstack/react-router";
import { family, familyName, familyMotto } from "@/data/family";
import { buildForest } from "@/lib/family-tree";
import { FamilyTree } from "@/components/FamilyTree";
import { BirthdaysPanel } from "@/components/BirthdaysPanel";
import { MemberSearch } from "@/components/MemberSearch";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${familyName} — Family Tree` },
      {
        name: "description",
        content:
          "An interactive family tree from grandparents to newborns. Click any member to expand and view full details.",
      },
      { property: "og:title", content: `${familyName} — Family Tree` },
      {
        property: "og:description",
        content: "Explore generations of our family in a beautiful interactive tree.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const forest = buildForest(family);
  const total = family.length;
  const generations = new Set(
    family.map((m) => {
      let depth = 1;
      let cur = m;
      while (cur.fatherId || cur.motherId) {
        const parent = family.find(
          (p) => p.id === (cur.fatherId ?? cur.motherId),
        );
        if (!parent) break;
        cur = parent;
        depth++;
      }
      return depth;
    }),
  ).size;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{familyName}</h1>
            <p className="text-xs text-muted-foreground italic">{familyMotto}</p>
          </div>
          <div className="flex-1 max-w-md">
            <MemberSearch />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <section className="grid grid-cols-3 gap-4">
          {[
            { label: "Members", value: total },
            { label: "Generations", value: generations },
            {
              label: "Newborns",
              value: family.filter(
                (m) =>
                  m.dob &&
                  new Date().getFullYear() - new Date(m.dob).getFullYear() <= 3,
              ).length,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-[var(--gradient-card)] p-4 shadow-[var(--shadow-soft)]"
            >
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </section>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
          <section className="min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Family tree</h2>
              <p className="text-xs text-muted-foreground">
                Click any card to expand · auto-fits to screen
              </p>
            </div>
            <FamilyTree nodes={forest} />
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <BirthdaysPanel />
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-4 text-xs text-muted-foreground leading-relaxed">
              💡 Tip: edit{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                src/data/family.ts
              </code>{" "}
              to add your own family members.
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-border mt-12 py-6 text-center text-xs text-muted-foreground">
        Made with care · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
