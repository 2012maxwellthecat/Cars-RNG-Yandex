import {
  INITIAL_CHANCE_LEVEL,
  INITIAL_GARAGE_CAP,
  INITIAL_MONEY,
} from "./constants";
import type { InventoryCar, PendingReward } from "./types";

export const SAVE_VERSION = 1;

export type PlayerStats = {
  spins: number;
  carsSold: number;
  casesOpened: number;
  adsWatched: number;
  rewardedAdsWatched: number;
  lastAdTimestamp: number;
};

export type SaveData = {
  version: number;
  money: number;
  chanceLevel: number;
  garageCap: number;
  inventory: InventoryCar[];
  pendingReward: PendingReward | null;
  stats: PlayerStats;
};

export function createDefaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    money: INITIAL_MONEY,
    chanceLevel: INITIAL_CHANCE_LEVEL,
    garageCap: INITIAL_GARAGE_CAP,
    inventory: [],
    pendingReward: null,
    stats: {
      spins: 0,
      carsSold: 0,
      casesOpened: 0,
      adsWatched: 0,
      rewardedAdsWatched: 0,
      lastAdTimestamp: 0,
    },
  };
}

export function chanceMultFromLevel(chanceLevel: number): number {
  return 1 + chanceLevel * 0.1;
}
