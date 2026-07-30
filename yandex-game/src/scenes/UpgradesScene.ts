import Phaser from "phaser";
import { GARAGE_STEP } from "../game/constants";
import { buyChanceUpgrade, buyGarageUpgrade, getChanceUpgradeCost, getGarageUpgradeCost } from "../game/economy";
import { chanceMultFromLevel } from "../game/saveModel";
import { saveService } from "../services/saveService";
import { advertisementService } from "../services/advertisementService";
import { addTextButton } from "../ui/buttons";
import { addBackToMenu, addInfoText, addPanel, addSceneTitle, drawBackground, getResponsiveLayout } from "../ui/layout";

export class UpgradesScene extends Phaser.Scene {
  private hasDiscount = false;

  constructor() {
    super("UpgradesScene");
  }

  init(data: { discount?: boolean } = {}): void {
    this.hasDiscount = data.discount ?? false;
  }

  create(): void {
    drawBackground(this);
    const save = saveService.current;
    const discount = this.hasDiscount ? 50 : 0;
    const chanceCost = getChanceUpgradeCost(save, discount);
    const garageCost = getGarageUpgradeCost(save, discount);
    const layout = getResponsiveLayout(this);

    // Уведомить advertisementService о смене сцены
    advertisementService.notifySceneChange("UpgradesScene");

    // Скидка 50% на улучшения за просмотр рекламы (доступна раз в 30 минут)
    const canShowDiscount = !this.hasDiscount && advertisementService.canShowAd('upgrade-discount', 1800000);

    addSceneTitle(this, "Улучшения");
    addBackToMenu(this);

    if (layout.isPortrait) {
      const panelWidth = layout.width * 0.88;
      const panelHeight = layout.height * 0.7;
      const centerX = layout.width * 0.5;
      const centerY = layout.height * 0.5;

      addPanel(this, centerX, centerY, panelWidth, panelHeight);

      const leftX = layout.padding * 1.5;
      const topY = layout.height * 0.11;

      addInfoText(this, leftX, topY, `Баланс: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "28px");
      addInfoText(this, leftX, topY + 44, `Множитель: x${chanceMultFromLevel(save.chanceLevel).toFixed(1)}`, "#ffffff", "24px");
      addInfoText(this, leftX, topY + 82, `Гараж: ${save.garageCap}`, "#ffffff", "24px");

      if (this.hasDiscount) {
        addInfoText(this, leftX, topY + 120, "✨ Скидка 50% активна!", "#27ae60", "22px");
      }

      const chanceDescY = layout.height * 0.32;
      const garageDescY = layout.height * 0.56;
      const chanceButtonY = layout.height * 0.42;
      const garageButtonY = layout.height * 0.66;

      addInfoText(this, leftX, chanceDescY, "Шанс влияет на обычный спин.", "#d9e6f2", "22px", { width: layout.width * 0.8 });
      addInfoText(this, leftX, garageDescY, "Гараж определяет, сколько машин можно хранить.", "#d9e6f2", "22px", { width: layout.width * 0.8 });

      addTextButton(this, centerX, chanceButtonY, `Шанс +0.1 за ${chanceCost.toLocaleString("ru-RU")}`, async () => {
        const result = buyChanceUpgrade(save);
        if (result.status !== "ok") return;
        await saveService.save(result.save);
        this.scene.restart();
      }, { width: layout.width * 0.8, height: 64, fontSize: "24px", disabled: save.money < chanceCost });

      addTextButton(this, centerX, garageButtonY, `Гараж +${GARAGE_STEP} за ${garageCost.toLocaleString("ru-RU")}`, async () => {
        const result = buyGarageUpgrade(save);
        if (result.status !== "ok") return;
        await saveService.save(result.save);
        this.scene.restart();
      }, { width: layout.width * 0.8, height: 64, fontSize: "24px", disabled: save.money < garageCost });

      // Кнопка скидки за рекламу (portrait)
      if (canShowDiscount) {
        const discountButtonY = layout.height * 0.76;
        addInfoText(this, leftX, discountButtonY - 35, "🎁 Скидка 50% на любое улучшение", "#27ae60", "20px", { width: layout.width * 0.8 });
        addTextButton(this, centerX, discountButtonY, "Смотреть рекламу", async () => {
          const success = await advertisementService.showRewardedAd(() => {
            // Перезапустить сцену со скидкой
            this.scene.restart({ discount: true });
          }, 'upgrade-discount', 1800000);

          if (!success) {
            addInfoText(this, centerX, layout.height * 0.9, "Реклама недоступна", "#ff8b8b", "18px");
          }
        }, { width: layout.width * 0.7, height: 56, fillColor: 0x27ae60, fontSize: "22px" });
      }
    } else {
      const panelWidth = layout.width * 0.64;
      const panelHeight = layout.height * 0.597;
      const centerX = layout.width * 0.5;
      const centerY = layout.height * 0.49;

      addPanel(this, centerX, centerY, panelWidth, panelHeight);

      const leftX = layout.width * 0.21;
      const topY = layout.height * 0.21;

      addInfoText(this, leftX, topY, `Баланс: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "30px");
      addInfoText(this, leftX, topY + 48, `Множитель шанса: x${chanceMultFromLevel(save.chanceLevel).toFixed(1)}`, "#ffffff");
      addInfoText(this, leftX, topY + 84, `Размер гаража: ${save.garageCap}`, "#ffffff");

      if (this.hasDiscount) {
        addInfoText(this, leftX, topY + 120, "✨ Скидка 50% активна!", "#27ae60", "20px");
      }

      const chanceDescY = layout.height * 0.418;
      const garageDescY = layout.height * 0.593;
      const chanceButtonY = layout.height * 0.518;
      const garageButtonY = layout.height * 0.693;

      addInfoText(this, leftX, chanceDescY, "Шанс влияет на обычный спин.", "#d9e6f2", "22px");
      addInfoText(this, leftX, garageDescY, "Гараж определяет, сколько машин можно хранить.", "#d9e6f2", "22px");

      addTextButton(this, centerX, chanceButtonY, `Шанс +0.1 за ${chanceCost.toLocaleString("ru-RU")}`, async () => {
        const result = buyChanceUpgrade(save);
        if (result.status !== "ok") return;
        await saveService.save(result.save);
        this.scene.restart();
      }, { width: 430, disabled: save.money < chanceCost });

      addTextButton(this, centerX, garageButtonY, `Гараж +${GARAGE_STEP} за ${garageCost.toLocaleString("ru-RU")}`, async () => {
        const result = buyGarageUpgrade(save);
        if (result.status !== "ok") return;
        await saveService.save(result.save);
        this.scene.restart();
      }, { width: 430, disabled: save.money < garageCost });

      // Кнопка скидки за рекламу (landscape)
      if (canShowDiscount) {
        const discountButtonY = layout.height * 0.793;
        addInfoText(this, leftX, discountButtonY - 30, "🎁 Скидка 50% на любое улучшение за рекламу", "#27ae60", "18px");
        addTextButton(this, centerX, discountButtonY, "Смотреть рекламу", async () => {
          const success = await advertisementService.showRewardedAd(() => {
            this.scene.restart({ discount: true });
          }, 'upgrade-discount', 1800000);

          if (!success) {
            addInfoText(this, centerX, layout.height * 0.88, "Реклама недоступна", "#ff8b8b", "16px");
          }
        }, { width: 360, height: 50, fillColor: 0x27ae60, fontSize: "20px" });
      }
    }
  }
}
