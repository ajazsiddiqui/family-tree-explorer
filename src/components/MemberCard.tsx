import { Link } from "@tanstack/react-router";
import type { FamilyMember } from "@/data/family";
import { ageOf, initials } from "@/lib/family-tree";
import { cn } from "@/lib/utils";

interface Props {
  member: FamilyMember;
  highlighted?: boolean;
  onToggle?: () => void;
  tint?: number;
  side?: "single" | "left" | "middle" | "right";
  relation?: string;
}

const tintVar = (n: number) => `var(--tint-${((n - 1) % 6) + 1})`;

export function MemberCard({ member, highlighted, onToggle, tint = 1, side = "single", relation }: Props) {
  const age = ageOf(member);
  const bg = tintVar(tint);

  const radius =
    side === "left"   ? "rounded-l-2xl rounded-r-none" :
    side === "right"  ? "rounded-r-2xl rounded-l-none" :
    side === "middle" ? "rounded-none" :
                        "rounded-2xl";

  const borderSide = side === "left" || side === "middle" ? "border-r-0" : "";

  const genderBorder =
    member.gender === "male"   ? "border-blue-200" :
    member.gender === "female" ? "border-pink-200" :
                                 "border-purple-200";

  return (
    <div
      className={cn(
        "group relative w-[108px] border transition-all duration-300 flex flex-col items-center text-center pt-3 pb-3 px-2",
        radius,
        borderSide,
        highlighted
          ? "border-[var(--branch)] shadow-[0_0_0_3px_var(--branch-soft)]"
          : `${genderBorder} shadow-[0_4px_20px_-4px_rgba(0,0,0,0.13)] hover:-translate-y-0.5 hover:shadow-[0_10px_32px_-8px_rgba(0,0,0,0.18)]`,
      )}
      style={{ background: bg }}
    >
      <Link
        to="/member/$id"
        params={{ id: member.id }}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-white hover:scale-110"
        aria-label="Edit"
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/70">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </Link>
      <button onClick={onToggle} className="flex flex-col items-center gap-1.5 w-full focus:outline-none">
        <div className="relative">
        <div
          className="w-[56px] h-[56px] rounded-full bg-white flex items-center justify-center font-bold text-foreground/65 overflow-hidden ring-[3px] ring-white shadow-[0_4px_14px_-3px_rgba(0,0,0,0.2)]"
          style={{ fontSize: 19 }}
        >
          {member.photo ? (
            <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            initials(member.name)
          )}
        </div>
          <span className={cn(
            "absolute bottom-0 right-0 w-2 h-2 rounded-full ring-1 ring-white",
            member.gender === "male"   ? "bg-blue-400" :
            member.gender === "female" ? "bg-pink-400" :
                                         "bg-purple-400",
          )} />
        </div>

        <div className="font-bold text-[11px] leading-snug text-foreground w-full px-0.5 truncate text-center">
          {member.name}
        </div>

        <div className="text-[9px] text-foreground/50 leading-tight truncate max-w-full -mt-0.5">
          {relation ?? member.occupation ?? (age !== null ? `${age} yrs` : "")}
        </div>
      </button>
    </div>
  );
}
