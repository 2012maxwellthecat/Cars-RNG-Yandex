# Руководство по сборке и деплою

## 🚀 Быстрый старт

### Локальная разработка

```bash
cd yandex-game
npm install
npm run dev
```

Откроется на `http://localhost:5173`

### Сборка для Yandex Games

```bash
npm run build
```

Результат в папке `dist/`

### Создание архива для загрузки

**Windows:**
1. Откройте папку `yandex-game/dist`
2. Выделите ВСЕ файлы внутри (Ctrl+A)
3. ПКМ → Отправить → Сжатая ZIP-папка
4. Назовите `cars-rng-yandex.zip`

**Linux/Mac:**
```bash
cd yandex-game/dist
zip -r ../cars-rng-yandex.zip .
```

⚠️ **Важно:** `index.html` должен быть в корне архива!

## 📦 Загрузка на Yandex Games

1. Перейдите на https://console.yandex.ru/games
2. Выберите игру или создайте новую
3. Раздел **"Версии"** → **"Загрузить новую версию"**
4. Выберите файл `cars-rng-yandex.zip`
5. Дождитесь обработки
6. Нажмите **"Опубликовать на тестирование"**

## ✅ Проверка

После загрузки откройте игру и проверьте консоль (F12):

```
[Environment] Production mode (Yandex Games) detected
[YandexSDK] Настоящий Yandex SDK инициализирован
[Advertisement] Используется настоящая Yandex реклама
```

Протестируйте:
- ✅ Реклама показывается
- ✅ Сохранения работают
- ✅ Лидерборд обновляется

## 🔧 Команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Локальная разработка (mock SDK) |
| `npm run build` | Production сборка |
| `npm run preview` | Просмотр production билда локально |

## 📝 Структура билда

```
dist/
├── index.html          ← В корне!
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [images]
└── sdk.js
```

## 🆘 Проблемы?

**Игра не загружается:**
- Проверьте, что `index.html` в корне ZIP
- Откройте консоль (F12) и посмотрите ошибки

**SDK не работает:**
- Убедитесь, что домен `yandex.net/yandex.ru`
- Проверьте загрузку `https://yandex.ru/games/sdk/v2`

**Реклама не показывается:**
- Включите рекламу в настройках игры
- Проверьте cooldown-таймеры в коде

Полная документация: [YANDEX_SDK_INTEGRATION.md](./YANDEX_SDK_INTEGRATION.md)
