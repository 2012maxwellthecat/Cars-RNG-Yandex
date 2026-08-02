import Phaser from "phaser";
import { CARS } from "../data/cars";
import { calculateScore } from "../services/leaderboardService";
import { advertisementService } from "../services/advertisementService";
import { addTextButton } from "../ui/buttons";
import { addInfoText, addPanel, addSceneTitle, drawBackground, getResponsiveLayout } from "../ui/layout";
import { saveService } from "../services/saveService";
import { chanceMultFromLevel, type SaveData } from "../game/saveModel";
import { yandexSdk } from "../services/yandexSdk";
import { i18nService } from "../i18n/i18nService";
import { audioService } from "../services/audioService";

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
    const t = i18nService.getTranslations();

    // Инициализация аудио и запуск фоновой музыки
    audioService.init(this);
    audioService.playBackgroundMusic("bgMusic");

    // Уведомить advertisementService о смене сцены
    advertisementService.notifySceneChange("MenuScene");

    // Показ fullscreen рекламы при переходе между сценами.
    // Внутри обязательный обратный отсчёт «Реклама через 3… 2… 1…».
    await advertisementService.tryShowSceneChangeAd();

    addSceneTitle(this, t.menuTitle);

    if (layout.isPortrait) {
      this.createPortraitLayout(save, score, pendingCar, layout);
    } else {
      this.createLandscapeLayout(save, score, pendingCar, layout);
    }

    // Уведомить Yandex Games SDK о полной готовности игры
    // Вызываем ПОСЛЕ отрисовки UI и инициализации всех сервисов
    if (window.ysdk?.features?.LoadingAPI) {
      try {
        window.ysdk.features.LoadingAPI.ready();
        console.log('[Yandex SDK] LoadingAPI.ready() вызван - игра полностью готова');
      } catch (error) {
        console.error('[Yandex SDK] Ошибка LoadingAPI.ready():', error);
      }
    }

    // Уведомить Yandex Games API о начале геймплея
    if (window.ysdk?.features?.GameplayAPI) {
      try {
        window.ysdk.features.GameplayAPI.start();
        console.log('[Yandex SDK] GameplayAPI.start() вызван - геймплей начат');
      } catch (error) {
        console.error('[Yandex SDK] Ошибка GameplayAPI.start():', error);
      }
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
    const t = i18nService.getTranslations();

    // Info panel with stats
    addPanel(this, cx, infoPanelY, infoPanelWidth, layout.height * 0.14);
    addInfoText(this, layout.padding * 1.5, layout.height * 0.09, `${t.spinBalance}: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "26px");
    addInfoText(this, layout.padding * 1.5, layout.height * 0.12, `${t.garageTitle}: ${save.inventory.length} / ${save.garageCap}`, "#d9e6f2", "22px");
    addInfoText(this, layout.padding * 1.5, layout.height * 0.145, `${t.multiplier}: x${chanceMultFromLevel(save.chanceLevel).toFixed(1)}`, "#d9e6f2", "22px");
    addInfoText(this, layout.padding * 1.5, layout.height * 0.17, `${t.points}: ${score.toLocaleString("ru-RU")}`, "#d9e6f2", "22px");

    // Pending reward notification
    if (pendingCar) {
      const pendingY = layout.height * 0.255;
      addPanel(this, cx, pendingY, infoPanelWidth, layout.height * 0.09);
      addInfoText(this, layout.padding * 1.5, layout.height * 0.225, `${t.pending}: ${pendingCar.name}`, "#ffcf70", "22px", {
        width: layout.width * 0.5,
        maxLines: 2,
      });
      addTextButton(this, layout.width * 0.73, pendingY, t.open, () => this.scene.start("SpinScene"), {
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

    addTextButton(this, cx, btnY, pendingCar ? t.resolveReward : t.menuSpin, () => {
      audioService.playSound("button");
      this.scene.start("SpinScene");
    }, {
      width: btnWidth,
      height: btnHeight,
      fontSize: "24px",
    });
    btnY += btnSpacing;
    addTextButton(this, cx, btnY, t.menuGarage, () => {
      audioService.playSound("button");
      this.scene.start("GarageScene");
    }, {
      width: btnWidth,
      height: btnHeight,
      fontSize: "24px",
    });
    btnY += btnSpacing;
    addTextButton(this, cx, btnY, t.menuCases, () => {
      audioService.playSound("button");
      this.scene.start("CasesScene");
    }, {
      width: btnWidth,
      height: btnHeight,
      fontSize: "24px",
    });
    btnY += btnSpacing;
    addTextButton(this, cx, btnY, t.menuUpgrades, () => {
      audioService.playSound("button");
      this.scene.start("UpgradesScene");
    }, {
      width: btnWidth,
      height: btnHeight,
      fontSize: "24px",
    });
    btnY += btnSpacing;

    // Кнопка лидерборда (скрыта в гостевом режиме)
    if (!yandexSdk.isGuestMode()) {
      addTextButton(this, cx, btnY, t.menuLeaderboard, () => {
        audioService.playSound("button");
        this.scene.start("LeaderboardScene");
      }, {
        width: btnWidth,
        height: btnHeight,
        fontSize: "24px",
      });
      btnY += btnSpacing;
    }

    // Кнопка настроек
    addTextButton(this, cx, btnY, t.menuSettings, () => {
      audioService.playSound("button");
      this.scene.start("SettingsScene");
    }, {
      width: btnWidth,
      height: btnHeight,
      fontSize: "24px",
      fillColor: 0x3b2280,
    });
    btnY += btnSpacing;

    // Кнопка бонусных денег за рекламу
    const canShowBonusAd = advertisementService.canShowAd('bonus-money', 900000); // 15 минут
    if (canShowBonusAd) {
      btnY += btnSpacing;
      addTextButton(this, cx, btnY, t.getBonusMoney, async () => {
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
          const errorText = addInfoText(this, cx, layout.height * 0.92, t.adTemporarilyUnavailable, "#ff8b8b", "18px");
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
    const t = i18nService.getTranslations();

    addPanel(this, leftPanelX, layout.height * 0.278, leftPanelWidth, layout.height * 0.292);
    addInfoText(this, layout.padding * 1.83, infoY, `${t.spinBalance}: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "30px");
    addInfoText(this, layout.padding * 1.83, infoY + 42, `${t.garageTitle}: ${save.inventory.length} / ${save.garageCap}`);
    addInfoText(this, layout.padding * 1.83, infoY + 78, `${t.luckMultiplier}: x${chanceMultFromLevel(save.chanceLevel).toFixed(1)}`);
    addInfoText(this, layout.padding * 1.83, infoY + 114, `${t.collectionPoints}: ${score.toLocaleString("ru-RU")}`);

    if (pendingCar) {
      const pendingPanelY = layout.height * 0.53;
      addPanel(this, leftPanelX, pendingPanelY, leftPanelWidth, layout.height * 0.133);
      addInfoText(this, layout.padding * 1.83, layout.height * 0.486, `${t.pending}: ${pendingCar.name}`, "#ffcf70", "22px", {
        width: layout.width * 0.195,
        maxLines: 2,
      });
      addTextButton(this, leftPanelX + layout.width * 0.103, pendingPanelY, t.open, () => this.scene.start("SpinScene"), {
        width: 160,
        height: 46,
        fontSize: "20px",
      });
    }

    const rightPanelWidth = layout.width * 0.328;
    const rightPanelX = layout.width * 0.695;
    const buttonX = rightPanelX;

    addPanel(this, rightPanelX, layout.height * 0.5, rightPanelWidth, layout.height * 0.583);
    addTextButton(this, buttonX, layout.height * 0.264, pendingCar ? t.resolveReward : t.menuSpin, () => {
      audioService.playSound("button");
      this.scene.start("SpinScene");
    }, {
      width: 300,
    });
    addTextButton(this, buttonX, layout.height * 0.375, t.menuGarage, () => {
      audioService.playSound("button");
      this.scene.start("GarageScene");
    }, { width: 300 });
    addTextButton(this, buttonX, layout.height * 0.486, t.menuCases, () => {
      audioService.playSound("button");
      this.scene.start("CasesScene");
    }, { width: 300 });
    addTextButton(this, buttonX, layout.height * 0.597, t.menuUpgrades, () => {
      audioService.playSound("button");
      this.scene.start("UpgradesScene");
    }, { width: 300 });

    // Кнопка лидерборда (скрыта в гостевом режиме)
    if (!yandexSdk.isGuestMode()) {
      addTextButton(this, buttonX, layout.height * 0.708, t.menuLeaderboard, () => {
        audioService.playSound("button");
        this.scene.start("LeaderboardScene");
      }, { width: 300 });
    }

    // Кнопка настроек
    const settingsY = yandexSdk.isGuestMode() ? layout.height * 0.708 : layout.height * 0.819;
    addTextButton(this, buttonX, settingsY, t.menuSettings, () => {
      audioService.playSound("button");
      this.scene.start("SettingsScene");
    }, {
      width: 300,
      fillColor: 0x3b2280,
    });

    // Кнопка бонусных денег за рекламу (landscape)
    const canShowBonusAd = advertisementService.canShowAd('bonus-money', 900000); // 15 минут
    if (canShowBonusAd) {
      const bonusAdY = yandexSdk.isGuestMode() ? layout.height * 0.819 : layout.height * 0.93;
      addTextButton(this, buttonX, bonusAdY, t.getBonusMoney, async () => {
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
          const errorText = addInfoText(this, buttonX, layout.height * 0.92, t.adUnavailable, "#ff8b8b", "16px");
          this.time.delayedCall(2000, () => errorText.destroy());
        }
      }, { width: 300, height: 50, fillColor: 0x27ae60, fontSize: "20px" });
    }
  }
}
