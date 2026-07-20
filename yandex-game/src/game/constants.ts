import type { Rarity } from "./types";

export const INITIAL_MONEY = 0;
export const INITIAL_CHANCE_LEVEL = 0;
export const INITIAL_GARAGE_CAP = 20;

export const CHANCE_BASE_COST = 100_000;
export const CHANCE_STEP = 0.1;

export const GARAGE_BASE_COST = 75_000;
export const GARAGE_COST_STEP = 50_000;
export const GARAGE_STEP = 5;

export const RARITY_RANKS: Record<Rarity, number> = {
  Обычный: 0,
  Необычный: 1,
  Редкий: 2,
  Эпический: 3,
  Легендарный: 4,
  Эксклюзивный: 5,
};

export const DEFAULT_INVENTORY_ORDER: Rarity[] = [
  "Легендарный",
  "Эксклюзивный",
  "Эпический",
  "Редкий",
  "Необычный",
  "Обычный",
];
