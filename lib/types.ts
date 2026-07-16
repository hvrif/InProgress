import type { CharacterAppearance } from "@/lib/character";

export interface Profile {
  id: string;
  identity_and_failure: string;
  main_goal: string;
  non_negotiables: string;
  danger_zone: string;
  why_text: string;
  welcome_message: string;
  onboarding_completed_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  is_win: boolean;
  completed_count: number;
  total_count: number;
  xp_earned: number;
  created_at: string;
  ended_at: string | null;
}

export interface CheckInMessage {
  id: string;
  daily_log_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export type DailyLogWithMessages = DailyLog & {
  messages: CheckInMessage[];
  tasks: TaskCompletionWithTitle[];
};

export interface UserStats {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_xp: number;
  level: number;
  last_log_date: string | null;
  updated_at: string;
  coin_balance: number;
  unspent_stat_points: number;
}

// One row per day-finalization or shop purchase — the full history behind
// the coin_balance number on UserStats.
export interface CoinLedgerEntry {
  id: string;
  user_id: string;
  daily_log_id: string | null;
  delta: number;
  reason: "day_win" | "day_miss" | "shop_purchase";
  created_at: string;
}

// Onboarding's 3rd question ("what do you want to do every day") is parsed
// into `tasks` (via parseTasksFromText) before this is submitted — the raw
// freeform answer never gets stored, only the confirmed discrete list.
export interface OnboardingAnswers {
  identity_and_failure: string;
  main_goal: string;
  tasks: string[];
  danger_zone: string;
  why_text: string;
}

// Insert payload for daily_logs — id/created_at are server/DB-generated.
export type DailyLogInsert = Omit<DailyLog, "id" | "created_at">;

// Insert payload for checkin_messages — id/created_at are server-generated.
export type CheckInMessageInsert = Omit<CheckInMessage, "id" | "created_at">;

// The "Talk now" channel — an always-open thread separate from the daily
// check-in, no XP/streak impact, never formally ends.
export interface SupportMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export type SupportMessageInsert = Omit<SupportMessage, "id" | "created_at">;

// A user-defined daily task, editable anytime. Never hard-deleted — set
// `active: false` instead, so history stays intact for days before the
// change.
export interface Task {
  id: string;
  user_id: string;
  title: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  stat_category: StatCategory | null;
}

export type TaskInsert = Omit<Task, "id" | "created_at">;

export interface TaskCompletion {
  id: string;
  daily_log_id: string;
  task_id: string;
  user_id: string;
  completed: boolean;
  created_at: string;
}

export type TaskCompletionInsert = Omit<TaskCompletion, "id" | "created_at">;

// A completion row joined with its task's title — needed for rendering
// history even after the task itself is later renamed or deactivated.
export type TaskCompletionWithTitle = TaskCompletion & { task_title: string };

export type StatCategory = "strength" | "endurance" | "focus" | "discipline";

// One row per user. appearance/equipped_* are cosmetic-only preset picks,
// never derived from anything about the user's real body.
export interface Character {
  user_id: string;
  name: string;
  appearance: CharacterAppearance;
  strength: number;
  endurance: number;
  focus: number;
  discipline: number;
  equipped_hair: string | null;
  equipped_outfit: string | null;
  equipped_accessory: string | null;
  equipped_pet: string | null;
  created_at: string;
}

export type CharacterInsert = Pick<Character, "user_id" | "name" | "appearance">;

// The shop's catalog — a shared, read-only table (see 0009 migration).
// xp_boost items have `xp_amount` set and are consumed immediately on
// purchase; accessory/pet items have `xp_amount: null` and go to inventory.
export type ShopItemCategory = "accessory" | "pet" | "xp_boost";

export interface ShopItem {
  id: string;
  key: string;
  name: string;
  description: string;
  category: ShopItemCategory;
  emoji: string;
  price_coins: number;
  xp_amount: number | null;
  sort_order: number;
}

// One row per cosmetic a user owns. Never written for xp_boost purchases.
export interface InventoryEntry {
  id: string;
  user_id: string;
  item_id: string;
  acquired_at: string;
}
