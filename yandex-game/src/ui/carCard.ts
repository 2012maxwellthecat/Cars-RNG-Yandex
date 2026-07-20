import Phaser from "phaser";
import type { Car } from "../game/types";

export function addCarCard(scene: Phaser.Scene, x: number, y: number, car: Car): Phaser.GameObjects.Container {
  const background = scene.add.rectangle(0, 0, 460, 360, 0x202938, 1);
  background.setStrokeStyle(2, 0x55677f);

  const image = scene.add.image(0, -72, car.imageKey);
  image.setDisplaySize(360, 190);

  const name = scene.add
    .text(0, 62, car.name, {
      fontFamily: "Arial",
      fontSize: "30px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: 360 },
    })
    .setOrigin(0.5);

  const rarity = scene.add
    .text(0, 122, car.rarity, {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#9fc8ff",
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
