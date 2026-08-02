/**
 * Сервис для управления sticky banner (закрепленный баннер внизу экрана).
 * Это обязательный элемент монетизации для Yandex Games.
 */
class StickyBannerService {
  private static instance: StickyBannerService | null = null;
  private isShown = false;
  private bannerElement: HTMLDivElement | null = null;

  private constructor() {}

  static getInstance(): StickyBannerService {
    if (!StickyBannerService.instance) {
      StickyBannerService.instance = new StickyBannerService();
    }
    return StickyBannerService.instance;
  }

  /**
   * Показать sticky banner через Yandex SDK
   */
  async show(): Promise<void> {
    if (this.isShown) {
      console.log('[StickyBanner] Banner уже показан');
      return;
    }

    // Проверяем наличие SDK
    if (!window.ysdk?.adv?.showBannerAdv) {
      console.warn('[StickyBanner] Yandex SDK недоступен');
      this.showFallbackBanner();
      return;
    }

    try {
      await window.ysdk.adv.showBannerAdv();
      this.isShown = true;
      console.log('[StickyBanner] ✅ Sticky banner показан через SDK');
    } catch (error) {
      console.error('[StickyBanner] Ошибка показа banner:', error);
      this.showFallbackBanner();
    }
  }

  /**
   * Скрыть sticky banner
   */
  async hide(): Promise<void> {
    if (!this.isShown) {
      return;
    }

    // Скрыть через SDK
    if (window.ysdk?.adv?.hideBannerAdv) {
      try {
        await window.ysdk.adv.hideBannerAdv();
        this.isShown = false;
        console.log('[StickyBanner] Sticky banner скрыт');
      } catch (error) {
        console.error('[StickyBanner] Ошибка скрытия banner:', error);
      }
    }

    // Удалить fallback элемент
    if (this.bannerElement) {
      this.bannerElement.remove();
      this.bannerElement = null;
    }
  }

  /**
   * Fallback баннер для локальной разработки (когда SDK недоступен)
   */
  private showFallbackBanner(): void {
    if (this.bannerElement) {
      return;
    }

    // Создаем визуальный placeholder для разработки
    this.bannerElement = document.createElement('div');
    this.bannerElement.id = 'sticky-banner-fallback';
    this.bannerElement.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
    `;
    this.bannerElement.textContent = '📢 Sticky Banner (dev mode)';

    document.body.appendChild(this.bannerElement);
    this.isShown = true;
    console.log('[StickyBanner] ⚠️ Показан fallback banner (dev mode)');
  }

  /**
   * Получить текущее состояние баннера
   */
  isVisible(): boolean {
    return this.isShown;
  }
}

export const stickyBannerService = StickyBannerService.getInstance();
