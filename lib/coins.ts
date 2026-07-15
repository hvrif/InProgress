export const COINS_FOR_WIN = 20;
export const COINS_LOST_FOR_MISS = 10;

export interface CoinResult {
  delta: number;
  reason: "day_win" | "day_miss";
}

/** Mirrors computeXp's win/loss line (STREAK_THRESHOLD) — same day, same verdict, separate currency. */
export function computeCoinDelta(isWin: boolean): CoinResult {
  return isWin
    ? { delta: COINS_FOR_WIN, reason: "day_win" }
    : { delta: -COINS_LOST_FOR_MISS, reason: "day_miss" };
}

/** Coins never go negative — a large miss streak bottoms out at 0, it doesn't go into debt. */
export function applyCoinDelta(balance: number, delta: number): number {
  return Math.max(0, balance + delta);
}
