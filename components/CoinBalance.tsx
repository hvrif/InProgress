import Link from "next/link";

export function CoinBalance({ balance }: { balance: number }) {
  return (
    <Link
      href="/coins"
      className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm transition hover:border-neutral-700"
    >
      <span className="flex items-center gap-1.5 text-neutral-300">
        <span className="text-base">🪙</span> Coins
      </span>
      <span className="font-semibold text-neutral-100">{balance}</span>
    </Link>
  );
}
