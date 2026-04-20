import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { family } from "@/data/family";
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

export const Route = createFileRoute("/member/$id")({
  loader: ({ params }) => {
    const member = findMember(family, params.id);
    if (!member) throw notFound();
    return { member };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.member.name} — Family Tree` },
          {
            name: "description",
            content: `Profile of ${loaderData.member.name} in our family tree.`,
          },
        ]
      : [],
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
  const { member } = Route.useLoaderData();
  const { father, mother } = getParents(family, member);
  const spouse = getSpouse(family, member);
  const children = getChildren(family, member.id);
  const age = ageOf(member);
  const gen = generationOf(family, member.id);

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
          <div className="text-xs text-muted-foreground">
            Generation {gen}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <section className="rounded-3xl bg-[var(--gradient-card)] border border-border shadow-[var(--shadow-pop)] p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-secondary to-accent ring-4 ring-background flex items-center justify-center text-4xl font-bold text-foreground/70 shrink-0">
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
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight">{member.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {member.occupation}
              {age !== null && ` · ${age} years${member.alive === false ? " (deceased)" : ""}`}
            </p>
            {member.bio && (
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                {member.bio}
              </p>
            )}
          </div>
        </section>

        <section className="grid sm:grid-cols-2 gap-3 mt-6">
          {[
            { label: "Father's name", value: father?.name ?? "—" },
            { label: "Mother's name", value: mother?.name ?? "—" },
            { label: "Date of birth", value: formatDate(member.dob) },
            { label: "Birth place", value: member.birthPlace ?? "—" },
            { label: "Date of marriage", value: formatDate(member.dom) },
            { label: "Spouse", value: spouse?.name ?? "—" },
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
