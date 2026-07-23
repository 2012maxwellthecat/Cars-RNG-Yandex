import Phaser from "phaser";
import type { Car } from "../game/types";

const RARITY_COLORS: Record<Car["rarity"], string> = {
  Обычный: "#d9e6f2",
  Необычный: "#65d68b",
  Редкий: "#67a7ff",
  Эпический: "#c083ff",
  Легендарный: "#ffd166",
  Эксклюзивный: "#ff8b8b",
};

const RARITY_STROKES: Record<Car["rarity"], number> = {
  Обычный: 0x6f7c8c,
  Необычный: 0x65d68b,
  Редкий: 0x67a7ff,
  Эпический: 0xc083ff,
  Легендарный: 0xffd166,
  Эксклюзивный: 0xff8b8b,
};

export function rarityColor(rarity: Car["rarity"]): string {
  return RARITY_COLORS[rarity];
}

export function addCarCard(
  scene: Phaser.Scene,
  x: number,
  y: number,
  car: Car,
  options: { width?: number; height?: number; imageWidth?: number; imageHeight?: number } = {},
): Phaser.GameObjects.Container {
  const width = options.width ?? 460;
  const height = options.height ?? 360;
  const background = scene.add.rectangle(0, 0, width, height, 0x202938, 1);
  background.setStrokeStyle(3, RARITY_STROKES[car.rarity]);

  const image = scene.add.image(0, -72, car.imageKey);
  image.setDisplaySize(options.imageWidth ?? 360, options.imageHeight ?? 190);

  const name = scene.add
    .text(0, 62, car.name, {
      fontFamily: "Arial",
      fontSize: width < 360 ? "22px" : "30px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: width - 64 },
    })
    .setOrigin(0.5);

  const rarity = scene.add
    .text(0, 122, car.rarity, {
      fontFamily: "Arial",
      fontSize: "24px",
      color: RARITY_COLORS[car.rarity],
    })
    .setOrigin(0.5);

  const value = scene.add
    .text(0, 156, `${car.value.toLocaleString("ru-RU")} $`, {
      fontFamily: "Arial",
      fontSize: "26px",
      color: "#ffd166",
    })
    .setOrigin(0.5);

  return scene.add.container(x, y, [background, image, name, rarity, value]);
}
