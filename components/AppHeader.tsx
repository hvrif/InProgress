import Link from "next/link";
import { EmergencyChat } from "@/components/EmergencyChat";
import { StreakBadge } from "@/components/StreakBadge";
import type { UserStats } from "@/lib/types";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/tasks", label: "Tasks" },
  { href: "/character", label: "Character" },
] as const;

export function AppHeader({
  stats,
  active,
}: {
  stats: UserStats | null;
  active: "/" | "/chat" | "/tasks" | "/character" | null;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-900 bg-neutral-950/90 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        {stats && <StreakBadge stats={stats} />}
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  link.href === active
                    ? "text-xs font-medium text-neutral-200"
                    : "text-xs text-neutral-600 hover:text-neutral-400"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <EmergencyChat />
          <form action="/auth/signout" method="post">
            <button className="text-xs text-neutral-600 hover:text-neutral-400">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
