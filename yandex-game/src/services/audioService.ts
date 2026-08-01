import Phaser from "phaser";

/**
 * Сервис для управления звуком в игре.
 * Управляет фоновой музыкой, звуковыми эффектами и настройками звука.
 */
export class AudioService {
  private static instance: AudioService | null = null;
  private scene: Phaser.Scene | null = null;
  private bgMusic: Phaser.Sound.BaseSound | null = null;
  private isMuted = false;
  private isInitialized = false;

  private constructor() {
    this.loadSettings();
    this.setupVisibilityHandlers();
  }

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  /**
   * Инициализация аудио сервиса с текущей сценой Phaser
   */
  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.isInitialized = true;
  }

  /**
   * Запуск фоновой музыки
   */
  playBackgroundMusic(key: string): void {
    if (!this.scene || !this.isInitialized) return;

    // Останавливаем предыдущую музыку если она играет
    if (this.bgMusic) {
      this.bgMusic.stop();
    }

    // Проверяем что звук существует
    if (!this.scene.cache.audio.exists(key)) {
      console.warn(`[AudioService] Audio key "${key}" not found`);
      return;
    }

    this.bgMusic = this.scene.sound.add(key, {
      loop: true,
      volume: 0.5,
    });

    if (!this.isMuted) {
      this.bgMusic.play();
    }
  }

  /**
   * Воспроизведение звукового эффекта
   */
  playSound(key: string, volume = 1.0): void {
    if (!this.scene || !this.isInitialized || this.isMuted) return;

    if (!this.scene.cache.audio.exists(key)) {
      console.warn(`[AudioService] Audio key "${key}" not found`);
      return;
    }

    this.scene.sound.play(key, { volume });
  }

  /**
   * Включение/выключение звука
   */
  toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.saveSettings();

    if (this.isMuted) {
      this.pauseAll();
    } else {
      this.resumeAll();
    }
  }

  /**
   * Установка состояния звука
   */
  setMuted(muted: boolean): void {
    if (this.isMuted === muted) return;
    this.toggleMute();
  }

  /**
   * Получение текущего состояния звука
   */
  getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Пауза всех звуков
   */
  private pauseAll(): void {
    if (this.bgMusic && this.bgMusic.isPlaying) {
      this.bgMusic.pause();
    }
  }

  /**
   * Возобновление всех звуков
   */
  private resumeAll(): void {
    if (this.bgMusic && this.bgMusic.isPaused && !this.isMuted) {
      this.bgMusic.resume();
    }
  }

  /**
   * Полная остановка музыки
   */
  stopMusic(): void {
    if (this.bgMusic) {
      this.bgMusic.stop();
    }
  }

  /**
   * Загрузка настроек из localStorage
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('audio-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.isMuted = settings.muted ?? false;
      }
    } catch (error) {
      console.warn('[AudioService] Failed to load settings:', error);
    }
  }

  /**
   * Сохранение настроек в localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('audio-settings', JSON.stringify({ muted: this.isMuted }));
    } catch (error) {
      console.warn('[AudioService] Failed to save settings:', error);
    }
  }

  /**
   * Настройка обработчиков видимости страницы
   * Останавливает звук при сворачивании окна, переключении вкладок
   */
  private setupVisibilityHandlers(): void {
    // Обработка Page Visibility API
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Страница скрыта - останавливаем звук
        this.pauseAll();
      } else {
        // Страница видима - возобновляем звук если не в муте
        if (!this.isMuted) {
          this.resumeAll();
        }
      }
    });

    // Обработка blur/focus окна (для старых браузеров)
    window.addEventListener('blur', () => {
      this.pauseAll();
    });

    window.addEventListener('focus', () => {
      if (!this.isMuted) {
        this.resumeAll();
      }
    });
  }
}

export const audioService = AudioService.getInstance();
