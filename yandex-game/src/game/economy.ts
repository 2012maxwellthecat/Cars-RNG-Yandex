import {
  CHANCE_BASE_COST,
  DEFAULT_INVENTORY_ORDER,
  GARAGE_BASE_COST,
  GARAGE_COST_STEP,
  GARAGE_STEP,
  INITIAL_GARAGE_CAP,
} from "./constants";
import type { SaveData } from "./saveModel";
import type { Car, InventoryCar } from "./types";

export type InventoryCarView = InventoryCar & {
  car: Car;
};

export type KeepPendingResult =
  | { status: "ok"; save: SaveData; added: InventoryCar }
  | { status: "no-pending"; save: SaveData }
  | { status: "garage-full"; save: SaveData };

export type SellPendingResult =
  | { status: "ok"; save: SaveData; car: Car; balance: number }
  | { status: "no-pending"; save: SaveData }
  | { status: "unknown-car"; save: SaveData };

export type SellInventoryResult =
  | { status: "ok"; save: SaveData; car: Car; balance: number }
  | { status: "not-found"; save: SaveData }
  | { status: "unknown-car"; save: SaveData };

export type ProcessCarResult =
  | { action: "added"; save: SaveData; car: Car; balance: number; count: number }
  | { action: "sold_new"; save: SaveData; car: Car; balance: number; count: number }
  | { action: "replaced"; save: SaveData; car: Car; soldCar: Car; balance: number; count: number };

export type UpgradeResult =
  | { status: "ok"; save: SaveData; cost: number }
  | { status: "money"; save: SaveData; cost: number };

export function getChanceUpgradeCost(save: SaveData, discountPercent = 0): number {
  const baseCost = Math.trunc(CHANCE_BASE_COST * (1 + save.chanceLevel * 0.1));
  return Math.trunc(baseCost * (1 - discountPercent / 100));
}

export function getGarageUpgradeCost(save: SaveData, discountPercent = 0): number {
  const garageLevel = Math.max(0, Math.floor((save.garageCap - INITIAL_GARAGE_CAP) / GARAGE_STEP));
  const baseCost = GARAGE_BASE_COST + garageLevel * GARAGE_COST_STEP;
  return Math.trunc(baseCost * (1 - discountPercent / 100));
}

export function getInventoryViews(save: SaveData, cars: Car[]): InventoryCarView[] {
  const carsById = new Map(cars.map((car) => [car.id, car]));
  return save.inventory
    .map((item) => {
      const car = carsById.get(item.carId);
      return car ? { ...item, car } : null;
    })
    .filter((item): item is InventoryCarView => item !== null);
}

export function sortInventoryViews(items: InventoryCarView[]): InventoryCarView[] {
  return [...items].sort((left, right) => {
    const rarityDiff =
      DEFAULT_INVENTORY_ORDER.indexOf(left.car.rarity) - DEFAULT_INVENTORY_ORDER.indexOf(right.car.rarity);
    if (rarityDiff !== 0) {
      return rarityDiff;
    }

    return right.car.value - left.car.value || left.obtainedAt - right.obtainedAt;
  });
}

export function keepPendingReward(save: SaveData, now = Date.now()): KeepPendingResult {
  if (!save.pendingReward) {
    return { status: "no-pending", save };
  }

  if (save.inventory.length >= save.garageCap) {
    return { status: "garage-full", save };
  }

  const added: InventoryCar = {
    inventoryId: createInventoryId(now),
    carId: save.pendingReward.carId,
    obtainedAt: now,
  };
  return {
    status: "ok",
    added,
    save: {
      ...save,
      inventory: [...save.inventory, added],
      pendingReward: null,
    },
  };
}

export function sellPendingReward(save: SaveData, cars: Car[]): SellPendingResult {
  if (!save.pendingReward) {
    return { status: "no-pending", save };
  }

  const car = cars.find((item) => item.id === save.pendingReward?.carId);
  if (!car) {
    return { status: "unknown-car", save };
  }

  const nextSave = {
    ...save,
    money: save.money + car.value,
    pendingReward: null,
    stats: {
      ...save.stats,
      carsSold: save.stats.carsSold + 1,
    },
  };

  return { status: "ok", save: nextSave, car, balance: nextSave.money };
}

