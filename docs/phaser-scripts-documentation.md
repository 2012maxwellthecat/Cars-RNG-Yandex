# Документация по скриптам Phaser/Yandex-версии

Этот документ объясняет скрипты web-версии Cars RNG и сопутствующие генераторы. Особый акцент сделан на синтаксис TypeScript: что означают `type`, `export`, `import`, `Promise`, union-типы, generic-типы, optional chaining и другие конструкции.

## Как читать TypeScript в этом проекте

### `import` и `export`

TypeScript-файлы делятся на модули. Чтобы один файл мог использовать код из другого, используются `import` и `export`.

Пример:

```ts
import { CARS } from "../data/cars";
import type { Car } from "./types";

export function spin(cars: Car[]): Car {
  return cars[0];
}
```

Что здесь происходит:

- `import { CARS } ...` импортирует реальное значение, которое будет существовать в JavaScript после сборки.
- `import type { Car } ...` импортирует только тип. После компиляции TypeScript этот импорт исчезает.
- `export function` делает функцию доступной для других файлов.

### `type`

`type` описывает форму данных.

```ts
export type Car = {
  id: string;
  name: string;
  value: number;
};
```

Это не создает объект в игре. Это только проверка для TypeScript: машина должна иметь `id`, `name` и `value`.

### Union-типы

Union означает "одно из нескольких значений".

```ts
export type Rarity =
  | "Обычный"
  | "Необычный"
  | "Редкий";
```

Теперь `rarity` не может быть произвольной строкой вроде `"Супер"`. TypeScript разрешит только перечисленные значения.

### Literal object union

В `economy.ts` часто используются типы результата:

```ts
export type UpgradeResult =
  | { status: "ok"; cost: number }
  | { status: "money"; cost: number };
```

Это значит: функция возвращает объект одного из двух видов. По полю `status` TypeScript понимает, какие поля доступны дальше.

```ts
const result = buyChanceUpgrade(save);

if (result.status === "ok") {
  // здесь TypeScript знает, что покупка успешна
}
```

### Generic-типы

Generic - это тип с параметром.

```ts
const carsById = new Map<string, Car>();
```

`Map<string, Car>` означает: ключи в коллекции - строки, значения - машины.

В проекте часто TypeScript сам выводит generic:

```ts
const carsById = new Map(cars.map((car) => [car.id, car]));
```

### `Promise` и `async/await`

Асинхронные функции возвращают `Promise`.

```ts
async function load(): Promise<SaveData> {
  const save = await loadFromSdk();
  return save;
}
```

`async` значит, что внутри можно использовать `await`. `await` ждет завершения асинхронной операции.

### Optional chaining

Optional chaining безопасно обращается к полю, которое может отсутствовать.

```ts
this.sdk?.getLeaderboards
```

Если `this.sdk` равен `null`, код не упадет.

### Nullish coalescing

Оператор `??` подставляет значение только если слева `null` или `undefined`.

```ts
return data.saveData ?? null;
```

Если `data.saveData` есть, вернется оно. Если нет, вернется `null`.

### Spread-синтаксис

Spread копирует поля объекта или элементы массива.

```ts
const nextSave = {
  ...save,
  money: save.money + car.value,
};
```

Это создает новый объект на основе `save`, но заменяет поле `money`.

Для массива:

```ts
inventory: [...save.inventory, added]
```

Это новый массив со старыми машинами и новой машиной в конце.

## `package.json`

Файл: `yandex-game/package.json`

Назначение:

- описывает npm-проект;
- хранит команды запуска;
- хранит зависимости.

Скрипты:

```json
"scripts": {
  "dev": "vite --host 0.0.0.0",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview --host 0.0.0.0"
}
```

Команды:

- `npm run dev` - запускает dev-сервер Vite.
- `npm run build` - сначала проверяет TypeScript, потом собирает production-версию.
- `npm run preview` - запускает локальный просмотр production-сборки.

Синтаксис:

- `&&` означает: выполнить вторую команду только если первая завершилась успешно.
- `tsc --noEmit` проверяет типы, но не создает `.js` файлы.
- `vite build` создает папку `dist/`.

