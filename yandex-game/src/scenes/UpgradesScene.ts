import Phaser from "phaser";
import { GARAGE_STEP } from "../game/constants";
import { buyChanceUpgrade, buyGarageUpgrade, getChanceUpgradeCost, getGarageUpgradeCost } from "../game/economy";
import { chanceMultFromLevel } from "../game/saveModel";
import { saveService } from "../services/saveService";
import { addTextButton } from "../ui/buttons";
import { addBackToMenu, addSceneTitle } from "../ui/layout";

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

    this.add.text(48, 120, `Баланс: ${save.money.toLocaleString("ru-RU")}`, {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#ffd166",
    });

    this.add.text(48, 170, `Множитель шанса: x${chanceMultFromLevel(save.chanceLevel).toFixed(1)}`, {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#ffffff",
    });

    this.add.text(48, 210, `Размер гаража: ${save.garageCap}`, {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#ffffff",
    });

    addTextButton(this, 640, 330, `Шанс +0.1 за ${chanceCost.toLocaleString("ru-RU")}`, async () => {
      const result = buyChanceUpgrade(save);
      if (result.status !== "ok") {
        return;
      }

      await saveService.save(result.save);
      this.scene.restart();
    });

    addTextButton(this, 640, 420, `Гараж +${GARAGE_STEP} за ${garageCost.toLocaleString("ru-RU")}`, async () => {
      const result = buyGarageUpgrade(save);
      if (result.status !== "ok") {
        return;
      }

      await saveService.save(result.save);
      this.scene.restart();
    });
  }
}
