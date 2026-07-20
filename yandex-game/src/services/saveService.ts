import { createDefaultSave, type SaveData } from "../game/saveModel";
import { yandexSdk } from "./yandexSdk";

const LOCAL_STORAGE_KEY = "cars-rng-save";

export class SaveService {
  private saveData: SaveData = createDefaultSave();

  get current(): SaveData {
    return this.saveData;
  }

  async load(): Promise<SaveData> {
    const sdkSave = await yandexSdk.loadPlayerData();
    if (sdkSave) {
      this.saveData = sdkSave;
      return this.saveData;
    }

    const rawLocalSave = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (rawLocalSave) {
      try {
        this.saveData = JSON.parse(rawLocalSave) as SaveData;
        return this.saveData;
      } catch {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }

    this.saveData = createDefaultSave();
    return this.saveData;
  }

  async save(nextSave: SaveData = this.saveData): Promise<void> {
    this.saveData = nextSave;
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextSave));
    await yandexSdk.savePlayerData(nextSave);
  }
}

export const saveService = new SaveService();