## `src/main.ts`

Файл: `yandex-game/src/main.ts`

Назначение:

- создает Phaser-игру;
- подключает все сцены;
- задает размер, фон и режим масштабирования.

Ключевой код:

```ts
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#141821",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  scene: [BootScene, PreloadScene, MenuScene],
};

new Phaser.Game(config);
```

Синтаксис:

- `const config: Phaser.Types.Core.GameConfig` означает: переменная `config` должна соответствовать типу конфига Phaser.
- `Phaser.AUTO` говорит Phaser самому выбрать WebGL или Canvas.
- `scene: [...]` - массив классов сцен.
- `new Phaser.Game(config)` создает экземпляр игры.

## `src/game/types.ts`

Файл: `yandex-game/src/game/types.ts`

Назначение:

- хранит доменные типы игры;
- не содержит логики;
- используется почти всеми остальными файлами.

Типы:

- `Rarity` - допустимые редкости машин.
- `Car` - запись машины в общем каталоге.
- `InventoryCar` - конкретная машина в гараже игрока.
- `PendingReward` - машина, ожидающая решения `Оставить` или `Продать`.
- `CaseDefinition` - описание кейса.
- `LeaderboardEntry` - строка лидерборда.

Пример:

```ts
export type InventoryCar = {
  inventoryId: string;
  carId: string;
  obtainedAt: number;
};
```

Объяснение:

- `inventoryId` - уникальный ID конкретного экземпляра машины.
- `carId` - ссылка на машину из `CARS`.
- `obtainedAt` - время получения в миллисекундах.

Почему не хранится вся машина:

- каталог машин уже есть в `cars.ts`;
- в сохранении достаточно хранить `carId`;
- это уменьшает размер сохранений.

## `src/game/constants.ts`

Файл: `yandex-game/src/game/constants.ts`

Назначение:

- хранит числа и настройки, которые используются в правилах игры.

Примеры:

```ts
export const INITIAL_MONEY = 0;
export const INITIAL_GARAGE_CAP = 20;
export const CHANCE_BASE_COST = 100_000;
```

Синтаксис:

- `export const` - экспортируемая константа.
- `100_000` - TypeScript/JavaScript разрешает `_` внутри чисел для читаемости. Это то же самое, что `100000`.

Редкости:

```ts
export const RARITY_RANKS: Record<Rarity, number> = {
  Обычный: 0,
  Необычный: 1,
};
```

Синтаксис:

- `Record<Rarity, number>` означает объект, где каждый ключ - значение типа `Rarity`, а значение - число.
- TypeScript проверит, что все редкости описаны.

## `src/game/saveModel.ts`

Файл: `yandex-game/src/game/saveModel.ts`

Назначение:

- описывает структуру сохранения;
- создает новое сохранение для нового игрока;
- переводит уровень шанса в множитель.

Главный тип:

```ts
export type SaveData = {
  version: number;
  money: number;
  chanceLevel: number;
  garageCap: number;
  inventory: InventoryCar[];
  pendingReward: PendingReward | null;
  stats: PlayerStats;
};
```

Синтаксис:

- `InventoryCar[]` означает массив `InventoryCar`.
- `PendingReward | null` означает: либо pending-награда, либо ничего.

Функция стартового сохранения:

```ts
export function createDefaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    money: INITIAL_MONEY,
    inventory: [],
    pendingReward: null,
  };
}
```

Функция:

- возвращает объект `SaveData`;
- используется при первом запуске или если сохранение отсутствует.

`chanceMultFromLevel()`:

```ts
export function chanceMultFromLevel(chanceLevel: number): number {
  return 1 + chanceLevel * 0.1;
}
```

Почему хранится `chanceLevel`, а не `chanceMult`:

- JavaScript может давать неточные float-значения;
- уровень проще сохранять;
- множитель можно вычислить в любой момент.

## `src/game/spinEngine.ts`

Файл: `yandex-game/src/game/spinEngine.ts`

Назначение:

