import Phaser from "phaser";
import { CARS } from "../data/cars";
import { calculateScore } from "../services/leaderboardService";
import { addTextButton } from "../ui/buttons";
import { addInfoText, addPanel, addSceneTitle, getResponsiveLayout } from "../ui/layout";
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
    const layout = getResponsiveLayout(this);

    addSceneTitle(this, "Cars RNG");

    const leftPanelWidth = layout.width * 0.406; // ~520px at 1280
    const leftPanelX = layout.padding + leftPanelWidth / 2;
    const infoY = layout.height * 0.164;

    addPanel(this, leftPanelX, layout.height * 0.278, leftPanelWidth, layout.height * 0.292);
    addInfoText(this, layout.padding * 1.83, infoY, `Баланс: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "30px");
    addInfoText(this, layout.padding * 1.83, infoY + 42, `Гараж: ${save.inventory.length} / ${save.garageCap}`);
    addInfoText(this, layout.padding * 1.83, infoY + 78, `Множитель шанса: x${chanceMultFromLevel(save.chanceLevel).toFixed(1)}`);
    addInfoText(this, layout.padding * 1.83, infoY + 114, `Очки коллекции: ${score.toLocaleString("ru-RU")}`);

    if (pendingCar) {
      const pendingPanelY = layout.height * 0.53;
      addPanel(this, leftPanelX, pendingPanelY, leftPanelWidth, layout.height * 0.133);
      addInfoText(this, layout.padding * 1.83, layout.height * 0.486, `Ожидает решения: ${pendingCar.name}`, "#ffcf70", "22px", {
        width: layout.width * 0.195,
        maxLines: 2,
      });
      addTextButton(this, leftPanelX + layout.width * 0.103, pendingPanelY, "Открыть", () => this.scene.start("SpinScene"), {
        width: 160,
        height: 46,
        fontSize: "20px",
      });
    }

    const rightPanelWidth = layout.width * 0.328; // ~420px at 1280
    const rightPanelX = layout.width * 0.695;
    const buttonX = rightPanelX;

    addPanel(this, rightPanelX, layout.height * 0.5, rightPanelWidth, layout.height * 0.583);
    addTextButton(this, buttonX, layout.height * 0.264, pendingCar ? "Решить награду" : "Крутить", () => this.scene.start("SpinScene"), {
      width: 300,
    });
    addTextButton(this, buttonX, layout.height * 0.375, "Гараж", () => this.scene.start("GarageScene"), { width: 300 });
    addTextButton(this, buttonX, layout.height * 0.486, "Кейсы", () => this.scene.start("CasesScene"), { width: 300 });
    addTextButton(this, buttonX, layout.height * 0.597, "Улучшения", () => this.scene.start("UpgradesScene"), { width: 300 });
    addTextButton(this, buttonX, layout.height * 0.708, "Лидерборд", () => this.scene.start("LeaderboardScene"), { width: 300 });
  }
}
