# Система паузы игры

## Описание

Реализована комплексная система паузы для соответствия требованиям Yandex Games и обеспечения корректной работы игры при потере фокуса.

## Функциональность

### 1. Автоматическая пауза при:

- **Нажатии кнопки "Pause" в debug-панели Yandex Games** (события `game_api_pause`/`game_api_resume`)
- **Сворачивании браузера/приложения** (`document.visibilitychange`)
- **Переключении на другую вкладку** (`document.visibilitychange`)
- **Потере фокуса окном** (`window.blur`)

### 2. Что останавливается:

- ✅ Все активные игровые сцены (Phaser scenes)
- ✅ Все звуки (музыка и эффекты)
- ✅ Все таймеры и анимации внутри сцен
- ✅ Игровая логика (спины, открытие кейсов и т.д.)

### 3. Визуальный индикатор

При паузе отображается полноэкранный оверлей с:
- Иконкой паузы ⏸️
- Текстом "PAUSED"
- Затемненным фоном (rgba(0, 0, 0, 0.8))
- Анимацией пульсации

### 4. Интеграция с Yandex Games API

Игра корректно обрабатывает события GameplayAPI:
- **`GameplayAPI.start()`** - вызывается при запуске/возобновлении игры
- **`GameplayAPI.stop()`** - вызывается при паузе/сворачивании
- **События `game_api_pause` и `game_api_resume`** - обрабатываются для debug-панели

## Техническая реализация

### Файлы

1. **`src/main.ts`**
   - Глобальный флаг `isGamePaused` для синхронизации всех обработчиков
   - Функции `pauseGame()` и `resumeGame()` для централизованного управления
   - Обработчики событий `visibilitychange`, `blur`, `focus`
   - Обработчики событий Yandex API: `game_api_pause`, `game_api_resume`
   - Вызовы `GameplayAPI.start()` и `GameplayAPI.stop()`

2. **`src/services/pauseOverlayService.ts`**
   - Singleton сервис для визуального оверлея
   - Методы: `show()`, `hide()`, `destroy()`
   - CSS анимация пульсации

3. **`src/scenes/MenuScene.ts`**
   - Вызов `GameplayAPI.start()` при запуске игры
   - Уведомление платформы о готовности к геймплею

4. **`src/types/yandex-games.d.ts`**
   - TypeScript типы для `GameplayAPI`
   - Методы `start()` и `stop()`

5. **`public/sdk.js`**
   - Mock реализация `GameplayAPI` для локальной разработки
   - Логирование вызовов start/stop

### События и синхронизация

```typescript
// Глобальный флаг предотвращает дублирование паузы
let isGamePaused = false;

// Централизованная функция паузы
function pauseGame(): void {
  if (isGamePaused) return; // Защита от повторных вызовов
  isGamePaused = true;
  // ... пауза сцен и звука
}

// Централизованная функция возобновления
function resumeGame(): void {
  if (!isGamePaused) return; // Защита от повторных вызовов
  isGamePaused = false;
  // ... возобновление сцен и звука
}

// События Yandex Games API (debug-панель)
window.addEventListener('game_api_pause', () => pauseGame());
window.addEventListener('game_api_resume', () => {
  if (!document.hidden) resumeGame();
});

// Потеря видимости (свернуто/переключено)
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pauseGame();
    window.ysdk?.features?.GameplayAPI?.stop();
  } else {
    resumeGame();
    window.ysdk?.features?.GameplayAPI?.start();
  }
});
```

## Требования Yandex Games

✅ **1.9. Пауза при сворачивании** - реализовано  
✅ **Звук останавливается** - реализовано  
✅ **Игровая логика останавливается** - реализовано  
✅ **Работает в iframe** - реализовано  
✅ **Интеграция с GameplayAPI** - реализовано  
✅ **Обработка событий debug-панели** - реализовано  

## Тестирование

### Локально:
1. Запустите `npm run dev`
2. Переключитесь на другую вкладку → должна появиться пауза + оверлей
3. Сверните окно браузера → должна появиться пауза + оверлей
4. Откройте Developer Tools и нажмите F8 (breakpoint) → должна появиться пауза

### В Yandex Games debug-режиме:
1. Загрузите игру в режим черновика
2. Добавьте `?debug-mode=16` к URL
3. Нажмите кнопку "Pause" в debug-панели → игра должна остановиться с оверлеем
4. Нажмите "Play" → игра должна возобновиться
5. Проверьте в консоли логи `GameplayAPI.start()` и `GameplayAPI.stop()`

### Проверка звука:
1. Запустите игру с включенным звуком
2. Поставьте на паузу любым способом
3. Убедитесь, что звук полностью остановлен
4. Возобновите игру
5. Убедитесь, что звук продолжается с места остановки

## Особенности

- **Глобальная синхронизация**: Флаг `isGamePaused` предотвращает конфликты между обработчиками
- **Множественные сцены**: Останавливаются ВСЕ активные сцены, не только текущая
- **Умное возобновление**: При фокусе окна проверяется, не свернут ли документ
- **Визуальная обратная связь**: Пользователь всегда видит, что игра на паузе
- **Интеграция с платформой**: Корректная работа с debug-панелью Yandex Games
- **Логирование**: Все события паузы/возобновления логируются в консоль

## API

### pauseOverlayService

```typescript
import { pauseOverlayService } from "./services/pauseOverlayService";

// Показать оверлей паузы
pauseOverlayService.show();

// Скрыть оверлей паузы
pauseOverlayService.hide();

// Удалить оверлей полностью
pauseOverlayService.destroy();
```

### Yandex Games API

```typescript
// Уведомить платформу о начале геймплея
window.ysdk?.features?.GameplayAPI?.start();

// Уведомить платформу об остановке геймплея
window.ysdk?.features?.GameplayAPI?.stop();
```

## Совместимость

- ✅ Chrome/Edge (Blink)
- ✅ Firefox (Gecko)
- ✅ Safari (WebKit)
- ✅ Мобильные браузеры (iOS/Android)
- ✅ Yandex Games iframe
- ✅ Yandex Games debug-панель

## Логи

Все события паузы логируются в консоль:

```
[Yandex API] Получено событие game_api_pause
[Pause] Игра остановлена, активные сцены: ["MenuScene"]
[PauseOverlay] Оверлей паузы показан
[Yandex SDK] GameplayAPI.stop() вызван

[Yandex API] Получено событие game_api_resume
[Resume] Игра возобновлена, сцены: ["MenuScene"]
[PauseOverlay] Оверлей паузы скрыт
[Yandex SDK] GameplayAPI.start() вызван
```

## Решение проблем

### Игра не останавливается при нажатии Pause в debug-панели
- Проверьте, что события `game_api_pause` и `game_api_resume` корректно обрабатываются
- Откройте консоль и проверьте наличие логов `[Yandex API] Получено событие...`

### Звук продолжает играть после паузы
- Проверьте, что `game.sound.pauseAll()` вызывается в функции `pauseGame()`
- Проверьте, что флаг `isGamePaused` корректно устанавливается

### После возобновления элементы остаются заблокированными
- Проверьте, что `game.scene.resume()` вызывается для всех приостановленных сцен
- Убедитесь, что флаг `isGamePaused` сбрасывается в `false`

