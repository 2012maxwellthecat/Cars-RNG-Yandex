import Phaser from "phaser";
import { CARS } from "../data/cars";
import {
  getBaseCaseDefinitions,
  getExclusiveCaseDefinitions,
  openCase,
  openCases,
} from "../game/caseEngine";
import { BULK_CASE_COUNTS } from "../game/constants";
import { processCarsIntoGarage } from "../game/economy";
import type { CaseDefinition } from "../game/types";
import { saveService } from "../services/saveService";
import { advertisementService } from "../services/advertisementService";
import { addTextButton } from "../ui/buttons";
import { rarityColor } from "../ui/carCard";
import { addBackToMenu, addInfoText, addPanel, addSceneTitle, drawBackground, getResponsiveLayout } from "../ui/layout";

export class CasesScene extends Phaser.Scene {
  private statusText: Phaser.GameObjects.Text | null = null;
  private initialStatus = "";

  constructor() {
    super("CasesScene");
  }

  init(data: { status?: string } = {}): void {
    this.initialStatus = data.status ?? "";
  }

  create(): void {
    drawBackground(this);
    const save = saveService.current;
    const baseCases = getBaseCaseDefinitions();
    const exclusiveCases = getExclusiveCaseDefinitions(CARS);
    const layout = getResponsiveLayout(this);

    // Уведомить advertisementService о смене сцены
    advertisementService.notifySceneChange("CasesScene");

    addSceneTitle(this, "Кейсы");
    addBackToMenu(this);

    if (layout.isPortrait) {
      const infoY = layout.padding * 1.5;
      addInfoText(this, layout.padding, infoY, `Баланс: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "26px");
      addInfoText(this, layout.padding, infoY + 34, `Гараж: ${save.inventory.length} / ${save.garageCap}`, "#d9e6f2", "22px");
    } else {
      const infoY = layout.padding * 2.1;
      addInfoText(this, layout.padding, infoY, `Баланс: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "26px");
      addInfoText(this, layout.padding, infoY + 34, `Гараж: ${save.inventory.length} / ${save.garageCap}`, "#d9e6f2", "22px");
    }

    if (layout.isPortrait) {
      // Портретный режим: вертикальный список всех кейсов
      const panelWidth = layout.width * 0.88;
      const panelHeight = layout.height * 0.68;
      const panelY = layout.height * 0.52;

      addPanel(this, layout.width * 0.5, panelY, panelWidth, panelHeight);

      let currentY = layout.height * 0.21;
      addInfoText(this, layout.padding * 1.5, currentY, "Обычные кейсы", "#ffffff", "26px");
      currentY += 44;

      baseCases.forEach((definition) => {
        addInfoText(this, layout.padding * 1.5, currentY, definition.title, "#ffffff", "22px");
        currentY += 30;
        addInfoText(this, layout.padding * 1.5, currentY, `Мин: ${definition.minRarity}`, rarityColor(definition.minRarity), "19px");
        currentY += 28;
        this.addCaseButtonsMobile(definition, layout.width * 0.15, currentY);
        currentY += 64;
      });

      currentY += 20;
      addInfoText(this, layout.padding * 1.5, currentY, "Эксклюзивные", "#ffffff", "26px");
      currentY += 44;

      exclusiveCases.slice(0, 4).forEach((definition) => {
        addInfoText(this, layout.padding * 1.5, currentY, definition.title, "#ffffff", "22px");
        currentY += 30;
        this.addCaseButtonsMobile(definition, layout.width * 0.15, currentY);
        currentY += 64;
      });

      // Кнопка бесплатного необычного кейса за рекламу (portrait)
      const canShowFreeCase = advertisementService.canShowAd('free-case', 1200000); // 20 минут
      if (canShowFreeCase && baseCases.length > 0) {
        currentY += 20;
        addInfoText(this, layout.padding * 1.5, currentY, "🎁 Бесплатный необычный кейс", "#27ae60", "24px");
        currentY += 44;
        addTextButton(this, layout.width * 0.5, currentY, "Открыть за рекламу", async () => {
          const success = await advertisementService.showRewardedAd(async () => {
            // Открыть необычный кейс бесплатно
            const uncommonCase = baseCases[0]; // "case:uncommon"
            await this.openSingle(uncommonCase, true);
          }, 'free-case', 1200000);

          if (!success) {
            this.statusText?.setText("Реклама временно недоступна");
          }
        }, { width: layout.width * 0.8, height: 60, fillColor: 0x27ae60, fontSize: "20px" });
        currentY += 70;
      }

      this.statusText = this.add.text(layout.padding * 1.5, layout.height * 0.92, "", {
        fontFamily: "Arial",
        fontSize: "19px",
        color: "#ffcf70",
        wordWrap: { width: layout.width - layout.padding * 3 },
        maxLines: 2,
      });
    } else {
      // Ландшафтный режим: оригинальная двухколоночная компоновка
      const panelWidth1 = layout.width * 0.468;
      const panelWidth2 = layout.width * 0.39;
      const panelHeight = layout.height * 0.616;
      const panelY = layout.height * 0.54;

      addPanel(this, layout.padding + panelWidth1 / 2, panelY, panelWidth1, panelHeight);
      addPanel(this, layout.width - layout.padding - panelWidth2 / 2, panelY, panelWidth2, panelHeight);

      this.renderBaseCases(baseCases);
      this.renderExclusiveCases(exclusiveCases.slice(0, 4));

      this.statusText = this.add.text(layout.padding * 1.92, layout.height * 0.85, "", {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#ffcf70",
        wordWrap: { width: layout.width - layout.padding * 4 },
        maxLines: 3,
      });
    }

    this.statusText.setText(this.initialStatus);
  }

