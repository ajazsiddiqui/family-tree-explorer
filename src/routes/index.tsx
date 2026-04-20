import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [showBirthdays, setShowBirthdays] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

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
    setMsg("Exported family.json");
    setTimeout(() => setMsg(null), 3000);
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

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const id = newId("m");
    familyStore.upsert({ id, name, gender: "other", alive: true });
    setNewName("");
    setAdding(false);
    navigate({ to: "/member/$id", params: { id } });
  };

  const doReset = () => {
    familyStore.reset();
    setConfirmingReset(false);
    setMsg("Reset to seed data.");
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <header className="border-b border-white/60 bg-white/75 backdrop-blur-xl sticky top-0 z-20 relative shadow-[0_1px_24px_-8px_rgba(0,0,0,0.1)]">
        {/* Main bar */}
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[14px] font-extrabold tracking-tight text-foreground truncate">{familyName}</h1>
            <p className="text-[9.5px] text-muted-foreground/80 italic leading-tight hidden sm:block">{familyMotto} · {total} members</p>
          </div>

          {/* Desktop search */}
          <div className="hidden sm:block flex-1 max-w-xs">
            <MemberSearch />
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <button onClick={() => setShowBirthdays((v) => !v)} className="text-[11px] font-medium rounded-full border border-border/60 bg-white/60 px-3 py-1.5 hover:bg-white transition shadow-sm">
              🎉 Birthdays
            </button>
            <button onClick={() => setAdding((v) => !v)} className="text-[11px] font-semibold rounded-full bg-primary text-primary-foreground px-3.5 py-1.5 hover:opacity-90 transition shadow-sm" data-testid="add-member-toggle">
              + Add
            </button>
            <button onClick={handleExport} className="text-[11px] font-medium rounded-full border border-border/60 bg-white/60 px-3 py-1.5 hover:bg-white transition shadow-sm">Export</button>
            <button onClick={() => fileRef.current?.click()} className="text-[11px] font-medium rounded-full border border-border/60 bg-white/60 px-3 py-1.5 hover:bg-white transition shadow-sm">Import</button>
            <button onClick={() => setConfirmingReset(true)} className="text-[11px] font-medium rounded-full border border-border/60 bg-white/60 px-3 py-1.5 hover:bg-white transition shadow-sm text-muted-foreground">Reset</button>
          </div>

          {/* Mobile actions */}
          <div className="flex sm:hidden items-center gap-2 shrink-0">
            <button onClick={() => setShowBirthdays((v) => !v)} className="w-8 h-8 rounded-full border border-border/60 bg-white/60 flex items-center justify-center text-base shadow-sm active:bg-white">🎉</button>
            <button onClick={() => setAdding((v) => !v)} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold shadow-sm active:opacity-80" data-testid="add-member-toggle">+</button>
            <button onClick={() => setShowMobileMenu((v) => !v)} className="w-8 h-8 rounded-full border border-border/60 bg-white/60 flex items-center justify-center shadow-sm active:bg-white" aria-label="More options">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-foreground/70">
                <circle cx="8" cy="3" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="8" cy="13" r="1.3"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="sm:hidden px-4 pb-3">
          <MemberSearch />
        </div>

        {/* Mobile overflow menu */}
        {showMobileMenu && (
          <div className="sm:hidden border-t border-border/40 bg-white/95 backdrop-blur-xl px-4 py-3 flex flex-col gap-2">
            <button onClick={() => { handleExport(); setShowMobileMenu(false); }} className="w-full text-sm font-medium rounded-xl border border-border/60 bg-white px-4 py-2.5 text-left shadow-sm active:bg-muted">Export JSON</button>
            <button onClick={() => { fileRef.current?.click(); setShowMobileMenu(false); }} className="w-full text-sm font-medium rounded-xl border border-border/60 bg-white px-4 py-2.5 text-left shadow-sm active:bg-muted">Import JSON</button>
            <button onClick={() => { setConfirmingReset(true); setShowMobileMenu(false); }} className="w-full text-sm font-medium rounded-xl border border-border/60 bg-white px-4 py-2.5 text-left shadow-sm active:bg-muted text-destructive">Reset to seed data</button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }} />

        {/* Birthdays panel — full-width on mobile, anchored on desktop */}
        {showBirthdays && (
          <div className="absolute left-0 right-0 sm:left-auto sm:right-4 sm:w-80 top-full z-50 shadow-xl sm:shadow-lg">
            <BirthdaysPanel />
          </div>
        )}

        {/* Add member form */}
        {adding && (
          <div className="px-4 pb-3">
            <form onSubmit={submitAdd} className="flex items-center gap-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New member name"
                className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                maxLength={120}
                data-testid="new-member-name"
              />
              <button type="submit" className="text-xs rounded-full bg-primary text-primary-foreground px-4 py-2 hover:opacity-90 transition shrink-0">Create</button>
              <button type="button" onClick={() => { setAdding(false); setNewName(""); }} className="text-xs rounded-full border border-border px-4 py-2 hover:bg-muted transition shrink-0">Cancel</button>
            </form>
          </div>
        )}

        {/* Confirm reset */}
        {confirmingReset && (
          <div className="px-4 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
              <span className="text-sm">Reset to seed data? Your edits will be lost.</span>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={doReset} className="text-xs rounded-full bg-destructive text-destructive-foreground px-4 py-2 hover:opacity-90 transition">Confirm</button>
                <button onClick={() => setConfirmingReset(false)} className="text-xs rounded-full border border-border px-4 py-2 hover:bg-muted transition">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {msg && (
          <div className="px-4 pb-2 text-xs text-muted-foreground">{msg}</div>
        )}
      </header>

      <main className="flex-1 flex flex-col w-full min-h-0">
          <section className="flex-1 flex flex-col min-h-0">
            <FamilyTree nodes={forest} />
          </section>
      </main>
    </div>
  );
}
