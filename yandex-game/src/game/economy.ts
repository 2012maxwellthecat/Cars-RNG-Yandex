import {
  CHANCE_BASE_COST,
  GARAGE_BASE_COST,
  GARAGE_COST_STEP,
  GARAGE_STEP,
  INITIAL_GARAGE_CAP,
} from "./constants";
import type { SaveData } from "./saveModel";

export function getChanceUpgradeCost(save: SaveData): number {
  return Math.trunc(CHANCE_BASE_COST * (1 + save.chanceLevel * 0.1));
}

export function getGarageUpgradeCost(save: SaveData): number {
  const garageLevel = Math.max(0, Math.floor((save.garageCap - INITIAL_GARAGE_CAP) / GARAGE_STEP));
  return GARAGE_BASE_COST + garageLevel * GARAGE_COST_STEP;
}
