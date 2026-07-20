# Перенос игрового ядра на TypeScript

Документ фиксирует результат этапа 4 из `PHASER_YANDEX_MIGRATION_PLAN.md`.

## Итог

Игровая логика вынесена в `yandex-game/src/game/` и не зависит от Phaser-сцен:

- `types.ts` - доменные типы.
- `constants.ts` - игровые константы.
- `saveModel.ts` - модель сохранения и стартовое состояние.
- `spinEngine.ts` - обычный RNG-спин.
- `caseEngine.ts` - обычные и эксклюзивные кейсы.
- `economy.ts` - операции с балансом, гаражом, pending-наградой и улучшениями.

## Перенесено

### SpinEngine

Файл: `yandex-game/src/game/spinEngine.ts`

Перенесены правила:

- исключение `Эксклюзивный` из обычного спина;
- применение `chanceLevel` через вычисляемый `chanceMult`;
- формула `baseChance * 100_000 * chanceMult`;
- roll от `0` до `10_000_000`;
- лимит попыток `10_000`;
- безопасный fallback вместо production-ошибки.

### CaseEngine

Файл: `yandex-game/src/game/caseEngine.ts`

Перенесены правила:

- `Необычный+` кейс;
- `Редкий+` кейс;
- эксклюзивные кейсы по одной целевой эксклюзивной машине;
- weighted random по `max(baseChance, 0.0001)`;
- генерация одиночного и массового открытия.

### Economy

Файл: `yandex-game/src/game/economy.ts`

Перенесены операции:

- оставить pending-награду;
- продать pending-награду;
- продать машину из гаража;
- обработать новую машину при полном гараже;
- массово обработать машины;
- купить улучшение шанса;
- купить расширение гаража;
- получить и отсортировать гараж для отображения.

## Подключено к сценам

Сцены теперь используют игровое ядро вместо ручного изменения `SaveData`:

- `SpinScene` использует `keepPendingReward()` и `sellPendingReward()`.
- `GarageScene` использует `getInventoryViews()`, `sortInventoryViews()` и `sellInventoryCar()`.
- `UpgradesScene` использует `buyChanceUpgrade()` и `buyGarageUpgrade()`.

## Проверка

Выполнена production-сборка:

```text
npm run build
```

Результат:

```text
✓ built
```

Оставшиеся предупреждения Vite не блокируют сборку:

- внешний `/sdk.js` не бандлится;
- Phaser-бандл крупнее 500 kB.