- отвечает за обычный RNG-спин;
- не зависит от Phaser;
- можно тестировать отдельно.

Тип RNG:

```ts
export type Rng = {
  float(): number;
  integer(min: number, max: number): number;
};
```

Это объект с двумя функциями:

- `float()` возвращает число от `0` до `1`;
- `integer(min, max)` возвращает целое число в диапазоне.

Зачем отдельный `Rng`:

- можно заменить случайность в тестах;
- игровая логика не привязана напрямую к `Math.random()`.

Обычный пул:

```ts
export function getNormalSpinCars(cars: Car[]): Car[] {
  return cars.filter((car) => car.rarity !== "Эксклюзивный");
}
```

Синтаксис:

- `.filter(...)` создает новый массив только из подходящих элементов.
- `(car) => ...` - стрелочная функция.

Основной спин:

```ts
export function spin(cars: Car[], chanceLevel: number, rng: Rng = browserRng): Car
```

Объяснение параметров:

- `cars: Car[]` - каталог машин;
- `chanceLevel: number` - уровень улучшения шанса;
- `rng: Rng = browserRng` - третий параметр необязательный, по умолчанию используется `browserRng`.

Правило выпадения:

```ts
const winThreshold = car.baseChance * 100_000 * chanceMult;
const roll = rng.integer(0, 10_000_000);

if (roll <= winThreshold) {
  return car;
}
```

Если за `SPIN_MAX_ATTEMPTS` машина не выпала, возвращается машина с самым большим `baseChance`. Это безопасный fallback для web-версии.

## `src/game/caseEngine.ts`

Файл: `yandex-game/src/game/caseEngine.ts`

Назначение:

- описывает обычные и эксклюзивные кейсы;
- выбирает машину через weighted random;
- поддерживает одиночное и массовое открытие.

Базовые кейсы:

```ts
export function getBaseCaseDefinitions(): CaseDefinition[] {
  return [
    {
      id: "case:uncommon",
      title: "Необычный+ кейс",
      minRarity: "Необычный",
      cost: UNCOMMON_CASE_COST,
    },
  ];
}
```

Синтаксис:

- функция возвращает массив `CaseDefinition[]`;
- объект внутри массива должен соответствовать типу `CaseDefinition`.

Эксклюзивные кейсы:

```ts
export function getExclusiveCaseDefinitions(cars: Car[]): CaseDefinition[] {
  return getExclusiveCars(cars).map((car) => ({
    id: `exclusive_case:${car.id}`,
    title: `${car.name} кейс`,
    minRarity: "Редкий",
    cost: EXCLUSIVE_CASE_COST,
    exclusiveCarId: car.id,
  }));
}
```

Синтаксис:

- `.map(...)` превращает массив эксклюзивных машин в массив кейсов.
- `` `exclusive_case:${car.id}` `` - template string. Внутрь строки вставляется значение `car.id`.
- `({ ... })` в стрелочной функции означает: вернуть объект.

Пул кейса:

```ts
return RARITY_RANKS[car.rarity] >= minRank && car.rarity !== "Эксклюзивный";
```

Правило:

- машина должна быть не ниже минимальной редкости;
- обычные кейсы не включают эксклюзивные машины.

Weighted random:

```ts
const weights = cars.map((car) => Math.max(car.baseChance, 0.0001));
const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
let roll = rng.float() * totalWeight;
```

Синтаксис:

- `.reduce(...)` сворачивает массив в одно значение.
- `let roll` используется, потому что значение дальше изменяется.

## `src/game/economy.ts`

Файл: `yandex-game/src/game/economy.ts`

Назначение:

- центральный файл экономики;
- меняет `SaveData`;
- содержит операции с гаражом, балансом, pending-наградой и улучшениями.

Важно: функции не изменяют старое сохранение напрямую, а возвращают новое.

Пример:

```ts
const nextSave = {
  ...save,
  money: save.money + car.value,
};
```

Такой подход проще контролировать и сохранять.

### Result-типы

Пример:

