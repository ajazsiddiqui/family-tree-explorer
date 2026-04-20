import { Link } from "@tanstack/react-router";
import type { FamilyMember } from "@/data/family";
import { ageOf, initials } from "@/lib/family-tree";
import { cn } from "@/lib/utils";

interface Props {
  member: FamilyMember;
  spouse?: FamilyMember;
  expanded?: boolean;
  onToggle?: () => void;
  compact?: boolean;
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
        "flex items-center justify-center rounded-full bg-gradient-to-br from-muted to-background ring-2 font-semibold text-foreground/80 shrink-0",
        ring,
      )}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {member.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
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

export function MemberCard({ member, spouse, expanded, onToggle, compact }: Props) {
  const age = ageOf(member);
  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border bg-[var(--gradient-card)] shadow-[var(--shadow-soft)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]",
        expanded ? "ring-2 ring-primary/40" : "",
        compact ? "p-2.5" : "p-3.5",
      )}
    >
      <button
        onClick={onToggle}
        className="flex items-center gap-3 w-full text-left"
      >
        <Avatar member={member} size={compact ? 44 : 52} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm text-foreground truncate">
            {member.name}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            {member.occupation ?? "—"}
            {age !== null && ` · ${age}y`}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-1">
          {spouse && (
            <div className="flex items-center gap-2 rounded-xl bg-secondary/40 px-2 py-1.5">
              <Avatar member={spouse} size={32} />
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{spouse.name}</div>
                <div className="text-[10px] text-muted-foreground">spouse</div>
              </div>
            </div>
          )}
          <div className="text-[11px] text-muted-foreground space-y-0.5">
            {member.dob && <div>🎂 {member.dob}</div>}
            {member.birthPlace && <div>📍 {member.birthPlace}</div>}
          </div>
          <Link
            to="/member/$id"
            params={{ id: member.id }}
            className="inline-flex items-center justify-center w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            View details →
          </Link>
        </div>
      )}
    </div>
  );
}
