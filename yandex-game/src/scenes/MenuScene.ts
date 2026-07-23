import Phaser from "phaser";
import { CARS } from "../data/cars";
import { calculateScore } from "../services/leaderboardService";
import { addTextButton } from "../ui/buttons";
import { addInfoText, addPanel, addSceneTitle } from "../ui/layout";
import { saveService } from "../services/saveService";
import { chanceMultFromLevel } from "../game/saveModel";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create(): void {
    const save = saveService.current;
    const score = calculateScore(save.inventory, CARS);
    const pendingCar = CARS.find((car) => car.id === save.pendingReward?.carId);

    addSceneTitle(this, "Cars RNG");

    addPanel(this, 48 + 260, 200, 520, 210);
    addInfoText(this, 88, 118, `Баланс: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "30px");
    addInfoText(this, 88, 160, `Гараж: ${save.inventory.length} / ${save.garageCap}`);
    addInfoText(this, 88, 196, `Множитель шанса: x${chanceMultFromLevel(save.chanceLevel).toFixed(1)}`);
    addInfoText(this, 88, 232, `Очки коллекции: ${score.toLocaleString("ru-RU")}`);

    if (pendingCar) {
      addPanel(this, 308, 382, 520, 96);
      addInfoText(this, 88, 350, `Ожидает решения: ${pendingCar.name}`, "#ffcf70", "24px");
      addTextButton(this, 440, 392, "Открыть", () => this.scene.start("SpinScene"), {
        width: 160,
        height: 46,
        fontSize: "20px",
      });
    }

    addPanel(this, 890, 360, 420, 420);
    addTextButton(this, 890, 190, pendingCar ? "Решить награду" : "Крутить", () => this.scene.start("SpinScene"), {
      width: 300,
    });
    addTextButton(this, 890, 270, "Гараж", () => this.scene.start("GarageScene"), { width: 300 });
    addTextButton(this, 890, 350, "Кейсы", () => this.scene.start("CasesScene"), { width: 300 });
    addTextButton(this, 890, 430, "Улучшения", () => this.scene.start("UpgradesScene"), { width: 300 });
    addTextButton(this, 890, 510, "Лидерборд", () => this.scene.start("LeaderboardScene"), { width: 300 });
  }
}
