import Phaser from "phaser";
import { CARS } from "../data/cars";
import { audioService } from "../services/audioService";
import { i18nService } from "../i18n/i18nService";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const t = i18nService.getTranslations();

    const label = this.add
      .text(width / 2, height / 2 - 42, t.loadingCars, {
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
      label.setText(t.ready);
    });

    // Загрузка изображений машин
    for (const car of CARS) {
      this.load.image(car.imageKey, `assets/cars/${car.imageFile}`);
    }

    // Загрузка звуковых файлов
    // Музыка
    this.load.audio("bgMusic", "assets/audio/music/background-music.wav");

    // Звуковые эффекты
    this.load.audio("click", "assets/audio/sounds/click.wav");
    this.load.audio("button", "assets/audio/sounds/button.wav");
    this.load.audio("spin", "assets/audio/sounds/spin.wav");
    this.load.audio("win", "assets/audio/sounds/win.wav");
    this.load.audio("caseOpen", "assets/audio/sounds/case-open.wav");
  }

  create(): void {
    // Инициализация аудио сервиса
    audioService.init(this);

    this.scene.start("MenuScene");
  }
}
