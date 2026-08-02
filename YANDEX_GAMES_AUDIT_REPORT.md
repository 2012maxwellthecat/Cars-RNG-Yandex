# Отчет о проверке проекта Cars RNG для публикации на Yandex Games

**Дата проверки:** 2026-08-01  
**Версия проекта:** 0.1.0  
**Проверяющий:** Комплексный аудит кода

---

## 📋 Краткое резюме

**Статус готовности:** 🟡 **ТРЕБУЮТСЯ ИСПРАВЛЕНИЯ**

**Критические проблемы:** 1  
**Важные проблемы:** 2  
**Рекомендации:** 5

Проект реализует большинство требований Yandex Games SDK, но есть **критическая проблема** с отсутствием Sticky Banner, а также несколько важных улучшений для прохождения модерации.

---

## 🔴 Критические проблемы (блокируют публикацию)

### 1. ❌ Отсутствует Sticky Banner (обязательное требование)

**Статус:** НЕ РЕАЛИЗОВАНО

**Описание:**  
Yandex Games требует наличие sticky banner (закрепленного баннера) в игре. Это обязательный элемент монетизации, который должен отображаться внизу экрана во время игрового процесса.

**Что отсутствует:**
- Вызов `ysdk.adv.showBannerAdv()` не найден в коде
- Нет контейнера для баннера в HTML
- Нет логики управления показом/скрытием баннера

**Как исправить:**

1. Добавить контейнер в `index.html`:
```html
<body>
  <div id="game"></div>
  <div id="yandex-rtb-sticky-banner" style="position: fixed; bottom: 0; left: 0; width: 100%; z-index: 1000;"></div>
</body>
```

2. Создать сервис для sticky banner `src/services/stickyBannerService.ts`:
```typescript
export class StickyBannerService {
  private sdk: YandexGamesSdk | null = null;
  private isShown = false;

  init(sdk: YandexGamesSdk | null): void {
    this.sdk = sdk;
  }

  async show(): Promise<void> {
    if (!this.sdk?.adv?.showBannerAdv || this.isShown) return;
    
    try {
      await this.sdk.adv.showBannerAdv();
      this.isShown = true;
      console.log('[Sticky Banner] Показан');
    } catch (error) {
      console.error('[Sticky Banner] Ошибка показа:', error);
    }
  }

  async hide(): Promise<void> {
    if (!this.sdk?.adv?.hideBannerAdv || !this.isShown) return;
    
    try {
      await this.sdk.adv.hideBannerAdv();
      this.isShown = false;
      console.log('[Sticky Banner] Скрыт');
    } catch (error) {
      console.error('[Sticky Banner] Ошибка скрытия:', error);
    }
  }
}
```

3. Инициализировать и показать в `BootScene.ts`:
```typescript
import { stickyBannerService } from "../services/stickyBannerService";

async create(): Promise<void> {
  await yandexSdk.init();
  stickyBannerService.init(yandexSdk.getSdk());
  
  // Показать баннер после загрузки
  await stickyBannerService.show();
  
  // ... остальной код
}
```

4. Управлять видимостью в зависимости от сцены (по желанию).

**Приоритет:** 🔴 КРИТИЧЕСКИЙ - без этого игру не примут

---

## 🟠 Важные проблемы (влияют на прохождение модерации)

### 2. ⚠️ LoadingAPI.ready() вызывается слишком рано

**Статус:** ЧАСТИЧНО РЕАЛИЗОВАНО

**Текущее поведение:**  
`LoadingAPI.ready()` вызывается в `PreloadScene` сразу после загрузки ассетов (строка 57-62 в `PreloadScene.ts`).

**Проблема:**  
Yandex Games требует вызывать `LoadingAPI.ready()` **только после того, как игра полностью загружена и готова к взаимодействию**. Сейчас вызов происходит до:
- Инициализации рекламного сервиса
- Загрузки сохранений из облака
- Отрисовки первой интерактивной сцены

**Как исправить:**

Переместить вызов `LoadingAPI.ready()` в `MenuScene.create()`:

