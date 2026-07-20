import type { Car } from "./types";
import { chanceMultFromLevel } from "./saveModel";

export type Rng = {
  float(): number;
  integer(min: number, max: number): number;
};

export const browserRng: Rng = {
  float: () => Math.random(),
  integer: (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
};

export function spin(cars: Car[], chanceLevel: number, rng: Rng = browserRng): Car {
  const chanceMult = chanceMultFromLevel(chanceLevel);
  if (!Number.isFinite(chanceMult) || chanceMult <= 0) {
    throw new Error("chanceMult must be a positive finite number");
  }

  const normalCars = cars.filter((car) => car.rarity !== "Эксклюзивный");
  if (normalCars.length === 0) {
    throw new Error("normal car pool is empty");
  }

  for (let attempt = 0; attempt < 10_000; attempt += 1) {
    const car = normalCars[rng.integer(0, normalCars.length - 1)];
    const winThreshold = car.baseChance * 100_000 * chanceMult;
    const roll = rng.integer(0, 10_000_000);

    if (roll <= winThreshold) {
      return car;
    }
  }

  return normalCars.reduce((best, car) => {
    return car.baseChance > best.baseChance ? car : best;
  }, normalCars[0]);
}
