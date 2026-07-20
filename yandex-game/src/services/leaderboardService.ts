import type { Car, InventoryCar, LeaderboardEntry } from "../game/types";
import { yandexSdk } from "./yandexSdk";

export function calculateScore(inventory: InventoryCar[], cars: Car[]): number {
  const carsById = new Map(cars.map((car) => [car.id, car]));
  return inventory.reduce((score, inventoryCar) => {
    return score + (carsById.get(inventoryCar.carId)?.points ?? 0);
  }, 0);
}

export async function submitScore(score: number): Promise<void> {
  await yandexSdk.submitLeaderboardScore(score);
}

export async function getTopEntries(): Promise<LeaderboardEntry[]> {
  return yandexSdk.getLeaderboardEntries(10);
}
