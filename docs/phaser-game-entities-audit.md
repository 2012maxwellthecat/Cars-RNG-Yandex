# Аудит игровых сущностей для Phaser-версии

Документ фиксирует текущие игровые сущности Cars RNG перед переносом проекта с Python/Telegram на Phaser/Yandex Games. Это результат этапа 1, пункта 1 из `PHASER_YANDEX_MIGRATION_PLAN.md`.

## Источники

- `game/models.py`
- `game/cars_data.py`
- `game/engine.py`
- `storage/db.py`
- `handlers/spin.py`
- `handlers/cases.py`
- `handlers/upgrades.py`
- `handlers/inventory.py`
- `handlers/leaderboard.py`

## Базовые сущности

### Car

Текущая Python-модель:

```python
@dataclass
class Car:
    name: str
    rarity: str
    value: int
    base_chance: float
    points: int
```

Назначение:

- описывает машину из общего каталога;
- используется в обычном спине;
- используется в кейсах;
- сохраняется в pending-состояние после одиночного спина или одиночного кейса;
- копируется в инвентарь игрока;
- используется для расчета продажи и очков лидерборда.

Поля:

| Поле Python | Тип Python | Смысл | TypeScript-поле |
|---|---:|---|---|
| `name` | `str` | Отображаемое название машины | `name: string` |
| `rarity` | `str` | Редкость | `rarity: Rarity` |
| `value` | `int` | Цена продажи | `value: number` |
| `base_chance` | `float` | Базовый шанс выпадения | `baseChance: number` |
| `points` | `int` | Очки для лидерборда | `points: number` |

Что добавить в Phaser-версии:

| Новое поле | Зачем нужно |
|---|---|
| `id` | Стабильный ключ машины для сохранений, ассетов и логики |
| `imageKey` | Ключ изображения в Phaser loader |
| `sortRank` или сортировка по `Rarity` | Чтобы не дублировать SQL-сортировку из Telegram-версии |

Предлагаемый TypeScript-тип:

```ts
export type Car = {
  id: string;
  name: string;
  rarity: Rarity;
  value: number;
  baseChance: number;
  points: number;
  imageKey: string;
};
```

### Rarity

В Python редкость хранится строкой. В `game/engine.py` есть рейтинг редкостей:

```python
RARITY_RANKS = {
    "Обычный": 0,
    "Необычный": 1,
    "Редкий": 2,
    "Эпический": 3,
    "Легендарный": 4,
    "Эксклюзивный": 5,
}
```

Список редкостей:

| Редкость | Ранг | Использование |
|---|---:|---|
| `Обычный` | 0 | Обычный спин, базовые машины |
| `Необычный` | 1 | Обычный спин, Необычный+ кейс |
| `Редкий` | 2 | Обычный спин, Редкий+ кейс, эксклюзивные кейсы |
| `Эпический` | 3 | Обычный спин и кейсы |
| `Легендарный` | 4 | Обычный спин и кейсы |
| `Эксклюзивный` | 5 | Только эксклюзивные кейсы |

Правила:

- обычный спин исключает машины с редкостью `Эксклюзивный`;
- обычные кейсы исключают `Эксклюзивный`;
- эксклюзивный кейс содержит машины `Редкий` и выше плюс одну целевую эксклюзивную машину.

Предлагаемый TypeScript-тип:

```ts
export type Rarity =
  | "Обычный"
  | "Необычный"
  | "Редкий"
  | "Эпический"
  | "Легендарный"
  | "Эксклюзивный";

export const RARITY_RANKS: Record<Rarity, number> = {
  Обычный: 0,
  Необычный: 1,
  Редкий: 2,
  Эпический: 3,
  Легендарный: 4,
  Эксклюзивный: 5,
};
```

### Player

Текущая Python-модель:

```python
@dataclass
class Player:
    user_id: int
    money: int = 0
    chance_mult: float = 1.0
    garage_cap: int = 20
    display_name: str = "Игрок"
```

