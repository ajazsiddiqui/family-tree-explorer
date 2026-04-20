import { Link } from "@tanstack/react-router";
import { family } from "@/data/family";
import { upcomingBirthdays, initials, ageOf } from "@/lib/family-tree";

export function BirthdaysPanel() {
  const items = upcomingBirthdays(family, 90).slice(0, 6);
  if (!items.length) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        🎉 Upcoming birthdays
      </h3>
      <ul className="space-y-2">
        {items.map(({ member, date, days }) => {
          const age = (ageOf(member) ?? 0) + (days === 0 ? 0 : 1);
          return (
            <li key={member.id}>
              <Link
                to="/member/$id"
                params={{ id: member.id }}
                className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
                  {initials(member.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{member.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}{" "}
                    · turning {age}
                  </div>
                </div>
                <span className="text-[10px] font-medium text-primary">
                  {days === 0 ? "Today" : `${days}d`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