  private renderBaseCases(definitions: CaseDefinition[]): void {
    const layout = getResponsiveLayout(this);
    const startX = layout.padding * 1.92;
    const titleY = layout.height * 0.26;

    addInfoText(this, startX, titleY, "Обычные кейсы", "#ffffff", "26px");
    definitions.forEach((definition, index) => {
      const blockTop = titleY + 86 + index * 150;
      const textWidth = layout.width * 0.18;

      // Stack top-down with 32px line height for Arial Black Bold 20px
      addInfoText(this, startX, blockTop,      definition.title,                                         "#ffffff", "20px", { width: textWidth });
      addInfoText(this, startX, blockTop + 86, `Минимум: ${definition.minRarity}`,                       rarityColor(definition.minRarity), "18px", { width: textWidth });
      addInfoText(this, startX, blockTop + 118, `Цена: ${definition.cost.toLocaleString("ru-RU")}`,       "#ffd166", "18px", { width: textWidth });
      this.addCaseButtons(definition, startX + textWidth + 32, blockTop + 52);
    });

    // Кнопка бесплатного необычного кейса за рекламу (landscape)
    const canShowFreeCase = advertisementService.canShowAd('free-case', 1200000); // 20 минут
    if (canShowFreeCase && definitions.length > 0) {
      const freeCaseY = titleY + 86 + definitions.length * 150 + 30;
      addInfoText(this, startX, freeCaseY, "🎁 Бесплатный необычный кейс", "#27ae60", "18px");
      addTextButton(this, startX + layout.width * 0.15, freeCaseY + 40, "Открыть за рекламу", async () => {
        const success = await advertisementService.showRewardedAd(async () => {
          const uncommonCase = definitions[0]; // "case:uncommon"
          await this.openSingle(uncommonCase, true);
        }, 'free-case', 1200000);

        if (!success) {
          this.statusText?.setText("Реклама временно недоступна");
        }
      }, { width: 280, height: 48, fillColor: 0x27ae60, fontSize: "18px" });
    }
  }

