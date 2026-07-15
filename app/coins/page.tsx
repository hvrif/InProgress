import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import type { CoinLedgerEntry, UserStats } from "@/lib/types";

const REASON_LABEL: Record<CoinLedgerEntry["reason"], string> = {
  day_win: "Day completed",
  day_miss: "Day missed",
  shop_purchase: "Shop purchase",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default async function CoinsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: statsRow } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();
  const stats = statsRow as UserStats | null;

  const { data: entriesRows } = await supabase
    .from("coin_ledger")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const entries = (entriesRows ?? []) as CoinLedgerEntry[];

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader stats={stats} active={null} />

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6">
        <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">
          <span className="text-sm text-neutral-400">Balance</span>
          <span className="text-lg font-semibold text-neutral-100">
            🪙 {stats?.coin_balance ?? 0}
          </span>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-neutral-400">History</h2>
          {entries.length === 0 ? (
            <p className="text-sm text-neutral-500">No coin activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="text-neutral-200">{REASON_LABEL[entry.reason]}</p>
                    <p className="text-xs text-neutral-500">{formatDate(entry.created_at)}</p>
                  </div>
                  <span
                    className={
                      entry.delta >= 0
                        ? "font-semibold text-emerald-400"
                        : "font-semibold text-red-400"
                    }
                  >
                    {entry.delta >= 0 ? "+" : ""}
                    {entry.delta}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
