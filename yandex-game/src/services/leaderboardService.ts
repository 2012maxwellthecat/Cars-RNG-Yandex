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

/**
 * Топ лидерборда. null означает «API недоступно или ответило ошибкой»,
 * пустой массив — «лидерборд есть, но в нём пока никого нет».
 */
export async function getTopEntries(): Promise<LeaderboardEntry[] | null> {
  return yandexSdk.getLeaderboardEntries(10);
}

/**
 * Стоит ли предлагать игроку войти в аккаунт
 */
export function canRequestAuthorization(): boolean {
  return yandexSdk.canRequestAuthorization();
}

/**
 * Открыть диалог авторизации Yandex
 */
export async function requestAuthorization(): Promise<boolean> {
  return yandexSdk.requestAuthorization();
}
