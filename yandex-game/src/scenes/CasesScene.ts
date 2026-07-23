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
import { addBackToMenu, addInfoText, addPanel, addSceneTitle } from "../ui/layout";

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
    const save = saveService.current;
    const baseCases = getBaseCaseDefinitions();
    const exclusiveCases = getExclusiveCaseDefinitions(CARS);

    addSceneTitle(this, "Кейсы");
    addBackToMenu(this);
    addInfoText(this, 48, 100, `Баланс: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "26px");
    addInfoText(this, 48, 134, `Гараж: ${save.inventory.length} / ${save.garageCap}`, "#d9e6f2", "22px");

    addPanel(this, 360, 390, 600, 444);
    addPanel(this, 960, 390, 500, 444);

    this.renderBaseCases(baseCases);
    this.renderExclusiveCases(exclusiveCases.slice(0, 4));

    this.statusText = this.add.text(92, 642, "", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#ffcf70",
      wordWrap: { width: 760 },
    });
    this.statusText.setText(this.initialStatus);
  }

  private renderBaseCases(definitions: CaseDefinition[]): void {
    addInfoText(this, 92, 188, "Обычные кейсы", "#ffffff", "26px");
    definitions.forEach((definition, index) => {
      const y = 250 + index * 170;
      addInfoText(this, 92, y - 48, definition.title, "#ffffff", "24px");
      addInfoText(this, 92, y - 16, `Минимум: ${definition.minRarity}`, rarityColor(definition.minRarity), "20px");
      addInfoText(this, 92, y + 12, `Цена: ${definition.cost.toLocaleString("ru-RU")}`, "#ffd166", "20px");
      this.addCaseButtons(definition, 350, y);
    });
  }

  private renderExclusiveCases(definitions: CaseDefinition[]): void {
    addInfoText(this, 742, 188, "Эксклюзивные кейсы", "#ffffff", "26px");
    definitions.forEach((definition, index) => {
      const y = 246 + index * 90;
      const car = CARS.find((item) => item.id === definition.exclusiveCarId);
      addInfoText(this, 742, y - 24, definition.title, car ? rarityColor(car.rarity) : "#ffffff", "19px");
      addInfoText(this, 742, y + 2, `Цена: ${definition.cost.toLocaleString("ru-RU")}`, "#ffd166", "18px");
      addTextButton(this, 1088, y, "x1", () => void this.openSingle(definition), {
        width: 70,
        height: 42,
        fontSize: "18px",
      });
      addTextButton(this, 1168, y, "x10", () => void this.openBulk(definition, 10), {
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