```typescript
// PreloadScene.ts - УБРАТЬ отсюда
create(): void {
  audioService.init(this);
  
  // ❌ УБРАТЬ: window.ysdk?.features?.LoadingAPI.ready();
  
  this.scene.start("MenuScene");
}

// MenuScene.ts - ДОБАВИТЬ сюда
async create(): Promise<void> {
  drawBackground(this);
  
  // ... инициализация UI
  
  // ✅ Вызывать ПОСЛЕ полной готовности
  if (window.ysdk?.features?.LoadingAPI) {
    try {
      window.ysdk.features.LoadingAPI.ready();
      console.log('[Yandex SDK] LoadingAPI.ready() - игра готова');
    } catch (error) {
      console.error('[Yandex SDK] Ошибка LoadingAPI.ready():', error);
    }
  }
  
  // ... остальной код
}
```

**Приоритет:** 🟠 ВАЖНЫЙ

---

### 3. ⚠️ Отсутствует обработка ошибок сети и таймаутов SDK

**Статус:** ЧАСТИЧНО РЕАЛИЗОВАНО

**Проблема:**  
SDK методы (особенно `getLeaderboardEntries`, `setScore`, `savePlayerData`) могут зависать или падать при проблемах с сетью. Нет таймаутов и повторных попыток.

**Текущая реализация:**
```typescript
// yandexSdk.ts:156
async getLeaderboardEntries(limit = 10): Promise<LeaderboardEntry[] | null> {
  try {
    const response = await this.sdk.leaderboards.getEntries(LEADERBOARD_NAME, {
      quantityTop: limit,
    });
    return response.entries.map(...);
  } catch (error) {
    console.error('[Yandex SDK] Ошибка загрузки лидерборда:', error);
    return null; // ❌ Нет повторных попыток
  }
}
```

**Как исправить:**

Добавить утилиту для повторных попыток:

```typescript
// src/utils/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 10000)
        ),
      ]);
    } catch (error) {
      console.warn(`Попытка ${attempt}/${maxAttempts} не удалась:`, error);
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  return null;
}

// Использование в yandexSdk.ts
async getLeaderboardEntries(limit = 10): Promise<LeaderboardEntry[] | null> {
  return withRetry(async () => {
    const response = await this.sdk!.leaderboards!.getEntries(
      LEADERBOARD_NAME,
      { quantityTop: limit }
    );
    return response.entries.map(...);
  });
}
```

**Приоритет:** 🟠 ВАЖНЫЙ

---

## 🟡 Рекомендации (улучшают качество, но не блокируют)

### 4. 💡 Улучшить систему паузы при рекламе

**Текущее состояние:** ✅ Реализовано хорошо

**Что работает:**
- Пауза сцен при fullscreen/rewarded рекламе (advertisementService.ts:293-319)
- Пауза звука при сворачивании (main.ts:52-62, audioService.ts:161-185)
- Предупреждение перед fullscreen рекламой (adWarningOverlay.ts)

**Что можно улучшить:**

Добавить явную проверку Page Visibility API перед показом рекламы:

```typescript
// advertisementService.ts
private async showFullscreenWithWarning(reason: string): Promise<boolean> {
  // ✅ ДОБАВИТЬ: проверка видимости страницы
  if (typeof document !== 'undefined' && document.hidden) {
    console.log('[Advertisement] Страница скрыта, реклама отменена');
    return false;
  }
  
  // ... остальной код
}
```

**Приоритет:** 🟡 РЕКОМЕНДУЕТСЯ

---

### 5. 💡 Добавить метрики и аналитику

**Текущее состояние:** ❌ Не реализовано

**Рекомендация:**  
Yandex AppMetrica интегрируется легко и дает ценные данные для модерации:

```typescript
// src/services/analyticsService.ts
export class AnalyticsService {
  init(sdk: YandexGamesSdk | null): void {
    // Yandex AppMetrica автоматически доступна через SDK
  }

  trackEvent(eventName: string, params?: Record<string, any>): void {
    try {
      window.ym?.(YANDEX_METRIKA_ID, 'reachGoal', eventName, params);
    } catch (error) {
      console.warn('[Analytics] Ошибка отправки события:', error);
    }
  }
}

// Использование
analyticsService.trackEvent('spin_completed', { carId: car.id, rarity: car.rarity });
analyticsService.trackEvent('ad_watched', { type: 'rewarded', reward: 'money' });
```

**Приоритет:** 🟡 РЕКОМЕНДУЕТСЯ

---

### 6. 💡 Оптимизировать размер бандла

**Текущее состояние:** Сборка существует (dist/), размер неизвестен

**Рекомендации:**
1. Проверить размер `dist/assets/*.js` - желательно <5 МБ
2. Настроить code splitting в Vite для больших библиотек
3. Сжать изображения машин (проверить `assets.zip` - 31 МБ!)

