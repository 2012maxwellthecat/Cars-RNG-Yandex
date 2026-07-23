import Phaser from "phaser";
import { GARAGE_STEP } from "../game/constants";
import { buyChanceUpgrade, buyGarageUpgrade, getChanceUpgradeCost, getGarageUpgradeCost } from "../game/economy";
import { chanceMultFromLevel } from "../game/saveModel";
import { saveService } from "../services/saveService";
import { addTextButton } from "../ui/buttons";
import { addBackToMenu, addInfoText, addPanel, addSceneTitle } from "../ui/layout";

export class UpgradesScene extends Phaser.Scene {
  constructor() {
    super("UpgradesScene");
  }

  create(): void {
    const save = saveService.current;
    const chanceCost = getChanceUpgradeCost(save);
    const garageCost = getGarageUpgradeCost(save);

    addSceneTitle(this, "Улучшения");
    addBackToMenu(this);

    addPanel(this, 640, 370, 820, 430);
    addInfoText(this, 270, 154, `Баланс: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "30px");
    addInfoText(this, 270, 202, `Множитель шанса: x${chanceMultFromLevel(save.chanceLevel).toFixed(1)}`, "#ffffff");
    addInfoText(this, 270, 238, `Размер гаража: ${save.garageCap}`, "#ffffff");

    addInfoText(this, 270, 318, "Шанс влияет на обычный спин.", "#d9e6f2", "22px");
    addInfoText(this, 270, 408, "Гараж определяет, сколько машин можно хранить.", "#d9e6f2", "22px");

    addTextButton(this, 640, 330, `Шанс +0.1 за ${chanceCost.toLocaleString("ru-RU")}`, async () => {
      const result = buyChanceUpgrade(save);
      if (result.status !== "ok") {
        return;
      }

      await saveService.save(result.save);
      this.scene.restart();
    }, { width: 430, disabled: save.money < chanceCost });

    addTextButton(this, 640, 420, `Гараж +${GARAGE_STEP} за ${garageCost.toLocaleString("ru-RU")}`, async () => {
      const result = buyGarageUpgrade(save);
      if (result.status !== "ok") {
        return;
      }

      await saveService.save(result.save);
      this.scene.restart();
    }, { width: 430, disabled: save.money < garageCost });
  }
}