Назначение:

- хранит прогресс игрока;
- в Telegram-версии связан с `user_id` Telegram;
- в Phaser/Yandex-версии должен быть связан с Yandex Player ID или гостевым локальным профилем.

Поля:

| Поле Python | Тип Python | Смысл | TypeScript-поле |
|---|---:|---|---|
| `user_id` | `int` | Telegram ID | `playerId: string` |
| `display_name` | `str` | Имя для лидерборда | `displayName: string` |
| `money` | `int` | Игровая валюта | `money: number` |
| `chance_mult` | `float` | Множитель шанса спина | `chanceMult: number` |
| `garage_cap` | `int` | Вместимость гаража | `garageCap: number` |

Предлагаемый TypeScript-тип:

```ts
export type PlayerProfile = {
  playerId: string;
  displayName: string;
  money: number;
  chanceMult: number;
  garageCap: number;
};
```

### InventoryCar

Текущая Python-модель:

```python
@dataclass
class InventoryCar(Car):
    inventory_id: int = 0
```

Назначение:

- представляет конкретную машину в гараже игрока;
- нужна для продажи конкретного экземпляра;
- в текущей БД хранит полную копию данных машины.

Текущее хранение в SQLite:

```sql
CREATE TABLE IF NOT EXISTS inventory (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    car_name    TEXT NOT NULL,
    rarity      TEXT NOT NULL,
    value       INTEGER NOT NULL,
    base_chance REAL NOT NULL,
    points      INTEGER NOT NULL
);
```

Рекомендация для Phaser:

- не хранить полную копию машины в сохранении;
- хранить `carId`, а данные машины брать из каталога `cars`;
- добавить `obtainedAt`, чтобы можно было сортировать по времени получения.

Предлагаемый TypeScript-тип:

```ts
export type InventoryCar = {
  inventoryId: string;
  carId: string;
  obtainedAt: number;
};
```

Для отображения карточки использовать объединение:

```ts
export type InventoryCarView = InventoryCar & {
  car: Car;
};
```

### PendingSpin

В Python нет отдельного dataclass, но сущность существует в таблице `pending_spins`.

Текущее хранение:

```sql
CREATE TABLE IF NOT EXISTS pending_spins (
    user_id     INTEGER PRIMARY KEY,
    car_name    TEXT NOT NULL,
    rarity      TEXT NOT NULL,
    value       INTEGER NOT NULL,
    base_chance REAL NOT NULL,
    points      INTEGER NOT NULL
);
```

Назначение:

- блокирует новый одиночный спин, пока игрок не выбрал `Оставить` или `Продать`;
- используется после обычного спина;
- используется после одиночного открытия кейса;
- не используется для массового открытия кейсов, потому что x10/x100 обрабатываются автоматически.

В Phaser-версии эта сущность нужна как часть сохранения или runtime-состояния. Если игрок закроет вкладку после выпадения машины, игра должна восстановить выбор.

Предлагаемый TypeScript-тип:

```ts
export type PendingReward = {
  source: "spin" | "case";
  carId: string;
  createdAt: number;
};
```

## Производные сущности для Phaser-версии

### Garage

В Python отдельной модели гаража нет. Гараж получается из:

- `Player.garage_cap`;
- количества строк в `inventory`;
- списка `InventoryCar`.

В Phaser-версии гараж лучше сделать явной вычисляемой моделью:

```ts
export type GarageState = {
  capacity: number;
  cars: InventoryCar[];
};
```

Вычисляемые значения:

- `count = cars.length`;
- `freeSlots = capacity - cars.length`;
- `isFull = cars.length >= capacity`.

### Balance

В Python баланс хранится как `users.money`.

Правила изменения баланса:

