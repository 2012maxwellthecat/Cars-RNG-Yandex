import Phaser from "phaser";
import { CARS } from "../data/cars";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const label = this.add
      .text(width / 2, height / 2 - 42, "Загрузка машин", {
        fontFamily: "Arial",
        fontSize: "30px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const barBackground = this.add.rectangle(width / 2, height / 2 + 8, 460, 20, 0x263244);
    const bar = this.add.rectangle(width / 2 - 230, height / 2 + 8, 0, 20, 0x2f7dd1).setOrigin(0, 0.5);

    this.load.on("progress", (value: number) => {
      bar.width = 460 * value;
    });

    this.load.on("complete", () => {
      label.setText("Готово");
    });

    for (const car of CARS) {
      this.load.image(car.imageKey, `assets/cars/${car.imageFile}`);
    }
  }

  create(): void {
    this.scene.start("MenuScene");
  }
}
