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

    addSceneTitle(this, "Кейсы");
    addBackToMenu(this);

    const infoY = layout.padding * 2.1;
    addInfoText(this, layout.padding, infoY, `Баланс: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "26px");
    addInfoText(this, layout.padding, infoY + 34, `Гараж: ${save.inventory.length} / ${save.garageCap}`, "#d9e6f2", "22px");

    const panelWidth1 = layout.width * 0.468; // ~600px at 1280
    const panelWidth2 = layout.width * 0.39; // ~500px at 1280
    const panelHeight = layout.height * 0.616; // ~444px at 720
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
    this.statusText.setText(this.initialStatus);
  }

  private renderBaseCases(definitions: CaseDefinition[]): void {
    const layout = getResponsiveLayout(this);
    const startX = layout.padding * 1.92;
    const titleY = layout.height * 0.26;

    addInfoText(this, startX, titleY, "Обычные кейсы", "#ffffff", "26px");
    definitions.forEach((definition, index) => {
      const blockTop = titleY + 86 + index * 200;
      const textWidth = layout.width * 0.18;

      // Stack top-down with 32px line height for Arial Black Bold 20px
      addInfoText(this, startX, blockTop,      definition.title,                                         "#ffffff", "20px", { width: textWidth });
      addInfoText(this, startX, blockTop + 66, `Минимум: ${definition.minRarity}`,                       rarityColor(definition.minRarity), "18px", { width: textWidth });
      addInfoText(this, startX, blockTop + 98, `Цена: ${definition.cost.toLocaleString("ru-RU")}`,       "#ffd166", "18px", { width: textWidth });
      this.addCaseButtons(definition, startX + textWidth + 32, blockTop + 52);
    });
  }

  private renderExclusiveCases(definitions: CaseDefinition[]): void {
    const layout = getResponsiveLayout(this);
    const startX = layout.width * 0.58;
    const titleY = layout.height * 0.26;
    const textWidth = layout.width * 0.234;

    addInfoText(this, startX, titleY, "Эксклюзивные кейсы", "#ffffff", "26px");
    definitions.forEach((definition, index) => {
      const y = titleY + 58 + index * 90;
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

  private async openSingle(definition: CaseDefinition): Promise<void> {
    const save = saveService.current;
    if (save.pendingReward) {
      this.setStatus("Сначала решите судьбу предыдущей машины.");
      return;
    }

    if (save.money < definition.cost) {
      this.setStatus("Недостаточно денег.");
      return;
    }

    const car = openCase(CARS, definition);
    await saveService.save({
      ...save,
      money: save.money - definition.cost,
      pendingReward: {
        source: "case",
        carId: car.id,
        createdAt: Date.now(),
      },
      stats: {
        ...save.stats,
        casesOpened: save.stats.casesOpened + 1,
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
