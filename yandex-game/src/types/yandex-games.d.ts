import type { SaveData } from "../game/saveModel";

export {};

declare global {
  interface Window {
    YaGames?: {
      init(): Promise<YandexGamesSdk>;
      /** Признак mock SDK для локальной разработки, см. public/sdk.js */
      __isMock?: boolean;
    };
    ysdk?: YandexGamesSdk;
  }
}

export type YandexGamesSdk = {
  on?(eventName: string, callback: (...args: unknown[]) => void): void;
  off?(eventName: string, callback: (...args: unknown[]) => void): void;
  getPlayer(options?: { scopes?: boolean; signed?: boolean }): Promise<YandexPlayer>;
  /**
   * Актуальное API лидербордов (SDK v2).
   *
   * ВАЖНО: устаревший ysdk.getLeaderboards() возвращал объект с ДРУГИМИ
   * именами методов (setLeaderboardScore / getLeaderboardEntries). У
   * ysdk.leaderboards они называются setScore / getEntries. Перепутанные
   * имена дают TypeError, который легко потерять в catch.
   */
  leaderboards?: YandexLeaderboards;
  /**
   * Проверка доступности метода, требующего авторизации.
   * Например: isAvailableMethod('leaderboards.setScore')
   */
  isAvailableMethod?(methodName: string): Promise<boolean>;
  auth?: {
    openAuthDialog(): Promise<void>;
  };
  environment?: {
    i18n?: {
      lang?: string;
      tld?: string;
    };
    app?: {
      id?: string;
    };
    browser?: {
      lang?: string;
    };
    payload?: string;
  };
  features?: {
    LoadingAPI?: {
      ready(): void;
    };
    GameplayAPI?: {
      start(): void;
      stop(): void;
    };
  };
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
    showBannerAdv(): Promise<void>;
    hideBannerAdv(): Promise<void>;
  };
};

export type YandexPlayer = {
  getData(keys?: string[]): Promise<Partial<{ saveData: SaveData }>>;
  setData(data: { saveData: SaveData }, flush?: boolean): Promise<void>;
  getUniqueID(): string;
  getName(): string;
  /** Авторизован ли игрок. Для гостя getPlayer() тоже успешно резолвится. */
  isAuthorized?(): boolean;
};

export type YandexLeaderboards = {
  /** Требует авторизации игрока */
  setScore(leaderboardName: string, score: number, extraData?: string): Promise<void>;
  /** Авторизация не нужна: топ доступен и гостю */
  getEntries(
    leaderboardName: string,
    options?: {
      quantityTop?: number;
      includeUser?: boolean;
      quantityAround?: number;
    },
  ): Promise<{
    userRank: number;
    entries: Array<{
      rank: number;
      score: number;
      extraData?: string;
      player: {
        publicName: string;
        uniqueID: string;
      };
    }>;
  }>;
};
