import { Link } from "@tanstack/react-router";
import type { FamilyMember } from "@/data/family";
import { ageOf, initials } from "@/lib/family-tree";
import { cn } from "@/lib/utils";

interface Props {
  member: FamilyMember;
  expanded?: boolean;
  onToggle?: () => void;
  tint?: number; // 1..6
}

const tintVar = (n: number) => `var(--tint-${((n - 1) % 6) + 1})`;

export function MemberCard({ member, expanded, onToggle, tint = 1 }: Props) {
  const age = ageOf(member);
  const bg = tintVar(tint);

  return (
    <div
      className={cn(
        "group relative w-[96px] rounded-xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)] flex flex-col items-center text-center pt-2.5 pb-2 px-1.5 shadow-[var(--shadow-soft)]",
        expanded ? "border-[var(--branch)] ring-2 ring-[var(--branch-soft)]" : "border-border/60",
      )}
      style={{ background: bg }}
    >
      <button onClick={onToggle} className="flex flex-col items-center gap-1.5 w-full">
        <div
          className="w-14 h-14 rounded-full bg-white ring-2 ring-white shadow-md flex items-center justify-center font-semibold text-foreground/70 overflow-hidden"
          style={{ fontSize: 18 }}
        >
          {member.photo ? (
            <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            initials(member.name)
          )}
        </div>
        <div className="rounded-full bg-white/85 backdrop-blur px-2 py-0.5 max-w-full">
          <div className="font-semibold text-[11px] leading-tight text-foreground truncate">
            {member.name.split(" ")[0]}
          </div>
        </div>
        <div className="text-[9px] text-foreground/55 leading-tight truncate max-w-full">
          {member.occupation ?? (age !== null ? `${age}y` : "")}
        </div>
      </button>

      {expanded && (
        <div className="mt-2 w-full space-y-1.5 animate-in fade-in slide-in-from-top-1">
          <div className="text-[9px] text-foreground/65 space-y-0.5 text-left bg-white/60 rounded-lg px-2 py-1.5">
            {member.dob && <div>🎂 {member.dob}</div>}
            {member.birthPlace && <div className="truncate">📍 {member.birthPlace}</div>}
          </div>
          <Link
            to="/member/$id"
            params={{ id: member.id }}
            className="inline-flex items-center justify-center w-full rounded-full bg-foreground/85 px-2 py-1 text-[10px] font-semibold text-background hover:bg-foreground transition-colors"
          >
            Details →
          </Link>
        </div>
      )}
    </div>
  );
}
