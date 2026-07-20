import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const sourcePath = path.join(rootDir, "game", "cars_data.py");
const sourceAssetsDir = path.join(rootDir, "assets", "cars");
const yandexDir = path.join(rootDir, "yandex-game");
const targetDataPath = path.join(yandexDir, "src", "data", "cars.ts");
const targetAssetsDir = path.join(yandexDir, "public", "assets", "cars");
const reportPath = path.join(rootDir, "docs", "phaser-car-assets-audit.md");

const translitMap = new Map(
  Object.entries({
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ы: "y",
    э: "e",
    ю: "yu",
    я: "ya",
    ь: "",
    ъ: "",
  }),
);

const imageAliases = new Map(
  Object.entries({
    citroends: "citroen_ds3",
    hondafit: "honda_jazz",
    toyota86: "toyota_gr86",
    bmw2series: "bmw_m2",
    shelbycobra: "ac_cobra",
    paganizonda: "pagani_zonda_c12",
    koenigseggagerars: "koenigsegg_agera",
  }),
);

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function asciiName(value) {
  return [...value.toLowerCase()]
    .map((char) => translitMap.get(char) ?? char)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x00-\x7F]/g, "");
}

function imageLookupKey(value) {
  return asciiName(value).replace(/[^a-z0-9]+/g, "");
}

function slugName(value) {
  return asciiName(value).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "car";
}

function parseCars() {
  const source = fs.readFileSync(sourcePath, "utf8");
  const regex = /Car\("([^"]+)",\s*"([^"]+)",\s*(\d+),\s*([0-9.]+),\s*(\d+)\)/g;
  const cars = [];
  let match;

  while ((match = regex.exec(source)) !== null) {
    cars.push({
      name: match[1],
      rarity: match[2],
      value: Number(match[3]),
      baseChance: Number(match[4]),
      points: Number(match[5]),
    });
  }

  return cars;
}

function buildImageIndex() {
  const index = new Map();
  const files = fs.readdirSync(sourceAssetsDir);

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!imageExtensions.has(ext)) {
      continue;
    }

    const stem = path.basename(file, path.extname(file));
    index.set(imageLookupKey(stem), file);
  }

  return index;
}

function copyAssets(files) {
  fs.mkdirSync(targetAssetsDir, { recursive: true });

  for (const file of files) {
    fs.copyFileSync(path.join(sourceAssetsDir, file), path.join(targetAssetsDir, file));
  }
}

function formatTs(cars) {
  const body = cars
    .map((car) => {
      return `  {
    id: ${JSON.stringify(car.id)},
    name: ${JSON.stringify(car.name)},
    rarity: ${JSON.stringify(car.rarity)},
    value: ${car.value},
    baseChance: ${car.baseChance},
    points: ${car.points},
    imageKey: ${JSON.stringify(car.imageKey)},
    imageFile: ${JSON.stringify(car.imageFile)},
  }`;
    })
    .join(",\n");

  return `import type { Car } from "../game/types";

export const CARS: Car[] = [
${body},
];
`;
}

function formatReport(cars, missingImages, copiedFiles) {
  const rarityCounts = new Map();
  for (const car of cars) {
    rarityCounts.set(car.rarity, (rarityCounts.get(car.rarity) ?? 0) + 1);
  }

  const rarityLines = [...rarityCounts.entries()]
    .map(([rarity, count]) => `| ${rarity} | ${count} |`)
    .join("\n");

  const missingBlock =
    missingImages.length === 0
      ? "Пропущенных изображений нет."
      : missingImages.map((car) => `- ${car.name} (${car.id})`).join("\n");

  return `# Аудит переноса машин и изображений

Документ фиксирует результат этапа 3 переноса данных машин в Phaser/Yandex Games.

## Итог

| Проверка | Результат |
|---|---:|
| Машин в каталоге Python | ${cars.length} |
| Машин перенесено в TypeScript | ${cars.length} |
| Изображений скопировано в web-проект | ${copiedFiles.length} |
| Машин без изображения | ${missingImages.length} |

## Машины по редкости

| Редкость | Количество |
|---|---:|
${rarityLines}

## Проверка изображений

${missingBlock}

## Принятый формат

- TypeScript-каталог: \`yandex-game/src/data/cars.ts\`
- Web-ассеты: \`yandex-game/public/assets/cars/\`
- \`id\`: стабильный slug на основе названия машины.
- \`imageKey\`: ключ текстуры Phaser в формате \`car:<id>\`.
- \`imageFile\`: фактическое имя файла в \`public/assets/cars/\`.

## Правила сопоставления изображений

Использована логика из \`game/car_images.py\`:

- транслитерация кириллицы;
- удаление символов кроме \`a-z0-9\` для lookup-ключа;
- alias-ы для известных расхождений в названиях.
`;
}

const parsedCars = parseCars();
const imageIndex = buildImageIndex();
const missingImages = [];
const usedFiles = new Set();

const cars = parsedCars.map((car) => {
  const id = slugName(car.name);
  const lookupKey = imageLookupKey(car.name);
  const alias = imageAliases.get(lookupKey);
  const imageFile = imageIndex.get(alias ? imageLookupKey(alias) : lookupKey);

  if (!imageFile) {
    missingImages.push({ ...car, id });
  } else {
    usedFiles.add(imageFile);
  }

  return {
    ...car,
    id,
    imageKey: `car:${id}`,
    imageFile: imageFile ?? "",
  };
});

copyAssets(usedFiles);
fs.writeFileSync(targetDataPath, formatTs(cars), "utf8");
fs.writeFileSync(reportPath, formatReport(cars, missingImages, [...usedFiles]), "utf8");

console.log(`Cars parsed: ${parsedCars.length}`);
console.log(`Images copied: ${usedFiles.size}`);
console.log(`Missing images: ${missingImages.length}`);
