import type { SaveData } from "../game/saveModel";
import type { LeaderboardEntry } from "../game/types";
import type { YandexGamesSdk, YandexPlayer } from "../types/yandex-games";

const LEADERBOARD_NAME = "carsRngPoints";

export class YandexSdkService {
  private sdk: YandexGamesSdk | null = null;
  private player: YandexPlayer | null = null;
  private isGuest = false;
  private detectedLanguage = "ru";

  async init(): Promise<void> {
    if (!window.YaGames) {
      console.log('[Yandex SDK] SDK недоступен, работа в офлайн режиме');
      this.isGuest = true;
      return;
    }

    try {
      this.sdk = await window.YaGames.init();
      window.ysdk = this.sdk; // Сохраняем глобально для LoadingAPI

      // Определение языка через SDK
      if (this.sdk.environment?.i18n?.lang) {
        this.detectedLanguage = this.sdk.environment.i18n.lang;
        console.log('[Yandex SDK] Определен язык:', this.detectedLanguage);
      } else {
        console.log('[Yandex SDK] Язык не определен, используется русский по умолчанию');
      }

      try {
        this.player = await this.sdk.getPlayer({ scopes: false });
        console.log('[Yandex SDK] Игрок авторизован:', this.player.getName());
      } catch (playerError) {
        console.warn('[Yandex SDK] Авторизация не выполнена, гостевой режим:', playerError);
        this.isGuest = true;
        // Игра продолжает работать без авторизации
      }
    } catch (sdkError) {
      console.error('[Yandex SDK] Ошибка инициализации SDK:', sdkError);
      this.isGuest = true;
      // Игра продолжает работать в офлайн режиме
    }
  }

  isAvailable(): boolean {
    return this.sdk !== null && this.player !== null;
  }

  isGuestMode(): boolean {
    return this.isGuest;
  }

  getLanguage(): string {
    return this.detectedLanguage;
  }

  getSdk(): YandexGamesSdk | null {
    return this.sdk;
  }

  getPlayerName(): string {
    return this.player?.getName() || "Игрок";
  }

  async loadPlayerData(): Promise<SaveData | null> {
    if (!this.player || this.isGuest) {
      console.log('[Yandex SDK] Гостевой режим - облачные сохранения недоступны');
      return null;
    }

    try {
      const data = await this.player.getData(["saveData"]);
      return data.saveData ?? null;
    } catch (error) {
      console.error('[Yandex SDK] Ошибка загрузки данных:', error);
      return null;
    }
  }

  async savePlayerData(saveData: SaveData): Promise<void> {
    if (!this.player || this.isGuest) {
      console.log('[Yandex SDK] Гостевой режим - сохранение только локально');
      return;
    }

    try {
      await this.player.setData({ saveData }, true);
    } catch (error) {
      console.error('[Yandex SDK] Ошибка сохранения данных:', error);
    }
  }

  async submitLeaderboardScore(score: number): Promise<void> {
    if (!this.sdk?.leaderboards || this.isGuest) {
      console.log('[Yandex SDK] Лидерборд недоступен в гостевом режиме');
      return;
    }

    try {
      await this.sdk.leaderboards.setLeaderboardScore(LEADERBOARD_NAME, score);
      console.log('[Yandex SDK] Счет отправлен в лидерборд:', score);
    } catch (error) {
      console.error('[Yandex SDK] Ошибка отправки счета:', error);
    }
  }

  async getLeaderboardEntries(limit = 10): Promise<LeaderboardEntry[]> {
    if (!this.sdk?.leaderboards || this.isGuest) {
      console.log('[Yandex SDK] Лидерборд недоступен в гостевом режиме');
      return [];
    }

    try {
      const response = await this.sdk.leaderboards.getLeaderboardEntries(LEADERBOARD_NAME, {
        quantityTop: limit,
      });

      return response.entries.map((entry) => ({
        rank: entry.rank,
        displayName: entry.player.publicName || "Игрок",
        score: entry.score,
      }));
    } catch (error) {
      console.error('[Yandex SDK] Ошибка загрузки лидерборда:', error);
      return [];
    }
  }
}

export const yandexSdk = new YandexSdkService();
