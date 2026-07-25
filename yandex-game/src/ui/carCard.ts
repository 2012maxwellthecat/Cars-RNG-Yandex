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

// Gradient top/bottom colors per rarity for card background
const RARITY_BG_TOP: Record<Car["rarity"], number> = {
  Обычный:   0x2a3040,
  Необычный: 0x1a3828,
  Редкий:    0x1a2860,
  Эпический: 0x2d1a58,
  Легендарный: 0x3c2c0a,
  Эксклюзивный: 0x3c1a1a,
};

const RARITY_BG_BOTTOM: Record<Car["rarity"], number> = {
  Обычный:   0x141820,
  Необычный: 0x0d2018,
  Редкий:    0x0d1840,
  Эпический: 0x1d0e40,
  Легендарный: 0x201800,
  Эксклюзивный: 0x200a0a,
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
  const radius = 16;
  const hw = width / 2;
  const hh = height / 2;

  const gfx = scene.add.graphics();

  // Rarity-tinted gradient background
  const bgTop = RARITY_BG_TOP[car.rarity];
  const bgBot = RARITY_BG_BOTTOM[car.rarity];
  gfx.fillGradientStyle(bgTop, bgTop, bgBot, bgBot, 1);
  gfx.fillRoundedRect(-hw, -hh, width, height, radius);

  // Top shimmer
  gfx.fillGradientStyle(0xffffff, 0xffffff, bgTop, bgTop, 0.08);
  gfx.fillRoundedRect(-hw + 2, -hh + 2, width - 4, height * 0.35, { tl: radius, tr: radius, bl: 0, br: 0 });

  // Rarity border glow
  gfx.lineStyle(3, RARITY_STROKES[car.rarity], 1);
  gfx.strokeRoundedRect(-hw, -hh, width, height, radius);

  // Scale all Y positions proportionally from the reference height of 360
  const vscale = height / 360;
  const imgH = options.imageHeight ?? 190;
  const imgW = options.imageWidth ?? 360;
  // Keep image inside card: top edge = imageY - imgH/2 >= -hh + 6
  const imageY = Math.max(-hh + imgH / 2 + 6, Math.round(-72 * vscale));

  const image = scene.add.image(0, imageY, car.imageKey);
  image.setDisplaySize(Math.min(imgW, width - 16), imgH);

  const nameY = Math.round(62 * vscale);
  const rarityY = Math.round(108 * vscale);
  const valueY = Math.min(Math.round(144 * vscale), hh - 16);

  const name = scene.add
    .text(0, nameY, car.name, {
      fontFamily: "'Arial Black', Arial",
      fontStyle: "bold",
      fontSize: width < 400 ? "20px" : "26px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
      align: "center",
      wordWrap: { width: width - 32 },
    })
    .setOrigin(0.5);

  const rarity = scene.add
    .text(0, rarityY, car.rarity, {
      fontFamily: "'Arial Black', Arial",
      fontStyle: "bold",
      fontSize: "20px",
      color: RARITY_COLORS[car.rarity],
      stroke: "#000000",
      strokeThickness: 3,
    })
    .setOrigin(0.5);

  const value = scene.add
    .text(0, valueY, `${car.value.toLocaleString("ru-RU")} $`, {
      fontFamily: "'Arial Black', Arial",
      fontStyle: "bold",
      fontSize: "22px",
      color: "#ffd166",
      stroke: "#000000",
      strokeThickness: 3,
    })
    .setOrigin(0.5);

  return scene.add.container(x, y, [gfx, image, name, rarity, value]);
}
