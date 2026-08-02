import type { SaveData } from "../game/saveModel";
import type { LeaderboardEntry } from "../game/types";
import type { YandexGamesSdk, YandexPlayer } from "../types/yandex-games";
import { i18nService } from "../i18n/i18nService";
import { stickyBannerService } from "./stickyBannerService";
import { withRetry } from "../utils/retry";

const LEADERBOARD_NAME = "carsRngPoints";

export class YandexSdkService {
  private sdk: YandexGamesSdk | null = null;
  private player: YandexPlayer | null = null;
  private isGuest = false;
  /**
   * Авторизован ли игрок. Это НЕ то же самое, что isGuest: getPlayer()
   * успешно резолвится и для неавторизованного игрока, а setScore в
   * лидерборд требует именно авторизации.
   */
  private authorized = false;
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
      window.dispatchEvent(new Event("cars_rng_yandex_sdk_ready"));

      // Определение языка через SDK и установка в i18n сервис
      if (this.sdk.environment?.i18n?.lang) {
        this.detectedLanguage = this.sdk.environment.i18n.lang;
        i18nService.setLanguageFromSDK(this.detectedLanguage);
        console.log('[Yandex SDK] Определен язык:', this.detectedLanguage);
      } else {
        console.log('[Yandex SDK] Язык не определен, используется русский по умолчанию');
        i18nService.setLanguageFromSDK('ru');
      }

      try {
        this.player = await this.sdk.getPlayer({ scopes: false });
        // getPlayer() резолвится и для гостя, поэтому авторизацию
        // проверяем отдельным вызовом, а не фактом успеха.
        this.authorized = this.player.isAuthorized?.() ?? false;
        console.log(
          this.authorized
            ? `[Yandex SDK] Игрок авторизован: ${this.getPlayerName()}`
            : '[Yandex SDK] Игрок не авторизован, лидерборд только для чтения',
        );
      } catch (playerError) {
        console.warn('[Yandex SDK] Не удалось получить игрока, офлайн режим:', playerError);
        this.isGuest = true;
        // Игра продолжает работать без авторизации
      }

      // Показать sticky banner после инициализации SDK
      // Это обязательный элемент монетизации для Yandex Games
      await stickyBannerService.show();
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

    return withRetry(async () => {
      const data = await this.player!.getData(["saveData"]);
      return data.saveData ?? null;
    });
  }

  async savePlayerData(saveData: SaveData): Promise<void> {
    if (!this.player || this.isGuest) {
      console.log('[Yandex SDK] Гостевой режим - сохранение только локально');
      return;
    }

    await withRetry(async () => {
      await this.player!.setData({ saveData }, true);
      return true; // withRetry требует возвращаемое значение
    });
  }

  /**
   * Отправить счёт в лидерборд. Требует авторизации игрока:
   * у гостя Yandex результат не примет.
   */
  async submitLeaderboardScore(score: number): Promise<void> {
    if (!this.sdk?.leaderboards) {
      console.log('[Yandex SDK] Лидерборд недоступен: нет API в SDK');
      return;
    }

    if (!(await this.canSetScore())) {
      console.log('[Yandex SDK] Счёт не отправлен: игрок не авторизован');
      return;
    }

    await withRetry(async () => {
      // setScore, а НЕ setLeaderboardScore: у ysdk.leaderboards имена
      // методов короче, чем у устаревшего ysdk.getLeaderboards().
      await this.sdk!.leaderboards!.setScore(LEADERBOARD_NAME, score);
      console.log('[Yandex SDK] Счет отправлен в лидерборд:', score);
      return true;
    });
  }

  /**
   * Доступен ли setScore. Yandex рекомендует isAvailableMethod,
   * но метод есть не во всех версиях SDK — тогда полагаемся на isAuthorized.
   */
  private async canSetScore(): Promise<boolean> {
    if (this.sdk?.isAvailableMethod) {
      try {
        return await this.sdk.isAvailableMethod('leaderboards.setScore');
      } catch (error) {
        console.warn('[Yandex SDK] isAvailableMethod недоступен:', error);
      }
    }

    return this.authorized;
  }

  /**
   * Прочитать топ лидерборда. Авторизация НЕ нужна — гость тоже видит таблицу,
   * просто не попадает в неё сам.
   */
  async getLeaderboardEntries(limit = 10): Promise<LeaderboardEntry[] | null> {
    if (!this.sdk?.leaderboards) {
      console.log('[Yandex SDK] Лидерборд недоступен: нет API в SDK');
      return null;
    }

    return withRetry(async () => {
      // getEntries, а НЕ getLeaderboardEntries — см. комментарий в setScore.
      const response = await this.sdk!.leaderboards!.getEntries(LEADERBOARD_NAME, {
        quantityTop: limit,
      });

      return response.entries.map((entry) => ({
        rank: entry.rank,
        displayName: entry.player.publicName || "Игрок",
        score: entry.score,
      }));
    });
  }

  /**
   * Авторизован ли игрок (нужно для попадания в лидерборд)
   */
  isAuthorized(): boolean {
    return this.authorized;
  }

  /**
   * Можно ли предложить игроку войти в аккаунт
   */
  canRequestAuthorization(): boolean {
    return !this.authorized && !!this.sdk?.auth?.openAuthDialog;
  }

  /**
   * Открыть диалог авторизации Yandex.
   * @returns true если игрок вошёл в аккаунт
   */
  async requestAuthorization(): Promise<boolean> {
    if (!this.sdk?.auth?.openAuthDialog) {
      return false;
    }

    try {
      await this.sdk.auth.openAuthDialog();
      // Повторный getPlayer() нужен, чтобы подтянуть имя и аватар.
      this.player = await this.sdk.getPlayer({ scopes: false });
      this.authorized = this.player.isAuthorized?.() ?? true;

      if (this.authorized) {
        // Игрок вошёл — облачные сохранения снова имеют смысл.
        this.isGuest = false;
        console.log('[Yandex SDK] Игрок авторизовался:', this.getPlayerName());
      }

      return this.authorized;
    } catch (error) {
      console.log('[Yandex SDK] Авторизация отклонена игроком:', error);
      return false;
    }
  }
}

export const yandexSdk = new YandexSdkService();
