# Интеграция Yandex Games SDK

Полное руководство по интеграции Yandex Games SDK в проект Cars RNG.

## 📋 Содержание

1. [Обзор](#обзор)
2. [Архитектура](#архитектура)
3. [Локальная разработка](#локальная-разработка)
4. [Production окружение](#production-окружение)
5. [Реклама](#реклама)
6. [Сохранения](#сохранения)
7. [Лидерборд](#лидерборд)
8. [Билд для Yandex](#билд-для-yandex)

---

## 🎯 Обзор

Проект полностью интегрирован с Yandex Games SDK и поддерживает:

- ✅ **Работу без SDK** (локальная разработка с mock-версией)
- ✅ **Автоматическое определение окружения** (production/development)
- ✅ **Fullscreen реклама** (межуровневая)
- ✅ **Rewarded video реклама** (с наградами)
- ✅ **Облачные сохранения** через Yandex Player
- ✅ **Лидерборд** с автоматической синхронизацией

---

## 🏗️ Архитектура

### Структура файлов

```
yandex-game/
├── public/
│   └── sdk.js                     # Mock SDK для локальной разработки
├── src/
│   ├── config/
│   │   └── environment.ts         # Определение окружения (prod/dev)
│   ├── services/
│   │   ├── yandexSdk.ts          # Инициализация SDK
│   │   ├── advertisementService.ts # Управление рекламой
│   │   ├── saveService.ts         # Облачные сохранения
│   │   └── leaderboardService.ts  # Лидерборд
│   └── types/
│       └── yandex-games.d.ts      # TypeScript типы для SDK
├── index.html                     # Динамическая загрузка SDK
└── vite.config.ts                 # Конфигурация билда
```

### Определение окружения

Файл `src/config/environment.ts` автоматически определяет окружение:

```typescript
export function detectEnvironment() {
  const isYandex = window.location.hostname.includes('yandex.net') ||
                   window.location.hostname.includes('yandex.ru');
  
  return {
    isProduction: isYandex,
    isDevelopment: !isYandex,
    shouldUseMockAds: !isYandex,
    shouldUseCloudSaves: isYandex
  };
}
```

---

## 💻 Локальная разработка

### Запуск проекта

```bash
cd yandex-game
npm install
npm run dev
```

Проект откроется на `http://localhost:5173`

### Mock SDK

В development режиме используется **mock SDK** (`public/sdk.js`), который эмулирует:

- ✅ Инициализацию SDK (`YaGames.init()`)
- ✅ Рекламу (fullscreen и rewarded) с задержками
- ✅ Сохранения в `localStorage`
- ✅ Базовый Player API

**Mock реклама:**
- Fullscreen: задержка 1 секунда
- Rewarded: задержка 2 секунды
- Всегда успешный показ

**Mock сохранения:**
- Данные хранятся в `localStorage` под ключом `yandex_mock_save`
- Автоматическая синхронизация

### Проверка работы

1. Откройте консоль браузера (F12)
2. Увидите логи:
```
[Environment] Development mode detected
[YandexSDK] Mock SDK успешно инициализирован
[Advertisement] Используется mock реклама (dev режим)
```

---

## 🚀 Production окружение

### Автоматическое переключение

При загрузке на Yandex Games:

1. **index.html** определяет домен `yandex.net/yandex.ru`
2. Загружается **настоящий SDK**: `https://yandex.ru/games/sdk/v2`
3. `environment.ts` автоматически переключается в production режим
4. Все сервисы используют реальный SDK

### Проверка в production

Логи в консоли:
```
[Environment] Production mode (Yandex Games) detected
[YandexSDK] Настоящий Yandex SDK инициализирован
[Advertisement] Используется настоящая Yandex реклама
```

---

## 📺 Реклама

### Типы рекламы

Проект использует **advertisementService** с cooldown-системой:

| Тип рекламы | Описание | Cooldown | Где показывается |
|-------------|----------|----------|------------------|
| `fullscreen` | Межуровневая | 3 минуты | Меню (каждые 4 визита), CasesScene (x100), GarageScene (30% вероятность), LeaderboardScene (25% вероятность) |
| `free-spin` | Бесплатный спин | 10 минут | SpinScene |
| `bonus-money` | Бонус 2000$ | 15 минут | MenuScene |
| `free-case` | Бесплатный кейс | 20 минут | CasesScene |
| `upgrade-discount` | Скидка на улучшения | 30 минут | UpgradesScene |

### Использование в коде

```typescript
import { advertisementService } from '../services/advertisementService';

// Fullscreen реклама
await advertisementService.showFullscreenAd(() => {
  console.log('Реклама закрыта');
});

// Rewarded реклама
const success = await advertisementService.showRewardedAd(
  () => {
    // Выдать награду игроку
    giveReward();
  },
  'bonus-money',  // тип для cooldown
  900000          // cooldown 15 минут
);

if (success) {
  console.log('Награда выдана');
}
```

### Проверка доступности

```typescript
// Проверить, можно ли показать рекламу
const canShow = advertisementService.canShowAd('bonus-money', 900000);

if (canShow) {
  // Показать кнопку
}

// Получить оставшееся время
const timeLeft = advertisementService.getTimeUntilAvailable('bonus-money', 900000);
const formatted = advertisementService.formatTimeRemaining(timeLeft); // "5:30"
```

### Статистика

```typescript
const stats = advertisementService.getStats();
console.log(stats);
// {
//   fullscreenShown: 5,
//   rewardedShown: 3,
//   totalRewarded: 3,
//   errors: 0
// }
```

---

## 💾 Сохранения

### Облачные сохранения

Сервис `saveService` автоматически синхронизирует данные:

- **Development**: `localStorage`
- **Production**: Yandex Player Cloud Storage

```typescript
import { saveService } from '../services/saveService';

// Загрузить сохранение
await saveService.load();

// Получить текущее сохранение
const save = saveService.current;

// Сохранить данные
const newSave = { ...save, money: save.money + 100 };
await saveService.save(newSave);
```

### Структура SaveData

```typescript
interface SaveData {
  money: number;
  inventory: InventoryItem[];
  garageCap: number;
  chanceLevel: number;
  stats: {
    spins: number;
    casesOpened: number;
    totalEarned: number;
    totalSpent: number;
    rewardedAdsWatched: number;
    fullscreenAdsShown: number;
  };
  pendingReward?: {
    source: 'spin' | 'case';
    carId: string;
    createdAt: number;
  };
}
```

### Миграции

При изменении структуры данных используйте миграции:

```typescript
// src/game/saveModel.ts
const SAVE_VERSION = 2;

export function migrateSave(data: any): SaveData {
  if (data.version < 2) {
    // Добавить новые поля
    data.stats.rewardedAdsWatched = 0;
  }
  return data;
}
```

---

## 🏆 Лидерборд

### Автоматическая отправка

Лидерборд обновляется автоматически при открытии LeaderboardScene:

```typescript
import { submitScore, getTopEntries } from '../services/leaderboardService';

// Отправить счет
const score = calculateScore(save.inventory, CARS);
await submitScore(score);

// Получить топ-10
const entries = await getTopEntries();
// [
//   { rank: 1, displayName: "Player1", score: 15000 },
//   { rank: 2, displayName: "Player2", score: 12000 },
//   ...
// ]
```

### Расчет очков

```typescript
function calculateScore(inventory: InventoryItem[], cars: Car[]): number {
  return inventory.reduce((sum, item) => {
    const car = cars.find(c => c.id === item.carId);
    return sum + (car?.price || 0);
  }, 0);
}
```

### Настройка лидерборда

1. Создайте лидерборд в панели Yandex Games
2. Получите `leaderboardName`
3. Укажите его в `leaderboardService.ts`:

```typescript
const LEADERBOARD_NAME = 'your-leaderboard-name';
```

---

## 📦 Билд для Yandex

### Шаг 1: Создание production билда

```bash
cd yandex-game
npm run build
```

Результат в папке `dist/`:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [images]
└── sdk.js  # Mock SDK (не используется в production)
```

### Шаг 2: Проверка билда локально

```bash
npm run preview
```

Откройте `http://localhost:4173` и проверьте:
- ✅ Игра загружается
- ✅ Mock SDK работает
- ✅ Реклама показывается
- ✅ Сохранения работают

### Шаг 3: Подготовка к загрузке

1. **Создайте ZIP архив папки `dist/`:**

```bash
cd dist
zip -r ../cars-rng-yandex.zip .
```

Или в Windows:
- Откройте папку `dist`
- Выделите все файлы (Ctrl+A)
- ПКМ → Отправить → Сжатая ZIP-папка

2. **Структура архива должна быть:**

```
cars-rng-yandex.zip
├── index.html          (в корне!)
├── assets/
│   └── ...
└── sdk.js
```

⚠️ **Важно:** `index.html` должен быть в **корне архива**, а не в подпапке!

### Шаг 4: Загрузка на Yandex Games

1. Перейдите в [Консоль разработчика Yandex Games](https://console.yandex.ru/games)
2. Создайте новую игру или откройте существующую
3. Перейдите в раздел **"Версии"**
4. Нажмите **"Загрузить новую версию"**
5. Выберите файл `cars-rng-yandex.zip`
6. Дождитесь загрузки и обработки
7. Нажмите **"Опубликовать на тестирование"**

### Шаг 5: Тестирование на Yandex

1. Откройте тестовую ссылку игры
2. Откройте консоль (F12)
3. Проверьте логи:

```
[Environment] Production mode (Yandex Games) detected
[YandexSDK] Настоящий Yandex SDK инициализирован
```

4. Протестируйте:
   - ✅ Реклама показывается
   - ✅ Сохранения синхронизируются
   - ✅ Лидерборд работает
   - ✅ Игра не крашится

### Частые проблемы

**Проблема:** Игра не загружается на Yandex
- Проверьте, что `index.html` в корне ZIP-архива
- Проверьте консоль на ошибки
- Убедитесь, что все пути к ассетам относительные

**Проблема:** SDK не инициализируется
- Проверьте, что загружается `https://yandex.ru/games/sdk/v2`
- Проверьте, что `YaGames` доступен в `window`
- Добавьте `await` при инициализации

**Проблема:** Реклама не показывается
- Убедитесь, что реклама включена в настройках игры
- Проверьте cooldown-таймеры
- Посмотрите логи в консоли

---

## 🔧 Настройка vite.config.ts

Текущая конфигурация:

```typescript
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",  // Относительные пути для ассетов
  build: {
    outDir: "dist",
    assetsDir: "assets",
    minify: "terser",
    sourcemap: false,
  },
});
```

Для отладки production билда включите sourcemap:

```typescript
build: {
  sourcemap: true,  // Включить source maps
}
```

---

## 📊 Мониторинг

### Логирование

Все сервисы логируют события:

```typescript
// YandexSDK
[YandexSDK] Инициализация...
[YandexSDK] Mock SDK успешно инициализирован

// Advertisement
[Advertisement] Fullscreen реклама показана
[Advertisement] Rewarded реклама "bonus-money" просмотрена, награда выдана

// SaveService
[SaveService] Загрузка из localStorage...
[SaveService] Сохранение завершено

// LeaderboardService
[Leaderboard] Счет отправлен: 15000
[Leaderboard] Топ-10 получен
```

### Статистика рекламы

Отслеживайте показы через `advertisementService.getStats()`:

```typescript
// В консоли
advertisementService.getStats();
// { fullscreenShown: 5, rewardedShown: 3, totalRewarded: 3, errors: 0 }
```

---

## 🎮 Примеры интеграции

### Пример 1: Показ fullscreen рекламы

```typescript
// MenuScene.ts
async create(): Promise<void> {
  // Показ рекламы каждые 4 визита
  menuVisitCounter++;
  if (menuVisitCounter % 4 === 0 && advertisementService.canShowAd('fullscreen', 180000)) {
    await advertisementService.showFullscreenAd();
  }
  
  // Дальнейшая инициализация сцены...
}
```

### Пример 2: Rewarded реклама с проверкой

```typescript
// Кнопка бонуса
const canShowBonus = advertisementService.canShowAd('bonus-money', 900000);

if (canShowBonus) {
  addTextButton(this, x, y, "🎁 Получить 2000$", async () => {
    const success = await advertisementService.showRewardedAd(() => {
      // Выдать награду
      const updatedSave = {
        ...saveService.current,
        money: saveService.current.money + 2000,
      };
      await saveService.save(updatedSave);
      this.scene.restart();
    }, 'bonus-money', 900000);

    if (!success) {
      // Показать ошибку
      console.log("Реклама недоступна");
    }
  });
}
```

### Пример 3: Сохранение с миграцией

```typescript
// saveService.ts
async load(): Promise<void> {
  const env = detectEnvironment();
  
  if (env.shouldUseCloudSaves && this.sdk?.player) {
    const data = await this.sdk.player.getData();
    this.currentSave = migrateSave(data);
  } else {
    const saved = localStorage.getItem('cars_rng_save');
    this.currentSave = saved ? migrateSave(JSON.parse(saved)) : getDefaultSave();
  }
}
```

---

## 📝 Checklist перед релизом

- [ ] Mock SDK работает локально
- [ ] Production билд собирается без ошибок (`npm run build`)
- [ ] Игра работает в preview режиме (`npm run preview`)
- [ ] Реклама показывается с правильными cooldown
- [ ] Сохранения работают (localStorage → cloud)
- [ ] Лидерборд настроен и работает
- [ ] ZIP архив создан правильно (index.html в корне)
- [ ] Игра протестирована на Yandex Games
- [ ] Все логи проверены в production консоли

---

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи в консоли браузера (F12)
2. Убедитесь, что используется правильное окружение (dev/prod)
3. Проверьте версию SDK: `window.YaGames`
4. Проверьте документацию Yandex: https://yandex.ru/dev/games/doc/

---

**Версия документа:** 1.0  
**Дата обновления:** 2024  
**Проект:** Cars RNG - Yandex Games Integration