```ts
export type KeepPendingResult =
  | { status: "ok"; save: SaveData; added: InventoryCar }
  | { status: "no-pending"; save: SaveData }
  | { status: "garage-full"; save: SaveData };
```

Зачем это нужно:

- функция не просто падает ошибкой;
- UI может показать правильное сообщение;
- TypeScript понимает, какие поля доступны при каждом `status`.

### `getChanceUpgradeCost()`

Считает цену улучшения шанса:

```ts
return Math.trunc(CHANCE_BASE_COST * (1 + save.chanceLevel * 0.1));
```

`Math.trunc()` отбрасывает дробную часть.

### `getInventoryViews()`

Создает отображаемый гараж:

```ts
const carsById = new Map(cars.map((car) => [car.id, car]));
```

Сначала строится быстрый словарь машин по `id`. Затем каждая запись инвентаря соединяется с полной машиной из каталога.

Типовая проверка:

```ts
.filter((item): item is InventoryCarView => item !== null)
```

Это type guard. Он сообщает TypeScript: после фильтра `item` точно не `null`.

### `keepPendingReward()`

Правила:

- если pending нет, вернуть `no-pending`;
- если гараж полон, вернуть `garage-full`;
- иначе добавить машину в инвентарь и очистить pending.

### `sellPendingReward()`

Правила:

- найти pending-машину в каталоге;
- добавить `car.value` к балансу;
- очистить pending;
- увеличить `stats.carsSold`.

### `sellInventoryCar()`

Правила:

- найти конкретный экземпляр по `inventoryId`;
- найти машину по `carId`;
- удалить экземпляр из гаража;
- начислить деньги.

### `processCarIntoGarage()`

Это логика автоматической обработки машины при полном гараже.

Правила:

- если место есть, машина добавляется;
- если гараж заполнен, находится самая дешевая машина;
- если старая машина дороже новой, новая продается;
- иначе старая продается, новая добавляется.

### `processCarsIntoGarage()`

Используется для массовых кейсов:

- обрабатывает много машин подряд;
- считает `added`, `replaced`, `soldNew`, `earned`;
- возвращает `bestCars`.

### `buyChanceUpgrade()` и `buyGarageUpgrade()`

Обе функции:

- считают цену;
- проверяют деньги;
- возвращают `status: "money"`, если денег мало;
- возвращают новое сохранение, если покупка успешна.

## `src/data/cars.ts`

Файл: `yandex-game/src/data/cars.ts`

Назначение:

- хранит каталог всех машин;
- сгенерирован из `game/cars_data.py`;
- используется спином, кейсами, гаражом и загрузчиком изображений.

Структура:

```ts
export const CARS: Car[] = [
  {
    id: "lada_2106",
    name: "Лада 2106",
    rarity: "Обычный",
    value: 2500,
    baseChance: 100,
    points: 0,
    imageKey: "car:lada_2106",
    imageFile: "lada_2106.jpg",
  },
];
```

Синтаксис:

- `CARS: Car[]` означает: массив должен состоять только из объектов типа `Car`.
- каждый объект обязан иметь все поля из `Car`.

Не редактировать вручную без причины:

- файл генерируется скриптом `scripts/generate_yandex_cars_data.mjs`;
- ручные изменения могут затереться при повторной генерации.

## `src/services/yandexSdk.ts`

Файл: `yandex-game/src/services/yandexSdk.ts`

Назначение:

- обертка над Yandex Games SDK;
- скрывает прямые вызовы SDK от сцен;
- дает fallback, если SDK недоступен локально.

Класс:

```ts
export class YandexSdkService {
  private sdk: YandexGamesSdk | null = null;
  private player: YandexPlayer | null = null;
}
```

Синтаксис:

- `class` создает класс.
- `private` означает, что поле доступно только внутри класса.
- `YandexGamesSdk | null` означает: либо SDK, либо `null`.

Инициализация:

```ts
async init(): Promise<void> {
  if (!window.YaGames) {
    return;
  }

  this.sdk = await window.YaGames.init();
  this.player = await this.sdk.getPlayer({ scopes: false });
}
```