- продажа pending-машины добавляет `car.value`;
- продажа машины из инвентаря добавляет `car.value`;
- одиночный кейс списывает стоимость кейса;
- массовый кейс списывает `cost * count`;
- покупка улучшения шанса списывает цену улучшения;
- расширение гаража списывает цену расширения;
- автоспин при заполненном гараже может продать новую или старую машину.

В Phaser-версии отдельный тип баланса не обязателен, но все операции с `money` лучше держать в `economy.ts`.

### ChanceMultiplier

В Python хранится как `Player.chance_mult`, стартовое значение `1.0`.

Правила:

- используется только в обычном спине;
- должен быть положительным конечным числом;
- улучшение шанса увеличивает значение на `0.1`;
- цена улучшения: `int(100000 * chance_mult)`.

Предлагаемый TypeScript-константный блок:

```ts
export const CHANCE_BASE_COST = 100_000;
export const CHANCE_STEP = 0.1;
export const INITIAL_CHANCE_MULT = 1.0;
```

### GarageUpgrade

В Python хранится через изменение `garage_cap`.

Правила:

- стартовая вместимость: `20`;
- шаг расширения: `+5`;
- базовая цена: `75_000`;
- шаг цены: `50_000`;
- уровень считается так: `(garageCap - 20) / 5`.

Предлагаемый TypeScript-константный блок:

```ts
export const INITIAL_GARAGE_CAP = 20;
export const GARAGE_STEP = 5;
export const GARAGE_BASE_COST = 75_000;
export const GARAGE_COST_STEP = 50_000;
```

### CaseDefinition

В Python кейсы заданы в `handlers/cases.py` константами, а не моделью.

Текущие кейсы:

| Кейс | Минимальная редкость | Цена | Эксклюзивные |
|---|---|---:|---|
| Необычный+ | `Необычный` | `100000` | Нет |
| Редкий+ | `Редкий` | `2500000` | Нет |
| Эксклюзивный | `Редкий` + целевая эксклюзивная машина | `4000000` | Да |

Поддерживаемые массовые открытия:

- `x10`;
- `x100`.

Предлагаемый TypeScript-тип:

```ts
export type CaseDefinition = {
  id: string;
  title: string;
  minRarity: Rarity;
  cost: number;
  exclusiveCarId?: string;
};
```

### LeaderboardEntry

В Python лидерборд считается SQL-запросом:

```text
total_points = SUM(inventory.points)
```

Предлагаемый TypeScript-тип:

```ts
export type LeaderboardEntry = {
  rank: number;
  displayName: string;
  score: number;
};
```

Формула рейтинга для Yandex Leaderboards:

```text
score = сумма points всех машин в гараже
```

## Полная модель сохранения для Phaser

Итоговая модель сохранения должна объединить игрока, гараж и pending-награду:

```ts
export type SaveData = {
  version: number;
  player: PlayerProfile;
  inventory: InventoryCar[];
  pendingReward: PendingReward | null;
  stats: PlayerStats;
};

export type PlayerStats = {
  spins: number;
  casesOpened: number;
  carsSold: number;
};
```

## Сущности, которые не нужно переносить напрямую

### Telegram user_id

`user_id` нужен только Telegram-боту. В Phaser-версии его заменяет:

- Yandex Player ID для авторизованного игрока;
- локальный гостевой ID для fallback-режима.

### SQLite row id

`inventory.id` нельзя переносить как постоянный формат. В браузерной игре нужен собственный `inventoryId`, например UUID или строка на базе времени и счетчика.

### display_line()

Метод `Car.display_line()` является Telegram-форматированием. В Phaser-версии отображение должно быть частью UI-компонента карточки машины.

## Открытые решения перед этапом 1.2

1. Выбрать формат каталога машин: `cars.ts` или `cars.json`.
2. Выбрать схему генерации `carId`.
3. Выбрать схему генерации `inventoryId`.
4. Решить, сохранять ли `pendingReward` между сессиями.
5. Решить, нужна ли статистика в первом релизе или оставить ее только для будущих достижений.
