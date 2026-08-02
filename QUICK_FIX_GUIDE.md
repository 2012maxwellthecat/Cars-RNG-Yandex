# 🚀 Быстрое руководство по исправлениям для Yandex Games

## ❌ КРИТИЧНО: Sticky Banner (БЕЗ ЭТОГО НЕ ПРИМУТ)

### Шаг 1: Добавить типы в yandex-games.d.ts

```typescript
// src/types/yandex-games.d.ts
export type YandexGamesSdk = {
  // ... существующие поля
  adv?: {
    showFullscreenAdv(...): void;
    showRewardedVideo(...): void;
    // ✅ ДОБАВИТЬ:
    showBannerAdv(): Promise<void>;
    hideBannerAdv(): Promise<void>;
  };
};
```

### Шаг 2: Создать сервис

```typescript
// src/services/stickyBannerService.ts
import type { YandexGamesSdk } from "../types/yandex-games";

export class StickyBannerService {
  private sdk: YandexGamesSdk | null = null;
  private isShown = false;

  init(sdk: YandexGamesSdk | null): void {
    this.sdk = sdk;
  }

  async show(): Promise<boolean> {
    if (!this.sdk?.adv?.showBannerAdv || this.isShown) {
      return false;
    }
    
    try {
      await this.sdk.adv.showBannerAdv();
      this.isShown = true;
      console.log('[Sticky Banner] Показан');
      return true;
    } catch (error) {
      console.error('[Sticky Banner] Ошибка показа:', error);
      return false;
    }
  }

  async hide(): Promise<boolean> {
    if (!this.sdk?.adv?.hideBannerAdv || !this.isShown) {
      return false;
    }
    
    try {
      await this.sdk.adv.hideBannerAdv();
      this.isShown = false;
      console.log('[Sticky Banner] Скрыт');
      return true;
    } catch (error) {
      console.error('[Sticky Banner] Ошибка скрытия:', error);
      return false;
    }
  }

  isVisible(): boolean {
    return this.isShown;
  }
}

export const stickyBannerService = new StickyBannerService();
```

### Шаг 3: Инициализировать в BootScene

```typescript
// src/scenes/BootScene.ts
import { stickyBannerService } from "../services/stickyBannerService";

export class BootScene extends Phaser.Scene {
  async create(): Promise<void> {
    await yandexSdk.init();
    logEnvironmentInfo();
    
    advertisementService.init(yandexSdk.getSdk(), this.game);
    
    // ✅ ДОБАВИТЬ: инициализация sticky banner
    stickyBannerService.init(yandexSdk.getSdk());
    
    await saveService.load();
    this.scene.start("PreloadScene");
  }
}
```

### Шаг 4: Показать в MenuScene

```typescript
// src/scenes/MenuScene.ts
import { stickyBannerService } from "../services/stickyBannerService";

export class MenuScene extends Phaser.Scene {
  async create(): Promise<void> {
    drawBackground(this);
    // ... существующий код
    
    advertisementService.notifySceneChange("MenuScene");
    await advertisementService.tryShowSceneChangeAd();
    
    // ✅ ДОБАВИТЬ: показ sticky banner
    await stickyBannerService.show();
    
    // ... остальной код
  }
}
```

### Шаг 5: Обновить mock SDK

```javascript
// yandex-game/public/sdk.js
// В функции createMockAdvertisement() добавить:

const createMockAdvertisement = () => {
  return {
    showFullscreenAdv: (options = {}) => { /* существующий код */ },
    showRewardedVideo: (options = {}) => { /* существующий код */ },
    
    // ✅ ДОБАВИТЬ:
    showBannerAdv: async () => {
      console.log('%c[MOCK SDK] 📱 Sticky Banner показан', 'color: #9C27B0; font-weight: bold;');
      await new Promise(resolve => setTimeout(resolve, 100));
    },
    
    hideBannerAdv: async () => {
      console.log('%c[MOCK SDK] 📱 Sticky Banner скрыт', 'color: #9C27B0; font-weight: bold;');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };
};
```

---

## ⚠️ ВАЖНО: LoadingAPI.ready() вызывается рано

### Исправление

```typescript
// src/scenes/PreloadScene.ts
create(): void {
  audioService.init(this);
  
  // ❌ УДАЛИТЬ эти строки:
  // if (window.ysdk?.features?.LoadingAPI) {
  //   window.ysdk.features.LoadingAPI.ready();
  // }
  
  this.scene.start("MenuScene");
}

// src/scenes/MenuScene.ts
async create(): Promise<void> {
  drawBackground(this);
  const save = saveService.current;
  const score = calculateScore(save.inventory, CARS);
  const pendingCar = CARS.find((car) => car.id === save.pendingReward?.carId);
  const layout = getResponsiveLayout(this);
  const t = i18nService.getTranslations();

  audioService.init(this);
  audioService.playBackgroundMusic("bgMusic");

  advertisementService.notifySceneChange("MenuScene");
  await advertisementService.tryShowSceneChangeAd();
  await stickyBannerService.show();

  // ✅ ДОБАВИТЬ здесь (после всей инициализации):
  if (window.ysdk?.features?.LoadingAPI) {
    try {
      window.ysdk.features.LoadingAPI.ready();
      console.log('[Yandex SDK] LoadingAPI.ready() - игра полностью готова');
    } catch (error) {
      console.error('[Yandex SDK] Ошибка LoadingAPI.ready():', error);
    }
  }

  addSceneTitle(this, t.menuTitle);

  if (layout.isPortrait) {
    this.createPortraitLayout(save, score, pendingCar, layout);
  } else {
    this.createLandscapeLayout(save, score, pendingCar, layout);
  }
}
```

