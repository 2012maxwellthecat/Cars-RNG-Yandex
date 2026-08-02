export const GAMEPLAY_START_EVENT = "cars_rng_gameplay_start";
export const GAMEPLAY_STOP_EVENT = "cars_rng_gameplay_stop";

export function reportGameplayStarted(): void {
  window.dispatchEvent(new Event(GAMEPLAY_START_EVENT));
}

export function reportGameplayStopped(): void {
  window.dispatchEvent(new Event(GAMEPLAY_STOP_EVENT));
}

