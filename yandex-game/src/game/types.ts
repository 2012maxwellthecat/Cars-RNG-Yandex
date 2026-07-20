export type Rarity =
  | "Обычный"
  | "Необычный"
  | "Редкий"
  | "Эпический"
  | "Легендарный"
  | "Эксклюзивный";

export type Car = {
  id: string;
  name: string;
  rarity: Rarity;
  value: number;
  baseChance: number;
  points: number;
  imageKey: string;
};

export type InventoryCar = {
  inventoryId: string;
  carId: string;
  obtainedAt: number;
};

export type PendingReward = {
  source: "spin" | "case";
  carId: string;
  createdAt: number;
};

export type LeaderboardEntry = {
  rank: number;
  displayName: string;
  score: number;
};
