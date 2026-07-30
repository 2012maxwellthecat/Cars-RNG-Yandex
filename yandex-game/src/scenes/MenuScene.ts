import Phaser from "phaser";
import { CARS } from "../data/cars";
import { calculateScore } from "../services/leaderboardService";
import { advertisementService } from "../services/advertisementService";
import { addTextButton } from "../ui/buttons";
import { addInfoText, addPanel, addSceneTitle, drawBackground, getResponsiveLayout } from "../ui/layout";
import { saveService } from "../services/saveService";
import { chanceMultFromLevel, type SaveData } from "../game/saveModel";

// Счетчик возвратов в меню для показа fullscreen рекламы
let menuVisitCounter = 0;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  async create(): Promise<void> {
    drawBackground(this);
    const save = saveService.current;
    const score = calculateScore(save.inventory, CARS);
    const pendingCar = CARS.find((car) => car.id === save.pendingReward?.carId);
    const layout = getResponsiveLayout(this);

    // Показ fullscreen рекламы каждые 4 возврата в меню
    menuVisitCounter++;
    if (menuVisitCounter % 4 === 0 && advertisementService.canShowAd('fullscreen', 180000)) {
      await advertisementService.showFullscreenAd();
    }

    addSceneTitle(this, "Cars RNG");

    if (layout.isPortrait) {
      this.createPortraitLayout(save, score, pendingCar, layout);
    } else {
      this.createLandscapeLayout(save, score, pendingCar, layout);
    }
  }

  private createPortraitLayout(
    save: SaveData,
    score: number,
    pendingCar: ReturnType<typeof CARS.find>,
    layout: ReturnType<typeof getResponsiveLayout>
  ): void {
    const cx = layout.width * 0.5;
    const infoPanelWidth = layout.width * 0.88;
    const infoPanelY = layout.height * 0.14;

    // Info panel with stats
    addPanel(this, cx, infoPanelY, infoPanelWidth, layout.height * 0.14);
    addInfoText(this, layout.padding * 1.5, layout.height * 0.09, `Баланс: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "26px");
    addInfoText(this, layout.padding * 1.5, layout.height * 0.12, `Гараж: ${save.inventory.length} / ${save.garageCap}`, "#d9e6f2", "22px");
    addInfoText(this, layout.padding * 1.5, layout.height * 0.145, `Множитель: x${chanceMultFromLevel(save.chanceLevel).toFixed(1)}`, "#d9e6f2", "22px");
    addInfoText(this, layout.padding * 1.5, layout.height * 0.17, `Очки: ${score.toLocaleString("ru-RU")}`, "#d9e6f2", "22px");

    // Pending reward notification
    if (pendingCar) {
      const pendingY = layout.height * 0.255;
      addPanel(this, cx, pendingY, infoPanelWidth, layout.height * 0.09);
      addInfoText(this, layout.padding * 1.5, layout.height * 0.225, `Ожидает: ${pendingCar.name}`, "#ffcf70", "22px", {
        width: layout.width * 0.5,
        maxLines: 2,
      });
      addTextButton(this, layout.width * 0.73, pendingY, "Открыть", () => this.scene.start("SpinScene"), {
        width: 150,
        height: 50,
        fontSize: "20px",
      });
    }

    // Main buttons panel
    const buttonsPanelY = pendingCar ? layout.height * 0.38 : layout.height * 0.3;
    const buttonsPanelHeight = pendingCar ? layout.height * 0.52 : layout.height * 0.58;
    addPanel(this, cx, buttonsPanelY + buttonsPanelHeight / 2, infoPanelWidth, buttonsPanelHeight);

    // Large centered buttons with better spacing
    const btnWidth = layout.width * 0.8;
    const btnHeight = 64;
    const btnSpacing = layout.height * 0.095;
    let btnY = buttonsPanelY + layout.height * 0.055;

    addTextButton(this, cx, btnY, pendingCar ? "Решить награду" : "Крутить", () => this.scene.start("SpinScene"), {
      width: btnWidth,
      height: btnHeight,
      fontSize: "24px",
    });
    btnY += btnSpacing;
    addTextButton(this, cx, btnY, "Гараж", () => this.scene.start("GarageScene"), {
      width: btnWidth,
      height: btnHeight,
      fontSize: "24px",
    });
    btnY += btnSpacing;
    addTextButton(this, cx, btnY, "Кейсы", () => this.scene.start("CasesScene"), {
      width: btnWidth,
      height: btnHeight,
      fontSize: "24px",
    });
    btnY += btnSpacing;
    addTextButton(this, cx, btnY, "Улучшения", () => this.scene.start("UpgradesScene"), {
      width: btnWidth,
      height: btnHeight,
      fontSize: "24px",
    });
    btnY += btnSpacing;
    addTextButton(this, cx, btnY, "Лидерборд", () => this.scene.start("LeaderboardScene"), {
      width: btnWidth,
      height: btnHeight,
      fontSize: "24px",
    });

    // Кнопка бонусных денег за рекламу
    const canShowBonusAd = advertisementService.canShowAd('bonus-money', 900000); // 15 минут
    if (canShowBonusAd) {
      btnY += btnSpacing;
      addTextButton(this, cx, btnY, "🎁 Получить 50000$", async () => {
        const success = await advertisementService.showRewardedAd(() => {
          // Выдать бонус денег
          const updatedSave = {
            ...saveService.current,
            money: saveService.current.money + 50000,
            stats: {
              ...saveService.current.stats,
              rewardedAdsWatched: saveService.current.stats.rewardedAdsWatched + 1,
            },
          };
          void saveService.save(updatedSave).then(() => {
            this.scene.restart();
          });
        }, 'bonus-money', 900000);

        if (!success) {
          const errorText = addInfoText(this, cx, layout.height * 0.92, "Реклама временно недоступна", "#ff8b8b", "18px");
          this.time.delayedCall(2000, () => errorText.destroy());
        }
      }, {
        width: btnWidth,
        height: btnHeight,
        fillColor: 0x27ae60,
        fontSize: "22px",
      });
    }
  }

  private createLandscapeLayout(
    save: SaveData,
    score: number,
    pendingCar: ReturnType<typeof CARS.find>,
    layout: ReturnType<typeof getResponsiveLayout>
  ): void {
    const leftPanelWidth = layout.width * 0.406;
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

    const rightPanelWidth = layout.width * 0.328;
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

    // Кнопка бонусных денег за рекламу (landscape)
    const canShowBonusAd = advertisementService.canShowAd('bonus-money', 900000); // 15 минут
    if (canShowBonusAd) {
      addTextButton(this, buttonX, layout.height * 0.819, "🎁 Получить 50000$", async () => {
        const success = await advertisementService.showRewardedAd(() => {
          const updatedSave = {
            ...saveService.current,
            money: saveService.current.money + 50000,
            stats: {
              ...saveService.current.stats,
              rewardedAdsWatched: saveService.current.stats.rewardedAdsWatched + 1,
            },
          };
          void saveService.save(updatedSave).then(() => {
            this.scene.restart();
          });
        }, 'bonus-money', 900000);

        if (!success) {
          const errorText = addInfoText(this, buttonX, layout.height * 0.92, "Реклама недоступна", "#ff8b8b", "16px");
          this.time.delayedCall(2000, () => errorText.destroy());
        }
      }, { width: 300, height: 50, fillColor: 0x27ae60, fontSize: "20px" });
    }
  }
}