Если игра запущена локально без Яндекса, `window.YaGames` отсутствует, и функция просто завершится.

Экспорт singleton:

```ts
export const yandexSdk = new YandexSdkService();
```

Это один общий экземпляр сервиса для всей игры.

## `src/services/saveService.ts`

Файл: `yandex-game/src/services/saveService.ts`

Назначение:

- загружает и сохраняет прогресс;
- сначала пробует Yandex Player Data;
- если SDK недоступен, использует `localStorage`.

Getter:

```ts
get current(): SaveData {
  return this.saveData;
}
```

`get` делает метод похожим на поле:

```ts
const save = saveService.current;
```

Загрузка:

```ts
const sdkSave = await yandexSdk.loadPlayerData();
if (sdkSave) {
  this.saveData = sdkSave;
  return this.saveData;
}
```

Сначала используется SDK. Если сохранения нет, читается `localStorage`.

Обработка битого JSON:

```ts
try {
  this.saveData = JSON.parse(rawLocalSave) as SaveData;
} catch {
  window.localStorage.removeItem(LOCAL_STORAGE_KEY);
}
```

Синтаксис:

- `as SaveData` - type assertion. Мы говорим TypeScript считать результат `SaveData`.
- `catch` ловит ошибку парсинга.

## `src/services/leaderboardService.ts`

Файл: `yandex-game/src/services/leaderboardService.ts`

Назначение:

- считает очки игрока;
- отправляет score в Yandex Leaderboards;
- получает топ игроков.

Подсчет:

```ts
export function calculateScore(inventory: InventoryCar[], cars: Car[]): number {
  const carsById = new Map(cars.map((car) => [car.id, car]));
  return inventory.reduce((score, inventoryCar) => {
    return score + (carsById.get(inventoryCar.carId)?.points ?? 0);
  }, 0);
}
```

Синтаксис:

- `.reduce(...)` суммирует очки.
- `?.points` безопасно берет `points`, если машина найдена.
- `?? 0` подставляет `0`, если машина не найдена.

## `src/types/yandex-games.d.ts`

Файл: `yandex-game/src/types/yandex-games.d.ts`

Назначение:

- описывает типы внешнего Yandex Games SDK;
- нужен, потому что SDK подключается через `<script src="/sdk.js">`, а не через npm-пакет.

`declare global`:

```ts
declare global {
  interface Window {
    YaGames?: {
      init(): Promise<YandexGamesSdk>;
    };
  }
}
```

Синтаксис:

- `declare global` расширяет глобальные типы TypeScript.
- `interface Window` добавляет поле `YaGames` к браузерному `window`.
- `YaGames?` означает необязательное поле.

Почему `.d.ts`:

- такие файлы содержат только объявления типов;
- они не попадают в runtime JavaScript.

## `src/scenes/BootScene.ts`

Файл: `yandex-game/src/scenes/BootScene.ts`

Назначение:

- первая сцена игры;
- инициализирует SDK;
- загружает сохранение;
- запускает `PreloadScene`.

Класс сцены:

```ts
export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }
}
```

Синтаксис:

- `extends Phaser.Scene` означает наследование от класса Phaser.
- `super("BootScene")` вызывает конструктор родителя и задает ключ сцены.

Асинхронный `create()`:

```ts
async create(): Promise<void> {
  await yandexSdk.init();
  await saveService.load();
  this.scene.start("PreloadScene");
}
```

Phaser вызывает `create()` при старте сцены.

## `src/scenes/PreloadScene.ts`

Файл: `yandex-game/src/scenes/PreloadScene.ts`

Назначение:

- загружает изображения машин;
- показывает простой прогресс загрузки;
- запускает меню.

Загрузка изображений:

```ts
for (const car of CARS) {
  this.load.image(car.imageKey, `assets/cars/${car.imageFile}`);
}
```

Синтаксис:

- `for ... of` перебирает элементы массива.
- `this.load.image(key, url)` регистрирует загрузку картинки в Phaser.
- `car.imageKey` станет ключом текстуры.

Событие прогресса:

```ts
this.load.on("progress", (value: number) => {
  bar.width = 460 * value;
});
```

Phaser вызывает функцию каждый раз, когда меняется прогресс загрузки.

## `src/scenes/MenuScene.ts`

Файл: `yandex-game/src/scenes/MenuScene.ts`

Назначение:

- главное меню;
- показывает баланс и размер гаража;
- отправляет игрока в другие сцены.

Пример кнопки:

```ts
addTextButton(this, 640, 220, "Крутить", () => this.scene.start("SpinScene"));
```

Синтаксис:

- `this` - текущая сцена.
- `() => this.scene.start(...)` - callback, который выполнится при клике.

## `src/scenes/SpinScene.ts`

Файл: `yandex-game/src/scenes/SpinScene.ts`

Назначение:

- запускает обычный спин;
- показывает pending-награду;
- обрабатывает `Оставить` и `Продать`.

Поиск pending-машины:

```ts
const pendingCar = CARS.find((car) => car.id === save.pendingReward?.carId);
```

Синтаксис:

- `.find(...)` возвращает первый подходящий элемент или `undefined`.
- `save.pendingReward?.carId` безопасно читает `carId`, если pending есть.

Создание pending:

```ts
save.pendingReward = {
  source: "spin",
  carId: car.id,
  createdAt: Date.now(),
};
```

Это пока мутация текущего `save`, после которой вызывается `saveService.save(save)`.

Обработка результата:

```ts
const result = keepPendingReward(save);
if (result.status === "garage-full") {
  // показать сообщение
}
```

TypeScript по `status` понимает, какой вариант результата пришел.

## `src/scenes/GarageScene.ts`

Файл: `yandex-game/src/scenes/GarageScene.ts`

Назначение:

- показывает гараж;
- сортирует машины;
- продает выбранную машину.

Получение отображаемого списка:

```ts
const items = sortInventoryViews(getInventoryViews(save, CARS));
```

Сначала инвентарь соединяется с каталогом машин, потом сортируется.

Продажа:

```ts
const result = sellInventoryCar(save, inventoryId, CARS);
if (result.status === "ok") {
  await saveService.save(result.save);
}
```

UI не меняет баланс сам. Он вызывает экономическую функцию.

## `src/scenes/UpgradesScene.ts`

Файл: `yandex-game/src/scenes/UpgradesScene.ts`

Назначение:

- показывает текущий шанс и размер гаража;
- покупает улучшения.

Цена:

```ts
const chanceCost = getChanceUpgradeCost(save);
const garageCost = getGarageUpgradeCost(save);
```

Покупка:

```ts
const result = buyChanceUpgrade(save);
if (result.status !== "ok") {
  return;
}

await saveService.save(result.save);
this.scene.restart();
```

`return` здесь просто прекращает обработчик клика.

## `src/scenes/LeaderboardScene.ts`

Файл: `yandex-game/src/scenes/LeaderboardScene.ts`

Назначение:

- считает score;
- отправляет score в Яндекс;
- показывает топ игроков или fallback-сообщение.

Асинхронная сцена:

```ts
async create(): Promise<void> {
  const score = calculateScore(saveService.current.inventory, CARS);
  await submitScore(score);
}
```

Если SDK недоступен, сервис просто вернет пустой список, а сцена покажет локальное сообщение.

## `src/ui/buttons.ts`

Файл: `yandex-game/src/ui/buttons.ts`

Назначение:

- создает простую текстовую кнопку Phaser.

Функция:

```ts
export function addTextButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
): Phaser.GameObjects.Container
```

Синтаксис:

- параметры имеют типы после `:`;
- `onClick: () => void` означает функция без параметров, ничего не возвращает;
- возвращаемый тип - `Phaser.GameObjects.Container`.

Интерактивность:

```ts
container.setInteractive(
  new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
  Phaser.Geom.Rectangle.Contains,
);
container.on("pointerup", onClick);
```

Это делает контейнер кликабельным.

## `src/ui/carCard.ts`

Файл: `yandex-game/src/ui/carCard.ts`

Назначение:

- создает карточку машины;
- показывает фото, название, редкость и цену.

Картинка:

```ts
const image = scene.add.image(0, -72, car.imageKey);
image.setDisplaySize(360, 190);
```

`car.imageKey` должен быть заранее загружен в `PreloadScene`.

## `src/ui/layout.ts`

Файл: `yandex-game/src/ui/layout.ts`

Назначение:

- общие UI-элементы сцен;
- заголовок;
- кнопка возврата в меню.

Пример:

```ts
back.on("pointerup", () => scene.scene.start("MenuScene"));
```

При отпускании указателя запускается сцена меню.

## `src/styles.css`

Файл: `yandex-game/src/styles.css`

Назначение:

- убирает отступы браузера;
- делает canvas полноэкранным;
- отключает выделение текста и лишние touch-жесты.

Пример:

```css
html,
body,
#game {
  width: 100%;
  height: 100%;
  margin: 0;
}
```

Это обычный CSS, не TypeScript.

## `scripts/generate_yandex_cars_data.mjs`

Файл: `scripts/generate_yandex_cars_data.mjs`

Назначение:

- читает `game/cars_data.py`;
- создает `yandex-game/src/data/cars.ts`;
- копирует изображения в `yandex-game/public/assets/cars/`;
- создает отчет `docs/phaser-car-assets-audit.md`.

Почему `.mjs`:

- это JavaScript-модуль для Node.js;
- используется синтаксис `import fs from "node:fs"`;
- не компилируется TypeScript.

Основные блоки:

### Пути

```js
const rootDir = process.cwd();
const sourcePath = path.join(rootDir, "game", "cars_data.py");
```

`process.cwd()` - текущая рабочая папка, из которой запущен скрипт.

### Транслитерация

```js
const translitMap = new Map(Object.entries({ а: "a", б: "b" }));
```

`Map` используется для быстрого поиска соответствия кириллической буквы латинице.

### Парсинг машин

```js
const regex = /Car\("([^"]+)",\s*"([^"]+)",\s*(\d+),\s*([0-9.]+),\s*(\d+)\)/g;
```

Это регулярное выражение ищет строки вида:

```python
Car("Лада 2106", "Обычный", 2500, 100, 0)
```

### Генерация TypeScript

```js
return `import type { Car } from "../game/types";

export const CARS: Car[] = [
${body},
];
`;
```

Это template string. Скрипт собирает текст будущего `.ts` файла.

## `scripts/download_car_images.py`

Файл: `scripts/download_car_images.py`

Назначение:

- старый Python-скрипт для скачивания изображений машин с Wikipedia/Wikimedia;
- не относится напрямую к Phaser, но используется как источник ассетов.

Основные части:

- `get_all_cars()` получает список машин;
- `car_image_filename()` вычисляет имя файла;
- `ThreadPoolExecutor(max_workers=6)` скачивает несколько картинок параллельно;
- `fetch()` делает HTTP-запрос;
- `download_car()` скачивает одну машину.

Важно:

- скрипт работает с сетью;
- если изображение уже есть, он возвращает `exists`;
- сейчас Phaser-версия использует уже скачанные изображения.

## Как добавлять новый TypeScript-файл

1. Создать файл в подходящей папке:
   - `src/game/` для правил игры;
   - `src/scenes/` для экранов Phaser;
   - `src/services/` для внешних сервисов;
   - `src/ui/` для визуальных компонентов.

2. Экспортировать нужные функции:

```ts
export function myFunction(): void {
}
```

3. Импортировать их в другом файле:

```ts
import { myFunction } from "../game/myFile";
```

4. Запустить проверку:

```bash
npm run build
```

## Главное правило проекта

Игровые правила должны жить в `src/game/`, а сцены должны только показывать интерфейс и вызывать готовые функции.

Хорошо:

```ts
const result = sellInventoryCar(save, inventoryId, CARS);
```

Плохо:

```ts
save.money += car.value;
save.inventory = save.inventory.filter(...);
```

Такой подход помогает переносить игру дальше, писать тесты и не дублировать правила в разных сценах.