  private renderExclusiveCases(definitions: CaseDefinition[]): void {
    const layout = getResponsiveLayout(this);
    const startX = layout.width * 0.58;
    const titleY = layout.height * 0.26;
    const textWidth = layout.width * 0.234;

    addInfoText(this, startX, titleY, "Эксклюзивные кейсы", "#ffffff", "26px");
    definitions.forEach((definition, index) => {
      const y = titleY + 68 + index * 90;
      const car = CARS.find((item) => item.id === definition.exclusiveCarId);
      addInfoText(this, startX, y - 28, definition.title, car ? rarityColor(car.rarity) : "#ffffff", "18px", {
        width: textWidth,
        maxLines: 2,
      });
      addInfoText(this, startX, y + 12, `Цена: ${definition.cost.toLocaleString("ru-RU")}`, "#ffd166", "17px", {
        width: textWidth,
      });
      const buttonX1 = layout.width * 0.85;
      const buttonX2 = layout.width * 0.9125;

      addTextButton(this, buttonX1, y, "x1", () => void this.openSingle(definition), {
        width: 70,
        height: 42,
        fontSize: "18px",
      });
      addTextButton(this, buttonX2, y, "x10", () => void this.openBulk(definition, 10), {
        width: 74,
        height: 42,
        fontSize: "18px",
      });
    });
  }

  private addCaseButtons(definition: CaseDefinition, x: number, y: number): void {
    addTextButton(this, x, y, "x1", () => void this.openSingle(definition), {
      width: 86,
      height: 46,
      fontSize: "20px",
    });
    addTextButton(this, x + 104, y, "x10", () => void this.openBulk(definition, 10), {
      width: 86,
      height: 46,
      fontSize: "20px",
    });
    addTextButton(this, x + 208, y, "x100", () => void this.openBulk(definition, 100), {
      width: 96,
      height: 46,
      fontSize: "20px",
    });
  }

  private addCaseButtonsMobile(definition: CaseDefinition, x: number, y: number): void {
    addTextButton(this, x, y, "x1", () => void this.openSingle(definition), {
      width: 100,
      height: 52,
      fontSize: "22px",
    });
    addTextButton(this, x + 118, y, "x10", () => void this.openBulk(definition, 10), {
      width: 100,
      height: 52,
      fontSize: "22px",
    });
    addTextButton(this, x + 236, y, "x100", () => void this.openBulk(definition, 100), {
      width: 110,
      height: 52,
      fontSize: "22px",
    });
  }

  private async openSingle(definition: CaseDefinition, isFree: boolean = false): Promise<void> {
    const save = saveService.current;
    if (save.pendingReward) {
      this.setStatus("Сначала решите судьбу предыдущей машины.");
      return;
    }

    if (!isFree && save.money < definition.cost) {
      this.setStatus("Недостаточно денег.");
      return;
    }

    const car = openCase(CARS, definition);
    await saveService.save({
      ...save,
      money: isFree ? save.money : save.money - definition.cost,
      pendingReward: {
        source: "case",
        carId: car.id,
        createdAt: Date.now(),
      },
      stats: {
        ...save.stats,
        casesOpened: save.stats.casesOpened + 1,
        rewardedAdsWatched: isFree ? save.stats.rewardedAdsWatched + 1 : save.stats.rewardedAdsWatched,
      },
    });
    this.scene.start("SpinScene");
  }

  private async openBulk(definition: CaseDefinition, count: (typeof BULK_CASE_COUNTS)[number]): Promise<void> {
    const save = saveService.current;
    const totalCost = definition.cost * count;
    if (save.pendingReward) {
      this.setStatus("Сначала решите судьбу предыдущей машины.");
      return;
    }

    if (save.money < totalCost) {
      this.setStatus("Недостаточно денег.");
      return;
    }

    // Показ fullscreen рекламы перед bulk открытием (100 кейсов)
    // Удалено - теперь используется единая система рекламы при смене сцен

    const rewardCars = openCases(CARS, definition, count);
    const afterPurchase = {
      ...save,
      money: save.money - totalCost,
      stats: {
        ...save.stats,
        casesOpened: save.stats.casesOpened + count,
      },
    };
    const result = processCarsIntoGarage(afterPurchase, rewardCars, CARS);
    await saveService.save(result.save);

    const best = result.bestCars
      .slice(0, 3)
      .map((car) => car.name)
      .join(", ");
    this.scene.restart({
      status: `Открыто ${count}. Добавлено: ${result.added}, заменено: ${result.replaced}, продано новых: ${result.soldNew}. Лучшие: ${best}.`,
    });
  }

  private setStatus(message: string): void {
    this.statusText?.setText(message);
  }
}
