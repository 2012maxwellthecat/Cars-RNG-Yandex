import Phaser from "phaser";
import { addTextButton } from "../ui/buttons";
import { addSceneTitle } from "../ui/layout";
import { saveService } from "../services/saveService";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create(): void {
    const save = saveService.current;
    addSceneTitle(this, "Cars RNG");

    this.add.text(48, 100, `Баланс: ${save.money.toLocaleString("ru-RU")}`, {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#ffd166",
    });

    this.add.text(48, 136, `Гараж: ${save.inventory.length} / ${save.garageCap}`, {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#d9e6f2",
    });

    addTextButton(this, 640, 220, "Крутить", () => this.scene.start("SpinScene"));
    addTextButton(this, 640, 300, "Гараж", () => this.scene.start("GarageScene"));
    addTextButton(this, 640, 380, "Улучшения", () => this.scene.start("UpgradesScene"));
    addTextButton(this, 640, 460, "Лидерборд", () => this.scene.start("LeaderboardScene"));
  }
}
