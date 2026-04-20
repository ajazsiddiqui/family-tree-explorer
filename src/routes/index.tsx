import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { familyName, familyMotto } from "@/data/family";
import { buildForest } from "@/lib/family-tree";
import { FamilyTree } from "@/components/FamilyTree";
import { BirthdaysPanel } from "@/components/BirthdaysPanel";
import { MemberSearch } from "@/components/MemberSearch";
import { useFamily, familyStore, exportJson, importJson, newId } from "@/lib/family-store";

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
  const family = useFamily();
  const forest = buildForest(family);
  const total = family.length;
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

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

  const handleExport = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `family-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = importJson(String(reader.result ?? ""));
      setMsg(result.ok ? "Imported successfully." : `Import failed: ${result.error}`);
      setTimeout(() => setMsg(null), 4000);
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm("Reset to the seed family data? Your edits will be lost.")) {
      familyStore.reset();
    }
  };

  const handleAddRoot = () => {
    const name = prompt("New member name?");
    if (!name?.trim()) return;
    const id = newId("m");
    familyStore.upsert({ id, name: name.trim(), gender: "other", alive: true });
    window.location.href = `/member/${id}`;
  };

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
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddRoot}
              className="text-xs rounded-full bg-primary text-primary-foreground px-3 py-1.5 hover:opacity-90 transition"
            >
              + Add member
            </button>
            <button
              onClick={handleExport}
              className="text-xs rounded-full border border-border px-3 py-1.5 hover:bg-muted transition"
            >
              Export
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs rounded-full border border-border px-3 py-1.5 hover:bg-muted transition"
            >
              Import
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={handleReset}
              className="text-xs rounded-full border border-border px-3 py-1.5 hover:bg-muted transition text-muted-foreground"
            >
              Reset
            </button>
          </div>
        </div>
        {msg && (
          <div className="max-w-7xl mx-auto px-6 pb-2 text-xs text-muted-foreground">
            {msg}
          </div>
        )}
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
              💡 Edits save in your browser. Use{" "}
              <strong>Export</strong> to download a JSON backup, or{" "}
              <strong>Import</strong> to restore one. Click any card → "Edit"
              for full details.{" "}
              <Link to="/" className="underline">Open a member</Link> to manage
              the family.
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
