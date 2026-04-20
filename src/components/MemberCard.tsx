import { Link } from "@tanstack/react-router";
import type { FamilyMember } from "@/data/family";
import { ageOf, initials } from "@/lib/family-tree";
import { cn } from "@/lib/utils";

interface Props {
  member: FamilyMember;
  spouse?: FamilyMember;
  expanded?: boolean;
  onToggle?: () => void;
}

function Avatar({ member, size = 56 }: { member: FamilyMember; size?: number }) {
  const ring =
    member.gender === "female"
      ? "ring-secondary"
      : member.gender === "male"
        ? "ring-primary/40"
        : "ring-accent";
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br from-secondary/60 via-background to-accent/40 ring-2 font-semibold text-foreground/80 shrink-0 shadow-sm",
        ring,
      )}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
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
  );
}

export function MemberCard({ member, spouse, expanded, onToggle }: Props) {
  const age = ageOf(member);
  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-[var(--gradient-card)] shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)] p-3 flex flex-col items-center text-center",
        expanded ? "border-primary/50 ring-2 ring-primary/30" : "border-border",
      )}
    >
      <button
        onClick={onToggle}
        className="flex flex-col items-center gap-2 w-full"
      >
        <Avatar member={member} size={64} />
        <div className="min-w-0 w-full">
          <div className="font-semibold text-sm text-foreground truncate leading-tight">
            {member.name}
          </div>
          <div className="text-[10px] text-muted-foreground truncate mt-0.5">
            {member.occupation ?? "—"}
            {age !== null && ` · ${age}y`}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 w-full animate-in fade-in slide-in-from-top-1">
          {spouse && (
            <div className="flex items-center gap-2 rounded-xl bg-secondary/50 px-2 py-1.5 text-left">
              <Avatar member={spouse} size={28} />
              <div className="min-w-0">
                <div className="text-[11px] font-medium truncate">{spouse.name}</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wide">
                  spouse
                </div>
              </div>
            </div>
          )}
          <div className="text-[10px] text-muted-foreground space-y-0.5 text-left">
            {member.dob && <div>🎂 {member.dob}</div>}
            {member.birthPlace && <div className="truncate">📍 {member.birthPlace}</div>}
          </div>
          <Link
            to="/member/$id"
            params={{ id: member.id }}
            className="inline-flex items-center justify-center w-full rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            View details →
          </Link>
        </div>
      )}
    </div>
  );
}
