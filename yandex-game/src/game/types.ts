export type Rarity =
  | "Обычный"
  | "Необычный"
  | "Редкий"
  | "Эпический"
  | "Легендарный"
  | "Эксклюзивный"
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Legendary"
  | "Exclusive";

export type Car = {
  id: string;
  name: string;
  rarity: Rarity;
  value: number;
  baseChance: number;
  points: number;
  imageKey: string;
  imageFile: string;
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

export type CaseDefinition = {
  id: string;
  title: string;
  minRarity: Rarity;
  cost: number;
  exclusiveCarId?: string;
};

export type LeaderboardEntry = {
  rank: number;
  displayName: string;
  score: number;
};
