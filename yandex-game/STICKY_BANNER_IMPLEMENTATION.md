# Sticky Banner - Обязательный элемент для Yandex Games

## Что это?

Sticky Banner (закрепленный баннер) - это **обязательный элемент монетизации** для публикации игры на Yandex Games. Баннер отображается внизу экрана постоянно во время игры.

## Реализация

### 1. StickyBannerService (`src/services/stickyBannerService.ts`)
Сервис управления sticky banner с поддержкой:
- Показ через Yandex SDK (`showBannerAdv()`)
- Скрытие через Yandex SDK (`hideBannerAdv()`)
- Fallback для локальной разработки
- Проверка состояния баннера

### 2. Типы TypeScript (`src/types/yandex-games.d.ts`)
Добавлены методы в интерфейс `YandexGamesSdk`:
```typescript
adv?: {
  showBannerAdv(): Promise<void>;
  hideBannerAdv(): Promise<void>;
  // ... другие методы рекламы
}
```

### 3. Mock SDK (`public/sdk.js`)
Добавлена поддержка sticky banner для локальной разработки:
```javascript
showBannerAdv: async () => {
  console.log('Sticky Banner показывается...');
},
hideBannerAdv: async () => {
  console.log('Sticky Banner скрывается...');
}
```

### 4. Инициализация (`src/services/yandexSdk.ts`)
Баннер автоматически показывается после инициализации SDK:
```typescript
await stickyBannerService.show();
```

### 5. CSS стили (`src/styles.css`)
Добавлены стили для fallback баннера в режиме разработки.

## Использование

### Автоматический показ
Баннер показывается автоматически при инициализации игры. Никаких дополнительных действий не требуется.

### Ручное управление (опционально)
```typescript
import { stickyBannerService } from './services/stickyBannerService';

// Показать баннер
await stickyBannerService.show();

// Скрыть баннер
await stickyBannerService.hide();

// Проверить состояние
const isVisible = stickyBannerService.isVisible();
```

## Тестирование

### Локальная разработка
При запуске `npm run dev` вы увидите фиолетовый fallback баннер внизу экрана с текстом "📢 Sticky Banner (dev mode)". Это нормально - в production будет реальный баннер от Yandex.

### Production
На платформе Yandex Games баннер будет показан автоматически через SDK. Fallback баннер не появится.

## Требования Yandex Games

✅ **Обязательно:** Sticky banner должен быть показан постоянно во время игры  
✅ **Автоматически:** Баннер показывается сразу после инициализации SDK  
✅ **Не блокировать:** Баннер не должен блокировать игровой процесс  
✅ **Совместимость:** Баннер работает на всех устройствах (десктоп, мобильные)  

## Статус

✅ **Реализовано и готово к публикации**

Sticky banner полностью интегрирован в игру и соответствует требованиям Yandex Games для прохождения модерации.
