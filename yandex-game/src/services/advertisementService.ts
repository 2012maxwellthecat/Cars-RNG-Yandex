import type { YandexGamesSdk } from "../types/yandex-games";
import { detectEnvironment } from "../config/environment";

/**
 * Типы рекламы
 */
export type AdType = 'fullscreen' | 'rewarded' | 'free-spin' | 'bonus-money' | 'free-case' | 'upgrade-discount';

/**
 * Статистика показов рекламы
 */
export interface AdStatistics {
  fullscreenShown: number;
  rewardedShown: number;
  totalRewarded: number;
  errors: number;
}

/**
 * Сервис управления рекламой Yandex Games
 * Централизованное API для показа fullscreen и rewarded video рекламы
 */
export class AdvertisementService {
  private sdk: YandexGamesSdk | null = null;
  private cooldowns = new Map<string, number>();
  private stats: AdStatistics = {
    fullscreenShown: 0,
    rewardedShown: 0,
    totalRewarded: 0,
    errors: 0,
  };

  /**
   * Инициализация сервиса с SDK
   */
  init(sdk: YandexGamesSdk | null): void {
    this.sdk = sdk;
    const env = detectEnvironment();

    if (env.shouldUseMockAds) {
      console.log('[Advertisement] Используется mock реклама (dev режим)');
    } else {
      console.log('[Advertisement] Используется настоящая Yandex реклама');
    }
  }

  /**
   * Показать fullscreen рекламу (межуровневую)
   * @param onClose Callback после закрытия рекламы
   * @returns Promise<boolean> - true если реклама была показана
   */
  async showFullscreenAd(onClose?: () => void): Promise<boolean> {
    const cooldownMs = 180000; // 3 минуты

    if (!this.canShowAd('fullscreen', cooldownMs)) {
      console.log('[Advertisement] Fullscreen реклама на cooldown');
      onClose?.();
      return false;
    }

    const env = detectEnvironment();

    // Mock режим (разработка)
    if (env.shouldUseMockAds) {
      console.log('[Advertisement] Mock fullscreen ad');
      await this.delay(1000);
      this.setCooldown('fullscreen');
      this.stats.fullscreenShown++;
      onClose?.();
      return true;
    }

    // Настоящая реклама (production)
    if (!this.sdk?.adv) {
      console.warn('[Advertisement] SDK реклама недоступна');
      onClose?.();
      return false;
    }

    return new Promise((resolve) => {
      this.sdk!.adv!.showFullscreenAdv({
        callbacks: {
          onClose: (wasShown) => {
            if (wasShown) {
              this.stats.fullscreenShown++;
              this.setCooldown('fullscreen');
              console.log('[Advertisement] Fullscreen реклама показана');
            } else {
              console.log('[Advertisement] Fullscreen реклама не показана');
            }
            onClose?.();
            resolve(wasShown);
          },
          onError: (err) => {
            console.error('[Advertisement] Ошибка fullscreen рекламы:', err);
            this.stats.errors++;
            onClose?.();
            resolve(false);
          },
        },
      });
    });
  }

  /**
   * Показать rewarded video рекламу (с наградой)
   * @param onReward Callback для выдачи награды (вызывается только при успешном просмотре)
   * @param adType Тип рекламы для cooldown трекинга
   * @param cooldownMs Cooldown в миллисекундах (по умолчанию 10 минут)
   * @returns Promise<boolean> - true если реклама просмотрена и награда выдана
   */
  async showRewardedAd(
    onReward: () => void,
    adType: AdType = 'rewarded',
    cooldownMs: number = 600000
  ): Promise<boolean> {
    if (!this.canShowAd(adType, cooldownMs)) {
      console.log(`[Advertisement] Rewarded реклама "${adType}" на cooldown`);
      return false;
    }

    const env = detectEnvironment();

    // Mock режим (разработка)
    if (env.shouldUseMockAds) {
      console.log(`[Advertisement] Mock rewarded ad: ${adType}`);
      await this.delay(2000);
      this.setCooldown(adType);
      this.stats.rewardedShown++;
      this.stats.totalRewarded++;
      onReward();
      return true;
    }

    // Настоящая реклама (production)
    if (!this.sdk?.adv) {
      console.warn('[Advertisement] SDK реклама недоступна');
      return false;
    }

    return new Promise((resolve) => {
      this.sdk!.adv!.showRewardedVideo({
        callbacks: {
          onRewarded: () => {
            this.stats.rewardedShown++;
            this.stats.totalRewarded++;
            this.setCooldown(adType);
            console.log(`[Advertisement] Rewarded реклама "${adType}" просмотрена, награда выдана`);
            onReward();
            resolve(true);
          },
          onClose: () => {
            console.log('[Advertisement] Rewarded реклама закрыта');
            resolve(false);
          },
          onError: (err) => {
            console.error('[Advertisement] Ошибка rewarded рекламы:', err);
            this.stats.errors++;
            resolve(false);
          },
        },
      });
    });
  }

  /**
   * Проверить, можно ли показать рекламу (с учетом cooldown)
   * @param adType Тип рекламы
   * @param cooldownMs Cooldown в миллисекундах
   * @returns true если реклама доступна
   */
  canShowAd(adType: string, cooldownMs: number): boolean {
    const lastShown = this.cooldowns.get(adType) || 0;
    const now = Date.now();
    return now - lastShown >= cooldownMs;
  }

  /**
   * Получить время до следующего доступного показа
   * @param adType Тип рекламы
   * @param cooldownMs Cooldown в миллисекундах
   * @returns Оставшееся время в миллисекундах (0 если доступна)
   */
  getTimeUntilAvailable(adType: string, cooldownMs: number): number {
    const lastShown = this.cooldowns.get(adType) || 0;
    const now = Date.now();
    const elapsed = now - lastShown;
    return Math.max(0, cooldownMs - elapsed);
  }

  /**
   * Форматировать оставшееся время для UI
   * @param ms Миллисекунды
   * @returns Строка формата "5:30" или "0:45"
   */
  formatTimeRemaining(ms: number): string {
    if (ms <= 0) return '0:00';
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Установить cooldown для типа рекламы
   */
  private setCooldown(adType: string): void {
    this.cooldowns.set(adType, Date.now());
  }

  /**
   * Задержка для mock рекламы
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Получить статистику показов
   */
  getStats(): AdStatistics {
    return { ...this.stats };
  }

  /**
   * Сбросить все cooldowns (для тестирования)
   */
  resetCooldowns(): void {
    this.cooldowns.clear();
    console.log('[Advertisement] Все cooldowns сброшены');
  }

  /**
   * Проверить доступность рекламного API
   */
  isAvailable(): boolean {
    return this.sdk !== null && this.sdk.adv !== undefined;
  }
}

// Singleton instance
export const advertisementService = new AdvertisementService();
