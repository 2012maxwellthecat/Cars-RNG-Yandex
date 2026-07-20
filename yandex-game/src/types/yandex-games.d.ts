import type { SaveData } from "../game/saveModel";

export {};

declare global {
  interface Window {
    YaGames?: {
      init(): Promise<YandexGamesSdk>;
    };
  }
}

export type YandexGamesSdk = {
  getPlayer(options?: { scopes?: boolean }): Promise<YandexPlayer>;
  getLeaderboards?(): Promise<YandexLeaderboards>;
  adv?: {
    showFullscreenAdv(options?: {
      callbacks?: {
        onClose?: (wasShown: boolean) => void;
        onError?: (error: unknown) => void;
      };
    }): void;
    showRewardedVideo(options?: {
      callbacks?: {
        onRewarded?: () => void;
        onClose?: () => void;
        onError?: (error: unknown) => void;
      };
    }): void;
  };
};

export type YandexPlayer = {
  getData(keys?: string[]): Promise<Partial<{ saveData: SaveData }>>;
  setData(data: { saveData: SaveData }, flush?: boolean): Promise<void>;
  getUniqueID(): string;
  getName(): string;
};

export type YandexLeaderboards = {
  setLeaderboardScore(name: string, score: number): Promise<void>;
  getLeaderboardEntries(name: string, options?: { quantityTop?: number }): Promise<{
    entries: Array<{
      rank: number;
      score: number;
      player: {
        publicName: string;
      };
    }>;
  }>;
};
