import type { YandexGamesSdk } from "../types/yandex-games";
import { detectEnvironment } from "../config/environment";
import { hideAdCountdown, showAdCountdown } from "../ui/adWarningOverlay";

/**
 * Минимальный интервал между показами fullscreen-рекламы.
 * Общий для рекламы при смене сцены и для таймерной рекламы внутри сцены:
 * иначе два независимых таймера могут выдать два объявления подряд.
 */
const FULLSCREEN_AD_COOLDOWN_MS = 300000; // 5 минут

/** Сколько игрок должен пробыть в одной сцене до таймерной рекламы */
const TIMED_AD_INTERVAL_MS = 300000; // 5 минут

/** Как часто проверять, пора ли показать таймерную рекламу */
const TIMED_AD_CHECK_INTERVAL_MS = 30000; // 30 секунд

/** Длительность обратного отсчёта перед рекламой, секунды */
const AD_WARNING_SECONDS = 3;

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
  private gameInstance: Phaser.Game | null = null;
  /** Время последнего показа (точнее — запроса) любой fullscreen-рекламы */
  private lastFullscreenAdTime = 0;
  private currentSceneStartTime = 0;
  private currentSceneName = "";
  /** Идёт показ рекламы: не даём наложить второе объявление поверх первого */
  private isAdInProgress = false;
  private timedAdCheckId: number | null = null;
  /** Сцены, поставленные на паузу на время рекламы — чтобы снять ровно их */
  private pausedSceneKeys: string[] = [];
  private stats: AdStatistics = {
    fullscreenShown: 0,
    rewardedShown: 0,
    totalRewarded: 0,
    errors: 0,
  };

  /**
   * Инициализация сервиса с SDK и Phaser Game instance
   */
  init(sdk: YandexGamesSdk | null, game?: Phaser.Game): void {
    this.sdk = sdk;
    if (game) {
      this.gameInstance = game;
    }

    // Отсчитываем cooldown от старта игры, иначе первая же сцена после загрузки
    // получит fullscreen-рекламу — Yandex Games это запрещает.
    this.lastFullscreenAdTime = Date.now();
    this.startTimedAdChecks();

    const env = detectEnvironment();

    if (env.shouldUseMockAds) {
      console.log('[Advertisement] Используется mock реклама (dev режим)');
    } else {
      console.log('[Advertisement] Используется настоящая Yandex реклама');
    }
  }

  /**
   * Установить экземпляр игры (если не был передан в init)
   */
  setGameInstance(game: Phaser.Game): void {
    this.gameInstance = game;
  }

  /**
   * Уведомить сервис о смене сцены
   */
  notifySceneChange(sceneName: string): void {
    // scene.restart() внутри той же сцены не считается сменой сцены.
    // SpinScene перезапускается после каждого спина, и если сбрасывать таймер,
    // таймерная реклама с предупреждением не покажется никогда.
    if (sceneName === this.currentSceneName) {
      return;
    }

    this.currentSceneName = sceneName;
    this.currentSceneStartTime = Date.now();
    console.log(`[Advertisement] Смена сцены: ${sceneName}`);
  }

  /**
   * Периодическая проверка таймерной рекламы.
   *
   * Таймер живёт в сервисе, а не в сцене: Phaser-таймеры умирают при
   * scene.restart(), из-за чего отсчёт до рекламы обнулялся на каждом спине.
   */
  private startTimedAdChecks(): void {
    if (this.timedAdCheckId !== null) {
      return;
    }

    this.timedAdCheckId = window.setInterval(() => {
      void this.showTimedAdWithWarning();
    }, TIMED_AD_CHECK_INTERVAL_MS);
  }

  /**
   * Остановить проверку таймерной рекламы
   */
  stopTimedAdChecks(): void {
    if (this.timedAdCheckId !== null) {
      window.clearInterval(this.timedAdCheckId);
      this.timedAdCheckId = null;
    }
  }

  /**
   * Показать fullscreen рекламу при переходе между сценами.
   * Перед показом идёт обязательный обратный отсчёт.
   * Cooldown: 5 минут.
   */
  async tryShowSceneChangeAd(): Promise<boolean> {
    if (!this.canShowFullscreenAd()) {
      console.log('[Advertisement] Fullscreen при смене сцены на cooldown');
      return false;
    }

    return this.showFullscreenWithWarning('при смене сцены');
  }

  /**
   * Показать fullscreen рекламу внутри сцены с обратным отсчётом.
   * Метод вызывается периодически; реклама покажется, когда игрок пробудет
   * в одной сцене TIMED_AD_INTERVAL_MS и пройдёт общий cooldown.
   */
  async showTimedAdWithWarning(): Promise<boolean> {
    // Игра свёрнута: игрок не увидит отсчёт, а показ сгорит вместе с cooldown.
    if (typeof document !== 'undefined' && document.hidden) {
      return false;
    }

    const timeInScene = Date.now() - this.currentSceneStartTime;

    if (timeInScene < TIMED_AD_INTERVAL_MS) {
      return false;
    }

    if (!this.canShowFullscreenAd()) {
      return false;
    }

    // Сброс отсчёта времени в сцене, чтобы следующий показ был не раньше
    // чем через TIMED_AD_INTERVAL_MS.
    this.currentSceneStartTime = Date.now();

    return this.showFullscreenWithWarning(`в сцене ${this.currentSceneName}`);
  }

  /**
   * Можно ли сейчас показать fullscreen рекламу
   */
  private canShowFullscreenAd(): boolean {
    if (this.isAdInProgress) {
      return false;
    }

    return Date.now() - this.lastFullscreenAdTime >= FULLSCREEN_AD_COOLDOWN_MS;
  }

  /**
   * Единый путь показа fullscreen рекламы: обратный отсчёт → пауза звука →
   * объявление. Все fullscreen-показы идут через этот метод, поэтому
   * предупреждение невозможно случайно пропустить.
   *
   * @param reason Причина показа, только для логов
   */
  private async showFullscreenWithWarning(reason: string): Promise<boolean> {
    if (this.isAdInProgress) {
      console.log('[Advertisement] Реклама уже показывается, пропуск');
      return false;
    }

    const env = detectEnvironment();

    // Если рекламы всё равно не будет, не мучаем игрока отсчётом.
    if (!env.shouldUseMockAds && !this.sdk?.adv) {
      console.warn('[Advertisement] SDK реклама недоступна');
      return false;
    }

    this.isAdInProgress = true;
    // Cooldown считаем от запроса, а не от успешного показа: Yandex может
    // не отдать объявление, и иначе игрок увидит отсчёт снова через минуту.
    this.lastFullscreenAdTime = Date.now();

    try {
      // Пауза до отсчёта, а не после: игрок уже не играет, и за оверлеем
      // не должны доигрывать анимации, автокрутка и delayedCall.
      this.pauseGame();
      await showAdCountdown(AD_WARNING_SECONDS);

      if (env.shouldUseMockAds) {
        console.log(`[Advertisement] Mock fullscreen ad ${reason}`);
        await this.delay(1000);
        this.stats.fullscreenShown++;
        return true;
      }

      return await this.callFullscreenAdv(reason);
    } finally {
      hideAdCountdown();
      this.resumeGame();
      this.isAdInProgress = false;
    }
  }

  /**
   * Обёртка над SDK showFullscreenAdv в виде Promise
   */
  private callFullscreenAdv(reason: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.sdk!.adv!.showFullscreenAdv({
        callbacks: {
          onClose: (wasShown) => {
            if (wasShown) {
              this.stats.fullscreenShown++;
              console.log(`[Advertisement] Fullscreen реклама ${reason} показана`);
            } else {
              console.log('[Advertisement] Fullscreen реклама не показана');
            }
            resolve(wasShown);
          },
          onError: (err) => {
            console.error('[Advertisement] Ошибка fullscreen рекламы:', err);
            this.stats.errors++;
            resolve(false);
          },
        },
      });
    });
  }

  /**
   * Поставить звук игры на паузу
   */
  private pauseGameSound(): void {
    if (this.gameInstance?.sound) {
      this.gameInstance.sound.pauseAll();
      console.log('[Advertisement] Звук игры приостановлен');
    }
  }

  /**
   * Возобновить звук игры
   */
  private resumeGameSound(): void {
    if (this.gameInstance?.sound) {
      this.gameInstance.sound.resumeAll();
      console.log('[Advertisement] Звук игры возобновлен');
    }
  }

  /**
   * Поставить игру на паузу на время отсчёта и самой рекламы.
   *
   * Паузим сцены, а не игровой цикл целиком: цикл нужен живым, иначе
   * SceneManager не обработает отложенные операции вроде scene.restart().
   *
   * Что даёт пауза сцены: SceneManager.update() шагает только сцены со
   * статусом до RUNNING включительно, а пауза ставит PAUSED — то есть
   * замирают Clock (delayedCall), твины и update(). Рендер при этом
   * продолжается (гейт рендера пропускает PAUSED), поэтому под оверлеем
   * остаётся нормальный кадр, а не чёрный экран.
   *
   * Обратный отсчёт от паузы не страдает: он живёт в DOM на setTimeout,
   * а не на таймерах Phaser.
   */
  private pauseGame(): void {
    this.pauseGameSound();

    if (!this.gameInstance) {
      return;
    }

    /*
     * getScenes(true) отдаёт только сцены со статусом RUNNING — и это
     * намеренно. Сцену, которая ещё находится внутри create(), паузить нельзя:
     * SceneManager.create() после выхода из create() безусловно выставляет
     * status = RUNNING, а флаг active остался бы false. Сцена застряла бы в
     * рассогласованном состоянии, и все последующие паузы для неё молча
     * перестали бы работать (Systems.pause() проверяет active).
     *
     * Практическое следствие: при рекламе на переходе между сценами паузить
     * нечего — предыдущая сцена уже остановлена, а новая ещё не запущена и
     * успела только нарисовать фон. Пауза важна для таймерной рекламы, когда
     * игрок реально играет (например, идёт автокрутка в SpinScene).
     */
    for (const scene of this.gameInstance.scene.getScenes(true)) {
      const key = scene.sys.settings.key;
      this.gameInstance.scene.pause(key);
      this.pausedSceneKeys.push(key);
      console.log(`[Advertisement] Сцена ${key} на паузе`);
    }
  }

  /**
   * Снять игру с паузы.
   *
   * Возвращаем только те сцены, которые сами и остановили. Сцену, успевшую
   * за время рекламы перезапуститься (rewarded-коллбэки делают
   * scene.restart()), не трогаем — она уже работает.
   */
  private resumeGame(): void {
    const keys = this.pausedSceneKeys;
    this.pausedSceneKeys = [];

    if (this.gameInstance) {
      for (const key of keys) {
        if (this.gameInstance.scene.isPaused(key)) {
          this.gameInstance.scene.resume(key);
          console.log(`[Advertisement] Сцена ${key} снята с паузы`);
        }
      }
    }

    this.resumeGameSound();
  }

  /**
   * Показать fullscreen рекламу (межуровневую) с обратным отсчётом.
   *
   * В отличие от tryShowSceneChangeAd не проверяет общий интервал: вызывать
   * только там, где реклама уместна по сценарию игры.
   *
   * @param onClose Callback после закрытия рекламы
   * @returns Promise<boolean> - true если реклама была показана
   */
  async showFullscreenAd(onClose?: () => void): Promise<boolean> {
    const wasShown = await this.showFullscreenWithWarning('межуровневая');
    onClose?.();
    return wasShown;
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
    if (this.isAdInProgress) {
      console.log('[Advertisement] Реклама уже показывается, пропуск');
      return false;
    }

    if (!this.canShowAd(adType, cooldownMs)) {
      console.log(`[Advertisement] Rewarded реклама "${adType}" на cooldown`);
      return false;
    }

    const env = detectEnvironment();

    // Обратный отсчёт здесь не нужен: игрок сам нажал «Смотреть рекламу»,
    // это и есть предупреждение. Отсчёт обязателен для рекламы, которая
    // прерывает игру без запроса игрока.
    this.isAdInProgress = true;
    // Игра не должна тикать и за rewarded-видео, хотя отсчёта здесь нет.
    this.pauseGame();

    try {
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

      return await this.callRewardedVideo(onReward, adType);
    } finally {
      this.resumeGame();
      this.isAdInProgress = false;
    }
  }

  /**
   * Обёртка над SDK showRewardedVideo в виде Promise.
   * Промис завершается на закрытии объявления, чтобы звук игры не возвращался
   * поверх ещё идущего видео.
   */
  private callRewardedVideo(onReward: () => void, adType: AdType): Promise<boolean> {
    return new Promise((resolve) => {
      let rewarded = false;

      this.sdk!.adv!.showRewardedVideo({
        callbacks: {
          onRewarded: () => {
            rewarded = true;
            this.stats.rewardedShown++;
            this.stats.totalRewarded++;
            this.setCooldown(adType);
            console.log(`[Advertisement] Rewarded реклама "${adType}" просмотрена, награда выдана`);
            onReward();
          },
          onClose: () => {
            console.log('[Advertisement] Rewarded реклама закрыта');
            resolve(rewarded);
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
