# Cars RNG для Яндекс Игр

Это каркас Phaser-версии Cars RNG. Он создан для переноса Python/Telegram-проекта в HTML5-игру под Яндекс Игры.

## Стек

- Phaser 4.2.1
- TypeScript
- Vite
- Yandex Games SDK

## Команды

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Структура

- `src/scenes/` - Phaser-сцены.
- `src/game/` - игровая логика без привязки к Phaser.
- `src/data/` - каталог машин.
- `src/services/` - Yandex SDK, сохранения, лидерборд.
- `src/ui/` - простые UI-хелперы.
- `public/assets/cars/` - изображения машин для web-версии.

## Следующие шаги

1. Перенести каталог машин из `game/cars_data.py`.
2. Скопировать и нормализовать изображения машин.
3. Подключить настоящую загрузку ассетов в `PreloadScene`.
4. Доработать визуальный UI для первого релиза.
