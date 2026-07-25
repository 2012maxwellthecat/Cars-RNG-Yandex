import Phaser from "phaser";
import { GARAGE_STEP } from "../game/constants";
import { buyChanceUpgrade, buyGarageUpgrade, getChanceUpgradeCost, getGarageUpgradeCost } from "../game/economy";
import { chanceMultFromLevel } from "../game/saveModel";
import { saveService } from "../services/saveService";
import { addTextButton } from "../ui/buttons";
import { addBackToMenu, addInfoText, addPanel, addSceneTitle, drawBackground, getResponsiveLayout } from "../ui/layout";

export class UpgradesScene extends Phaser.Scene {
  constructor() {
    super("UpgradesScene");
  }

  create(): void {
    drawBackground(this);
    const save = saveService.current;
    const chanceCost = getChanceUpgradeCost(save);
    const garageCost = getGarageUpgradeCost(save);
    const layout = getResponsiveLayout(this);

    addSceneTitle(this, "Улучшения");
    addBackToMenu(this);

    const panelWidth = layout.width * 0.64; // ~820px at 1280
    const panelHeight = layout.height * 0.597; // ~430px at 720
    const centerX = layout.width * 0.5;
    const centerY = layout.height * 0.49;

    addPanel(this, centerX, centerY, panelWidth, panelHeight);

    const leftX = layout.width * 0.21;
    const topY = layout.height * 0.21;

    addInfoText(this, leftX, topY, `Баланс: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "30px");
    addInfoText(this, leftX, topY + 48, `Множитель шанса: x${chanceMultFromLevel(save.chanceLevel).toFixed(1)}`, "#ffffff");
    addInfoText(this, leftX, topY + 84, `Размер гаража: ${save.garageCap}`, "#ffffff");

    const chanceDescY = layout.height * 0.418;
    const garageDescY = layout.height * 0.593;
    const chanceButtonY = layout.height * 0.518;
    const garageButtonY = layout.height * 0.693;

    addInfoText(this, leftX, chanceDescY, "Шанс влияет на обычный спин.", "#d9e6f2", "22px");
    addInfoText(this, leftX, garageDescY, "Гараж определяет, сколько машин можно хранить.", "#d9e6f2", "22px");

    addTextButton(this, centerX, chanceButtonY, `Шанс +0.1 за ${chanceCost.toLocaleString("ru-RU")}`, async () => {
      const result = buyChanceUpgrade(save);
      if (result.status !== "ok") {
        return;
      }

      await saveService.save(result.save);
      this.scene.restart();
    }, { width: 430, disabled: save.money < chanceCost });

    addTextButton(this, centerX, garageButtonY, `Гараж +${GARAGE_STEP} за ${garageCost.toLocaleString("ru-RU")}`, async () => {
      const result = buyGarageUpgrade(save);
      if (result.status !== "ok") {
        return;
      }

      await saveService.save(result.save);
      this.scene.restart();
    }, { width: 430, disabled: save.money < garageCost });
  }
}
