import type { Rarity } from "./types";

export const INITIAL_MONEY = 0;
export const INITIAL_CHANCE_LEVEL = 0;
export const INITIAL_GARAGE_CAP = 20;

export const CHANCE_BASE_COST = 100_000;
export const CHANCE_STEP = 0.1;

export const GARAGE_BASE_COST = 75_000;
export const GARAGE_COST_STEP = 50_000;
export const GARAGE_STEP = 5;

export const SPIN_MAX_ATTEMPTS = 10_000;

export const UNCOMMON_CASE_COST = 100_000;
export const RARE_CASE_COST = 2_500_000;
export const EXCLUSIVE_CASE_COST = 4_000_000;
export const BULK_CASE_COUNTS = [10, 100] as const;

export const RARITY_RANKS: Record<Rarity, number> = {
  Обычный: 0,
  Необычный: 1,
  Редкий: 2,
  Эпический: 3,
  Легендарный: 4,
  Эксклюзивный: 5,
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  Epic: 3,
  Legendary: 4,
  Exclusive: 5,
};

export const DEFAULT_INVENTORY_ORDER: Rarity[] = [
  "Легендарный",
  "Эксклюзивный",
  "Эпический",
  "Редкий",
  "Необычный",
  "Обычный",
];
