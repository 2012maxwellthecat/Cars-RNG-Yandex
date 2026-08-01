import type { Language, Translations } from './translations';
import { translations } from './translations';

/**
 * Сервис интернационализации игры
 * Управляет текущим языком и предоставляет переводы
 */
export class I18nService {
  private currentLanguage: Language = 'ru';

  /**
   * Установить язык игры на основе языка из Yandex SDK
   * @param sdkLanguage Язык из environment.i18n.lang (например: 'ru', 'en', 'tr')
   */
  setLanguageFromSDK(sdkLanguage: string): void {
    // Yandex SDK возвращает ISO 639-1 коды (ru, en, tr, etc.)
    // Любой язык кроме русского переводим на английский
    this.currentLanguage = sdkLanguage === 'ru' ? 'ru' : 'en';
    console.log(`[i18n] Язык установлен: ${this.currentLanguage} (SDK: ${sdkLanguage})`);
  }

  /**
   * Получить текущий язык
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Получить все переводы для текущего языка
   */
  getTranslations(): Translations {
    return translations[this.currentLanguage];
  }

  /**
   * Получить конкретный перевод
   */
  t(key: keyof Translations): string {
    return translations[this.currentLanguage][key];
  }

  /**
   * Проверить, является ли текущий язык русским
   */
  isRussian(): boolean {
    return this.currentLanguage === 'ru';
  }
}

export const i18nService = new I18nService();