---

## 🛡️ РЕКОМЕНДУЕТСЯ: Добавить retry для сетевых запросов

### Создать утилиту

```typescript
// src/utils/retry.ts
/**
 * Выполняет функцию с повторными попытками при ошибке
 * @param fn Функция для выполнения
 * @param maxAttempts Максимальное количество попыток (по умолчанию 3)
 * @param delayMs Задержка между попытками в мс (по умолчанию 1000)
 * @param timeoutMs Таймаут для каждой попытки в мс (по умолчанию 10000)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000,
  timeoutMs = 10000
): Promise<T | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Запуск с таймаутом
      const result = await Promise.race<T>([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
        ),
      ]);
      
      console.log(`[Retry] Попытка ${attempt}/${maxAttempts} успешна`);
      return result;
    } catch (error) {
      console.warn(`[Retry] Попытка ${attempt}/${maxAttempts} не удалась:`, error);
      
      if (attempt < maxAttempts) {
        // Экспоненциальная задержка: 1s, 2s, 4s...
        const backoffDelay = delayMs * Math.pow(2, attempt - 1);
        console.log(`[Retry] Повтор через ${backoffDelay}мс...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  console.error(`[Retry] Все ${maxAttempts} попытки провалились`);
  return null;
}
```

### Применить в yandexSdk.ts

```typescript
// src/services/yandexSdk.ts
import { withRetry } from "../utils/retry";

export class YandexSdkService {
  // ... существующий код
  
  async loadPlayerData(): Promise<SaveData | null> {
    if (!this.player || this.isGuest) {
      console.log('[Yandex SDK] Гостевой режим - облачные сохранения недоступны');
      return null;
    }

    // ✅ ЗАМЕНИТЬ на:
    return withRetry(async () => {
      const data = await this.player!.getData(["saveData"]);
      return data.saveData ?? null;
    }, 3, 1000, 10000);
  }

  async savePlayerData(saveData: SaveData): Promise<void> {
    if (!this.player || this.isGuest) {
      console.log('[Yandex SDK] Гостевой режим - сохранение только локально');
      return;
    }

    // ✅ ЗАМЕНИТЬ на:
    await withRetry(async () => {
      await this.player!.setData({ saveData }, true);
    }, 3, 1000, 10000);
  }

  async submitLeaderboardScore(score: number): Promise<void> {
    if (!this.sdk?.leaderboards) {
      console.log('[Yandex SDK] Лидерборд недоступен: нет API в SDK');
      return;
    }

    if (!(await this.canSetScore())) {
      console.log('[Yandex SDK] Счёт не отправлен: игрок не авторизован');
      return;
    }

    // ✅ ЗАМЕНИТЬ на:
    await withRetry(async () => {
      await this.sdk!.leaderboards!.setScore(LEADERBOARD_NAME, score);
      console.log('[Yandex SDK] Счет отправлен в лидерборд:', score);
    }, 3, 1000, 10000);
  }

  async getLeaderboardEntries(limit = 10): Promise<LeaderboardEntry[] | null> {
    if (!this.sdk?.leaderboards) {
      console.log('[Yandex SDK] Лидерборд недоступен: нет API в SDK');
      return null;
    }

    // ✅ ЗАМЕНИТЬ на:
    const result = await withRetry(async () => {
      const response = await this.sdk!.leaderboards!.getEntries(LEADERBOARD_NAME, {
        quantityTop: limit,
      });

      return response.entries.map((entry) => ({
        rank: entry.rank,
        displayName: entry.player.publicName || "Игрок",
        score: entry.score,
      }));
    }, 3, 1000, 10000);

    return result;
  }
}
```

---

## ✅ Чеклист перед отправкой

```
Критические исправления:
[ ] Sticky Banner реализован и работает
[ ] LoadingAPI.ready() перенесен в MenuScene
[ ] Retry логика добавлена для SDK запросов

Тестирование:
[ ] Запустить локально (npm run dev)
[ ] Проверить sticky banner внизу экрана
[ ] Проверить fullscreen рекламу с 3-сек предупреждением
[ ] Проверить rewarded рекламу (награды выдаются)
[ ] Проверить лидерборд (чтение/запись)
[ ] Проверить сохранения (облако + localStorage)
[ ] Нет ошибок в консоли

Сборка:
[ ] npm run build
[ ] Проверить dist/index.html
[ ] Проверить размер бандла
[ ] Загрузить на Yandex Games sandbox

Документы:
[ ] Иконка 512x512 готова
[ ] Минимум 3 скриншота готовы
[ ] Описание игры на русском
[ ] Описание игры на английском
```

---

## 🚀 Команды для запуска

```bash
# Разработка (mock SDK)
cd yandex-game
npm install
npm run dev

# Открыть: http://localhost:5173

# Сборка для продакшена
npm run build

# Проверка сборки
npm run preview
```

---

## 📚 Полезные ссылки

- [Полный отчет](./YANDEX_GAMES_AUDIT_REPORT.md)
- [Документация Yandex Games SDK](https://yandex.ru/dev/games/doc/)
- [Требования к играм](https://yandex.ru/dev/games/doc/dg/concepts/requirements.html)
- [Форум разработчиков](https://yandex.ru/games/developer-forum)

---

**Время на исправления:** 4-6 часов  
**Готовность после исправлений:** ✅ 100%
