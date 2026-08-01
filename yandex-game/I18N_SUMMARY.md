# Система интернационализации (i18n)

## Что реализовано

✅ **Автоматическое определение языка через Yandex SDK**
- Язык определяется из `ysdk.environment.i18n.lang`
- Россия → русский язык
- Все остальные страны → английский язык

✅ **Переведенные компоненты:**
1. **MenuScene** - главное меню
   - Кнопки: Крутить, Гараж, Кейсы, Улучшения, Лидерборд
   - Статистика: Баланс, Гараж, Множитель, Очки
   - Бонусная реклама: "🎁 Получить 50000$" / "🎁 Get $50000"

2. **LeaderboardScene** - таблица лидеров
   - Заголовок и счет игрока
   - Сообщения о недоступности
   - Приглашение войти в аккаунт

3. **Ad Countdown** - предупреждение перед рекламой
   - "Реклама через 3 сек" / "Ad in 3 sec"

4. **Car Rarities** - редкости машин
   - Обычный/Common, Необычный/Uncommon, Редкий/Rare
   - Эпический/Epic, Легендарный/Legendary, Эксклюзивный/Exclusive

## Архитектура

```
src/i18n/
├── i18nService.ts           # Singleton сервис управления языком
├── translations.ts          # Все переводы UI
└── rarityTranslations.ts    # Перевод редкостей машин
```

### Инициализация
`yandexSdk.ts` → `i18nService.setLanguageFromSDK(lang)` при инициализации SDK

### Использование в сценах
```typescript
import { i18nService } from "../i18n/i18nService";

const t = i18nService.getTranslations();
addTextButton(this, x, y, t.menuSpin, callback);
```

## Что осталось перевести

Следующие сцены требуют перевода:
- **SpinScene** (src/scenes/SpinScene.ts)
  - Кнопка спина, баланс, хинты
- **CasesScene** (src/scenes/CasesScene.ts)
  - UI открытия кейсов
- **GarageScene** (src/scenes/GarageScene.ts)
  - Сообщение о пустом гараже, статистика
- **UpgradesScene** (src/scenes/UpgradesScene.ts)
  - Названия и описания улучшений

## Тестирование

**Локально (mock SDK):**
В файле `public/sdk.js` строка 193:
```javascript
lang: 'ru',  // Измените на 'en' для английского
```

**Production:**
Язык определяется автоматически Yandex Games SDK

## Дополнительная информация

Подробная документация: `INTERNATIONALIZATION.md`
