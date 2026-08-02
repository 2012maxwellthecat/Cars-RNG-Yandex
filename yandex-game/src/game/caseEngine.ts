import {
  EXCLUSIVE_CASE_COST,
  RARE_CASE_COST,
  RARITY_RANKS,
  UNCOMMON_CASE_COST,
} from "./constants";
import { browserRng, type Rng } from "./spinEngine";
import type { Car, CaseDefinition, Rarity } from "./types";
import { i18nService } from "../i18n/i18nService";

export function getExclusiveCars(cars: Car[]): Car[] {
  return cars.filter((car) => car.rarity === "Эксклюзивный" || car.rarity === "Exclusive");
}

export function getBaseCaseDefinitions(): CaseDefinition[] {
  const isRussian = i18nService.isRussian();
  return [
    {
      id: "case:uncommon",
      title: isRussian ? "Необычный+ кейс" : "Uncommon+ Case",
      minRarity: isRussian ? "Необычный" : "Uncommon",
      cost: UNCOMMON_CASE_COST,
    },
    {
      id: "case:rare",
      title: isRussian ? "Редкий+ кейс" : "Rare+ Case",
      minRarity: isRussian ? "Редкий" : "Rare",
      cost: RARE_CASE_COST,
    },
  ];
}

export function getExclusiveCaseDefinitions(cars: Car[]): CaseDefinition[] {
  const isRussian = i18nService.isRussian();
  return getExclusiveCars(cars).map((car) => ({
    id: `exclusive_case:${car.id}`,
    title: isRussian ? `${car.name} кейс` : `${car.name} Case`,
    minRarity: isRussian ? "Редкий" : "Rare",
    cost: EXCLUSIVE_CASE_COST,
    exclusiveCarId: car.id,
  }));
}

export function getCasePool(cars: Car[], minRarity: Rarity, exclusiveCarId?: string): Car[] {
  const minRank = RARITY_RANKS[minRarity];
  const basePool = cars.filter((car) => {
    return RARITY_RANKS[car.rarity] >= minRank && car.rarity !== "Эксклюзивный" && car.rarity !== "Exclusive";
  });

  if (!exclusiveCarId) {
    return basePool;
  }

  const exclusiveCar = cars.find((car) => car.id === exclusiveCarId && (car.rarity === "Эксклюзивный" || car.rarity === "Exclusive"));
  if (!exclusiveCar) {
    throw new Error(`Unknown exclusive car: ${exclusiveCarId}`);
  }

  return [...basePool, exclusiveCar];
}

export function openCase(cars: Car[], definition: CaseDefinition, rng: Rng = browserRng): Car {
  const pool = getCasePool(cars, definition.minRarity, definition.exclusiveCarId);
  if (pool.length === 0) {
    throw new Error(`case pool is empty: ${definition.id}`);
  }

  return weightedChoice(pool, rng);
}

export function openCases(cars: Car[], definition: CaseDefinition, count: number, rng: Rng = browserRng): Car[] {
  return Array.from({ length: count }, () => openCase(cars, definition, rng));
}

function weightedChoice(cars: Car[], rng: Rng): Car {
  const weights = cars.map((car) => Math.max(car.baseChance, 0.0001));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = rng.float() * totalWeight;

  for (let index = 0; index < cars.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) {
      return cars[index];
    }
  }

  return cars[cars.length - 1];
}
