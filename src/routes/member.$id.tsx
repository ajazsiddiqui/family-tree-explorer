import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { FamilyMember, Gender } from "@/data/family";
import {
  findMember,
  getChildren,
  getParents,
  getSpouse,
  formatDate,
  ageOf,
  initials,
  generationOf,
} from "@/lib/family-tree";
import { useFamily, familyStore, newId } from "@/lib/family-store";

export const Route = createFileRoute("/member/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Member — Family Tree` },
      {
        name: "description",
        content: `Profile of family member ${params.id}.`,
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Member not found</h1>
        <Link to="/" className="text-primary underline mt-2 inline-block">
          Back to tree
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center text-destructive">
      {error.message}
    </div>
  ),
  component: MemberDetail,
});

function NavCard({
  label,
  member,
}: {
  label: string;
  member: { id: string; name: string };
}) {
  return (
    <Link
      to="/member/$id"
      params={{ id: member.id }}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-muted transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
        {initials(member.name)}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-sm font-medium truncate">{member.name}</div>
      </div>
    </Link>
  );
}

function MemberDetail() {
  const { id } = Route.useParams();
  const family = useFamily();
  const navigate = useNavigate();
  const member = findMember(family, id);
  const [editing, setEditing] = useState(false);

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Member not found</h1>
          <Link to="/" className="text-primary underline mt-2 inline-block">
            Back to tree
          </Link>
        </div>
      </div>
    );
  }

  const { father, mother } = getParents(family, member);
  const spouse = getSpouse(family, member);
  const children = getChildren(family, member.id);
  const age = ageOf(member);
  const gen = generationOf(family, member.id);

  const handleDelete = () => {
    if (!confirm(`Delete ${member.name}? This cannot be undone.`)) return;
    familyStore.remove(member.id);
    navigate({ to: "/" });
  };

  const handleAddChild = () => {
    const name = prompt(`Add child of ${member.name}. Name?`);
    if (!name?.trim()) return;
    const childId = newId("c");
    const fatherId = member.gender === "male" ? member.id : spouse?.gender === "male" ? spouse.id : member.id;
    const motherId = member.gender === "female" ? member.id : spouse?.gender === "female" ? spouse.id : undefined;
    familyStore.upsert({
      id: childId,
      name: name.trim(),
      gender: "other",
      alive: true,
      fatherId,
      motherId,
    });
    navigate({ to: "/member/$id", params: { id: childId } });
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)]">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Family tree
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing((v) => !v)}
              className="text-xs rounded-full border border-border px-3 py-1.5 hover:bg-muted transition"
            >
              {editing ? "Close" : "Edit"}
            </button>
            <button
              onClick={handleAddChild}
              className="text-xs rounded-full border border-border px-3 py-1.5 hover:bg-muted transition"
            >
              + Child
            </button>
            <button
              onClick={handleDelete}
              className="text-xs rounded-full border border-destructive/40 text-destructive px-3 py-1.5 hover:bg-destructive/10 transition"
            >
              Delete
            </button>
            <div className="text-xs text-muted-foreground ml-2">Gen {gen}</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <section className="rounded-3xl bg-[var(--gradient-card)] border border-border shadow-[var(--shadow-pop)] p-8 flex flex-col items-center gap-5 text-center">
          <div className="w-36 h-36 rounded-full bg-gradient-to-br from-secondary via-background to-accent ring-4 ring-background shadow-lg flex items-center justify-center text-5xl font-bold text-foreground/70 shrink-0">
            {member.photo ? (
              <img
                src={member.photo}
                alt={member.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              initials(member.name)
            )}
          </div>
          <div className="w-full max-w-xl">
            <h1 className="text-3xl font-bold tracking-tight">{member.name}</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {member.occupation}
              {age !== null && ` · ${age} years${member.alive === false ? " (in loving memory)" : ""}`}
            </p>
            {member.bio && (
              <p className="mt-4 text-sm leading-relaxed text-foreground/80 italic">
                "{member.bio}"
              </p>
            )}
          </div>
        </section>

        {editing ? (
          <EditForm
            key={member.id}
            member={member}
            family={family}
            onClose={() => setEditing(false)}
          />
        ) : (
          <section className="grid sm:grid-cols-2 gap-3 mt-6">
            {[
              { label: "Father's name", value: father?.name ?? "—" },
              { label: "Mother's name", value: mother?.name ?? "—" },
              { label: "Date of birth", value: formatDate(member.dob) },
              { label: "Birth place", value: member.birthPlace ?? "—" },
              { label: "Date of marriage", value: formatDate(member.dom) },
              { label: "Spouse", value: spouse?.name ?? "—" },
              { label: "Profession", value: member.profession ?? member.occupation ?? "—" },
              { label: "Voter ID", value: member.voterId ?? "—" },
              ...(member.dod
                ? [{ label: "Date of passing", value: formatDate(member.dod) }]
                : []),
            ].map((row) => (
              <div
                key={row.label}
                className="rounded-2xl border border-border bg-card px-4 py-3"
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {row.label}
                </div>
                <div className="text-sm font-medium mt-0.5">{row.value}</div>
              </div>
            ))}
          </section>
        )}

        {/* Navigation: up (parents/spouse) and down (children) */}
        <section className="mt-8 space-y-4">
          {(father || mother || spouse) && (
            <div>
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                ↑ Move upward
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {father && <NavCard label="Father" member={father} />}
                {mother && <NavCard label="Mother" member={mother} />}
                {spouse && <NavCard label="Spouse" member={spouse} />}
              </div>
            </div>
          )}

          {children.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                ↓ Move downward · Children
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {children.map((c) => (
                  <NavCard key={c.id} label="Child" member={c} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function EditForm({
  member,
  family,
  onClose,
}: {
  member: FamilyMember;
  family: FamilyMember[];
  onClose: () => void;
}) {
  const [form, setForm] = useState<FamilyMember>({ ...member });
  const candidates = useMemo(
    () => family.filter((m) => m.id !== member.id),
    [family, member.id],
  );

  const set = <K extends keyof FamilyMember>(k: K, v: FamilyMember[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Name is required.");
    const cleaned: FamilyMember = {
      ...form,
      name: form.name.trim(),
      dob: form.dob || undefined,
      dod: form.dod || undefined,
      dom: form.dom || undefined,
      birthPlace: form.birthPlace?.trim() || undefined,
      occupation: form.occupation?.trim() || undefined,
      profession: form.profession?.trim() || undefined,
      voterId: form.voterId?.trim() || undefined,
      bio: form.bio?.trim() || undefined,
      photo: form.photo?.trim() || undefined,
      fatherId: form.fatherId || undefined,
      motherId: form.motherId || undefined,
      spouseId: form.spouseId || undefined,
    };
    familyStore.upsert(cleaned);
    // sync spouse link explicitly (covers clearing previous spouse)
    if (cleaned.spouseId !== member.spouseId) {
      familyStore.linkSpouse(cleaned.id, cleaned.spouseId);
    }
    onClose();
  };

  return (
    <form
      onSubmit={handleSave}
      className="mt-6 rounded-2xl border border-border bg-card p-5 space-y-4"
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Name *">
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputCls}
            maxLength={120}
            required
          />
        </Field>
        <Field label="Gender">
          <select
            value={form.gender}
            onChange={(e) => set("gender", e.target.value as Gender)}
            className={inputCls}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Date of birth">
          <input type="date" value={form.dob ?? ""} onChange={(e) => set("dob", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Date of passing">
          <input type="date" value={form.dod ?? ""} onChange={(e) => set("dod", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Date of marriage">
          <input type="date" value={form.dom ?? ""} onChange={(e) => set("dom", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Birth place">
          <input value={form.birthPlace ?? ""} onChange={(e) => set("birthPlace", e.target.value)} className={inputCls} maxLength={120} />
        </Field>
        <Field label="Occupation">
          <input value={form.occupation ?? ""} onChange={(e) => set("occupation", e.target.value)} className={inputCls} maxLength={120} />
        </Field>
        <Field label="Profession">
          <input value={form.profession ?? ""} onChange={(e) => set("profession", e.target.value)} className={inputCls} maxLength={120} />
        </Field>
        <Field label="Voter ID">
          <input value={form.voterId ?? ""} onChange={(e) => set("voterId", e.target.value)} className={inputCls} maxLength={40} />
        </Field>
        <Field label="Photo URL">
          <input value={form.photo ?? ""} onChange={(e) => set("photo", e.target.value)} className={inputCls} maxLength={500} />
        </Field>
        <Field label="Father">
          <PersonSelect value={form.fatherId} onChange={(v) => set("fatherId", v)} options={candidates.filter((m) => m.gender !== "female")} />
        </Field>
        <Field label="Mother">
          <PersonSelect value={form.motherId} onChange={(v) => set("motherId", v)} options={candidates.filter((m) => m.gender !== "male")} />
        </Field>
        <Field label="Spouse">
          <PersonSelect value={form.spouseId} onChange={(v) => set("spouseId", v)} options={candidates} />
        </Field>
        <Field label="Status">
          <select
            value={form.alive === false ? "no" : "yes"}
            onChange={(e) => set("alive", e.target.value === "yes")}
            className={inputCls}
          >
            <option value="yes">Alive</option>
            <option value="no">Deceased</option>
          </select>
        </Field>
      </div>
      <Field label="Bio">
        <textarea
          value={form.bio ?? ""}
          onChange={(e) => set("bio", e.target.value)}
          className={inputCls + " min-h-[80px]"}
          maxLength={1000}
        />
      </Field>
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onClose} className="text-xs rounded-full border border-border px-4 py-2 hover:bg-muted transition">
          Cancel
        </button>
        <button type="submit" className="text-xs rounded-full bg-primary text-primary-foreground px-4 py-2 hover:opacity-90 transition">
          Save changes
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}

function PersonSelect({
  value,
  onChange,
  options,
}: {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  options: FamilyMember[];
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
      className={inputCls}
    >
      <option value="">—</option>
      {options.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  );
}