export function sellInventoryCar(save: SaveData, inventoryId: string, cars: Car[]): SellInventoryResult {
  const inventoryCar = save.inventory.find((item) => item.inventoryId === inventoryId);
  if (!inventoryCar) {
    return { status: "not-found", save };
  }

  const car = cars.find((item) => item.id === inventoryCar.carId);
  if (!car) {
    return { status: "unknown-car", save };
  }

  const nextSave = {
    ...save,
    money: save.money + car.value,
    inventory: save.inventory.filter((item) => item.inventoryId !== inventoryId),
    stats: {
      ...save.stats,
      carsSold: save.stats.carsSold + 1,
    },
  };

  return { status: "ok", save: nextSave, car, balance: nextSave.money };
}

export function processCarIntoGarage(save: SaveData, car: Car, cars: Car[], now = Date.now()): ProcessCarResult {
  if (save.inventory.length < save.garageCap) {
    const added = createInventoryCar(car.id, now);
    const nextSave = {
      ...save,
      inventory: [...save.inventory, added],
    };

    return {
      action: "added",
      save: nextSave,
      car,
      balance: nextSave.money,
      count: nextSave.inventory.length,
    };
  }

  const cheapest = findCheapestInventoryCar(save, cars);
  if (!cheapest || cheapest.car.value > car.value) {
    const nextSave = {
      ...save,
      money: save.money + car.value,
    };

    return {
      action: "sold_new",
      save: nextSave,
      car,
      balance: nextSave.money,
      count: nextSave.inventory.length,
    };
  }

  const replacement = createInventoryCar(car.id, now);
  const nextSave = {
    ...save,
    money: save.money + cheapest.car.value,
    inventory: [...save.inventory.filter((item) => item.inventoryId !== cheapest.item.inventoryId), replacement],
  };

  return {
    action: "replaced",
    save: nextSave,
    car,
    soldCar: cheapest.car,
    balance: nextSave.money,
    count: nextSave.inventory.length,
  };
}

export function processCarsIntoGarage(save: SaveData, rewardCars: Car[], allCars: Car[], now = Date.now()): {
  save: SaveData;
  added: number;
  replaced: number;
  soldNew: number;
  earned: number;
  bestCars: Car[];
} {
  let nextSave = save;
  let added = 0;
  let replaced = 0;
  let soldNew = 0;
  let earned = 0;

  for (const car of rewardCars) {
    const beforeMoney = nextSave.money;
    const result = processCarIntoGarage(nextSave, car, allCars, now);
    nextSave = result.save;
    earned += nextSave.money - beforeMoney;

    if (result.action === "added") {
      added += 1;
    } else if (result.action === "replaced") {
      replaced += 1;
    } else {
      soldNew += 1;
    }
  }

  return {
    save: nextSave,
    added,
    replaced,
    soldNew,
    earned,
    bestCars: [...rewardCars].sort((left, right) => right.value - left.value).slice(0, 10),
  };
}

export function buyChanceUpgrade(save: SaveData): UpgradeResult {
  const cost = getChanceUpgradeCost(save);
  if (save.money < cost) {
    return { status: "money", save, cost };
  }

  return {
    status: "ok",
    cost,
    save: {
      ...save,
      money: save.money - cost,
      chanceLevel: save.chanceLevel + 1,
    },
  };
}

export function buyGarageUpgrade(save: SaveData): UpgradeResult {
  const cost = getGarageUpgradeCost(save);
  if (save.money < cost) {
    return { status: "money", save, cost };
  }

  return {
    status: "ok",
    cost,
    save: {
      ...save,
      money: save.money - cost,
      garageCap: save.garageCap + GARAGE_STEP,
    },
  };
}

function createInventoryCar(carId: string, now: number): InventoryCar {
  return {
    inventoryId: createInventoryId(now),
    carId,
    obtainedAt: now,
  };
}

function createInventoryId(now: number): string {
  return `${now}-${Math.random().toString(16).slice(2)}`;
}

function findCheapestInventoryCar(save: SaveData, cars: Car[]): { item: InventoryCar; car: Car } | null {
  const carsById = new Map(cars.map((car) => [car.id, car]));
  const candidates = save.inventory.map((item) => ({
    item,
    car: carsById.get(item.carId) ?? null,
  }));
  const knownCandidates = candidates.filter((candidate): candidate is { item: InventoryCar; car: Car } => {
    return candidate.car !== null;
  });

  if (knownCandidates.length === 0) {
    return null;
  }

  return knownCandidates.reduce((cheapest, current) => {
    if (current.car.value !== cheapest.car.value) {
      return current.car.value < cheapest.car.value ? current : cheapest;
    }

    return current.item.obtainedAt < cheapest.item.obtainedAt ? current : cheapest;
  }, knownCandidates[0]);
}