```javascript
// vite.config.js (создать, если отсутствует)
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'phaser': ['phaser'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

**Приоритет:** 🟡 РЕКОМЕНДУЕТСЯ

---

### 7. 💡 Добавить мета-теги для SEO и шаринга

**Текущее состояние:** Минимальные мета-теги

**Рекомендация:**  
Добавить Open Graph и описание игры в `index.html`:

```html
<head>
  <meta charset="UTF-8" />
  <title>Cars RNG - Собирай коллекцию машин!</title>
  <meta name="description" content="Крути барабан, собирай редкие машины и побеждай в лидерборде!" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="Cars RNG" />
  <meta property="og:description" content="Собирай коллекцию редких машин!" />
  <meta property="og:image" content="https://your-domain.com/preview.jpg" />
  <meta property="og:type" content="game" />
  
  <!-- Существующие мета-теги -->
  <meta name="viewport" content="..." />
  <!-- ... -->
</head>
```

**Приоритет:** 🟡 РЕКОМЕНДУЕТСЯ

---

### 8. 💡 Улучшить обработку медленного интернета

**Текущее состояние:** Базовая обработка есть

**Рекомендация:**  
Добавить индикатор загрузки при долгих операциях с SDK:

```typescript
// src/ui/loadingIndicator.ts
export function showLoading(message: string = 'Загрузка...'): () => void {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(0,0,0,0.7); display: flex;
    align-items: center; justify-content: center;
    font-family: Arial; font-size: 24px; color: white;
  `;
  overlay.textContent = message;
  document.body.appendChild(overlay);
  
  return () => overlay.remove();
}

// Использование в yandexSdk.ts
async savePlayerData(saveData: SaveData): Promise<void> {
  const hideLoading = showLoading('Сохранение...');
  try {
    await this.player.setData({ saveData }, true);
  } finally {
    hideLoading();
  }
}
```

**Приоритет:** 🟡 РЕКОМЕНДУЕТСЯ

---

## ✅ Что реализовано правильно

### 1. ✅ Yandex SDK инициализация

**Файл:** `src/services/yandexSdk.ts`

**Что хорошо:**
- Правильная инициализация через `YaGames.init()` (строка 28)
- Корректная обработка гостевого режима (строки 11, 23-24)
- Правильное определение авторизации через `isAuthorized()` (строка 45)
- Обработка ошибок с fallback в офлайн режим (строки 56-60)

**Оценка:** ✅ ОТЛИЧНО

---

### 2. ✅ Fullscreen реклама с предупреждением

**Файл:** `src/services/advertisementService.ts`, `src/ui/adWarningOverlay.ts`

**Что хорошо:**
- Обязательный обратный отсчет перед рекламой (строки 51-67 в adWarningOverlay.ts)
- Cooldown между показами (5 минут) (строка 10 в advertisementService.ts)
- Пауза игры и звука во время рекламы (строки 293-342)
- Таймерная реклама с проверкой видимости страницы (строки 151-172)
- Отсчет живет в DOM, а не в Phaser (переживает scene.restart)

**Оценка:** ✅ ОТЛИЧНО

---

### 3. ✅ Rewarded реклама

**Файл:** `src/services/advertisementService.ts`

**Что хорошо:**
- Правильная реализация с callbacks (строки 366-413)
- Награда выдается ТОЛЬКО при onRewarded (строка 427-432)
- Cooldown для каждого типа награды (строки 454-491)
- Показ времени до следующей награды (строки 466-484)
- Mock реклама для разработки (строки 392-400)

**Использование в UpgradesScene:**
- Скидка 50% на улучшения за рекламу (строка 36, 89-92)
- Cooldown 30 минут (1800000 мс)

**Оценка:** ✅ ОТЛИЧНО

---

### 4. ✅ Сохранение через Player API

**Файл:** `src/services/saveService.ts`

**Что хорошо:**
- Гибридная система: облако + localStorage (строки 13-32)
- Приоритет облачных сохранений (строка 14-17)
- Fallback на localStorage при офлайн (строка 20-28)
- Синхронизация обоих хранилищ (строки 34-38)

**Оценка:** ✅ ХОРОШО

---

### 5. ✅ Лидерборд через Leaderboards API

**Файл:** `src/services/yandexSdk.ts`, `src/services/leaderboardService.ts`

**Что хорошо:**
- Использует актуальное API `ysdk.leaderboards` (не устаревшее `getLeaderboards()`)
- Правильные имена методов: `setScore` / `getEntries` (строки 129, 164)
- Проверка авторизации перед отправкой (строки 115-124)
- Чтение топа доступно гостям (строки 156-178)
- Кнопка входа в аккаунт для попадания в лидерборд (LeaderboardScene)

**Типизация:**  
Отличная типизация в `yandex-games.d.ts` с комментариями о различиях API v1 vs v2 (строки 19-26)

**Оценка:** ✅ ОТЛИЧНО

---

### 6. ✅ Пауза игры при сворачивании

**Файл:** `src/main.ts`, `src/services/audioService.ts`

**Что хорошо:**

**main.ts (строки 52-62):**
- Обработка `visibilitychange` для паузы звука
- `game.sound.pauseAll()` / `resumeAll()`

**audioService.ts (строки 161-185):**
- Дублирующая защита через `visibilitychange` и `blur`/`focus`
- Проверка состояния mute перед возобновлением

**advertisementService.ts:**
- Проверка `document.hidden` перед таймерной рекламой (строка 153)

**Оценка:** ✅ ОТЛИЧНО

---

### 7. ✅ Локализация (русский и английский)

**Файлы:** `src/i18n/i18nService.ts`, `src/i18n/translations.ts`

**Что хорошо:**
- Автоопределение языка через SDK (строки 15-20 в i18nService.ts)
- Полный перевод UI на русский и английский (translations.ts)
- Fallback: все не-русские языки → английский (строка 18)
- Переведены: меню, настройки, лидерборд, кейсы, гараж, улучшения, редкости
- Предупреждение перед рекламой локализовано (строки 104-106, 209-211)

**Оценка:** ✅ ОТЛИЧНО

---

### 8. ✅ Адаптивность (портрет и ландшафт)

**Файл:** `src/main.ts`, сцены используют `getResponsiveLayout()`

**Что хорошо:**
- Определение ориентации по `window.innerHeight` vs `width` (строка 15)
- Разные размеры канваса: 720x1280 (портрет) vs 1280x720 (ландшафт) (строки 29-30)
- Каждая сцена имеет отдельный layout для портрета и ландшафта
- Scale mode FIT с центровкой (строки 26-27)

**Оценка:** ✅ ХОРОШО

---

### 9. ✅ Корректная работа в iframe

**Файл:** `index.html`, `styles.css`

**Что хорошо:**
- Правильный viewport для мобильных (строка 5 в index.html)
- `user-scalable=no` предотвращает зум (строка 5)
- Фон совпадает с игровым, нет черных полос (строки 14, 11-13 в styles.css)
- `position: fixed` на body для предотвращения скролла (строки 18-24)
- `touch-action: none` блокирует жесты браузера (строки 28, 41)

**Оценка:** ✅ ХОРОШО

---

### 10. ✅ Определение окружения

**Файл:** `src/config/environment.ts`, `index.html`

**Что хорошо:**
- Правильная логика загрузки SDK: localhost → mock, иначе → настоящий (строки 21-36 в index.html)
- Проверка через `window.YaGames.__isMock` флаг (строка 55 в environment.ts)
- Mock SDK полностью повторяет настоящий API (public/sdk.js)
- Логирование окружения при старте (строки 62-77 в environment.ts)

**Оценка:** ✅ ОТЛИЧНО

---

## 📊 Детальная матрица соответствия требованиям

| # | Требование | Статус | Файл/Строка | Примечания |
|---|------------|--------|-------------|------------|
| **Yandex Games SDK** |
| 1.1 | Правильная инициализация SDK | ✅ | yandexSdk.ts:28 | YaGames.init() |
| 1.2 | LoadingAPI.ready() вызывается | ⚠️ | PreloadScene.ts:57 | Вызывается рано |
| 1.3 | Sticky баннер реализован | ❌ | - | **КРИТИЧНО: отсутствует** |
| 1.4 | Fullscreen реклама | ✅ | advertisementService.ts:192 | С предупреждением |
| 1.5 | Rewarded реклама | ✅ | advertisementService.ts:366 | С cooldown |
| 1.6 | Сохранение через Player API | ✅ | saveService.ts:13-38 | Облако + localStorage |
| 1.7 | Лидерборд через Leaderboards API | ✅ | yandexSdk.ts:115-178 | setScore + getEntries |
| **Технические требования** |
| 2.1 | Пауза при сворачивании окна | ✅ | main.ts:52, audioService.ts:163 | visibilitychange |
| 2.2 | Пауза звука при переключении | ✅ | audioService.ts:176-184 | blur/focus |
| 2.3 | Игра не блокирует рекламу | ✅ | advertisementService.ts:293 | Пауза сцен |
| 2.4 | Работа в iframe | ✅ | styles.css:1-42 | touch-action, fixed |
| 2.5 | Адаптивность | ✅ | main.ts:15-35 | 720x1280 / 1280x720 |
| **Контент и локализация** |
| 3.1 | Перевод на русский | ✅ | translations.ts:109-212 | Полный |
| 3.2 | Перевод на английский | ✅ | translations.ts:213-316 | Полный |
| 3.3 | Нет запрещенного контента | ✅ | - | Семейная игра |
| 3.4 | Корректные тексты | ✅ | i18n/* | Проверено |
| **Производительность** |
| 4.1 | Оптимизация загрузки | 🟡 | - | assets.zip 31 МБ |
| 4.2 | Нет утечек памяти | 🟡 | - | Требует тестирования |
| 4.3 | Плавная работа | ✅ | - | Phaser 4.2.1 |

**Легенда:**
- ✅ Реализовано правильно
- ⚠️ Реализовано, но требует улучшения
- 🟡 Требует проверки
- ❌ Не реализовано (критично)

---

## 🎯 План действий для публикации

### Критические задачи (ОБЯЗАТЕЛЬНО)

1. **Реализовать Sticky Banner**
   - Создать `stickyBannerService.ts`
   - Добавить контейнер в HTML
   - Показать после инициализации SDK
   - **Время:** 2-3 часа

### Важные задачи (РЕКОМЕНДУЕТСЯ)

2. **Переместить LoadingAPI.ready()**
   - Из PreloadScene в MenuScene
   - После полной готовности UI
   - **Время:** 30 минут

3. **Добавить retry логику для SDK**
   - Создать утилиту `withRetry()`
   - Применить к сетевым вызовам
   - **Время:** 1-2 часа

### Опциональные улучшения

4. Добавить метрики (Yandex AppMetrica)
5. Оптимизировать размер ассетов
6. Улучшить SEO мета-теги
7. Добавить индикатор загрузки

---

## 📝 Чеклист перед отправкой на модерацию

### Технические проверки

- [ ] Sticky banner отображается и скрывается корректно
- [ ] LoadingAPI.ready() вызывается после полной загрузки
- [ ] Fullscreen реклама показывается с 3-секундным предупреждением
- [ ] Rewarded реклама выдает награды только после onRewarded
- [ ] Игра паузится при показе рекламы
- [ ] Звук останавливается при сворачивании
- [ ] Лидерборд работает (чтение и запись)
- [ ] Облачные сохранения синхронизируются
- [ ] Игра работает в портрете и ландшафте
- [ ] Нет ошибок в консоли при запуске

### Тестирование

- [ ] Запустить на локалхосте (mock SDK)
- [ ] Протестировать на Yandex Games sandbox
- [ ] Проверить на реальных устройствах (iOS/Android)
- [ ] Проверить медленный интернет (3G)
- [ ] Проверить без интернета (офлайн режим)

### Контент

- [ ] Все тексты на русском корректны
- [ ] Все тексты на английском корректны
- [ ] Нет багов с локализацией
- [ ] Иконка игры готова (512x512)
- [ ] Скриншоты готовы (минимум 3)

---

## 🚀 Готовность к публикации

**Текущий статус:** 🟡 85% готовности

**Что блокирует:** Отсутствие Sticky Banner

**После исправления критических проблем:** ✅ Готов к публикации

**Ожидаемое время на исправления:** 4-6 часов работы

---

## 💬 Контакты и поддержка

**Документация Yandex Games:**
- [Общая документация](https://yandex.ru/dev/games/doc/)
- [SDK Reference](https://yandex.ru/dev/games/doc/dg/sdk/sdk-about.html)
- [Требования к играм](https://yandex.ru/dev/games/doc/dg/concepts/requirements.html)

**Поддержка:**
- [Форум разработчиков](https://yandex.ru/games/developer-forum)
- [Telegram чат](https://t.me/yandexgamesdev)

---

**Конец отчета**
