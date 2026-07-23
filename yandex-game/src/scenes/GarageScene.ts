import Phaser from "phaser";
import { CARS } from "../data/cars";
import { getInventoryViews, sellInventoryCar, sortInventoryViews, type InventoryCarView } from "../game/economy";
import { saveService } from "../services/saveService";
import { addTextButton } from "../ui/buttons";
import { addCarCard } from "../ui/carCard";
import { addBackToMenu, addInfoText, addPanel, addSceneTitle } from "../ui/layout";

const PAGE_SIZE = 8;

export class GarageScene extends Phaser.Scene {
  private page = 0;
  private selectedInventoryId: string | null = null;

  constructor() {
    super("GarageScene");
  }

  init(data: { page?: number; selectedInventoryId?: string } = {}): void {
    this.page = data.page ?? 0;
    this.selectedInventoryId = data.selectedInventoryId ?? null;
  }

  create(): void {
    const save = saveService.current;
    const items = sortInventoryViews(getInventoryViews(save, CARS));
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    this.page = Phaser.Math.Clamp(this.page, 0, totalPages - 1);
    const selected = items.find((item) => item.inventoryId === this.selectedInventoryId) ?? items[0] ?? null;

    addSceneTitle(this, "Гараж");
    addBackToMenu(this);
    addInfoText(this, 48, 100, `Машин: ${save.inventory.length} / ${save.garageCap}`, "#d9e6f2", "26px");
    addInfoText(this, 48, 134, `Баланс: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "24px");

    if (items.length === 0) {
      addPanel(this, 640, 360, 760, 260);
      addInfoText(this, 350, 312, "Гараж пуст. Выиграйте первую машину в спине.", "#ffffff", "28px");
      addTextButton(this, 640, 410, "Крутить", () => this.scene.start("SpinScene"));
      return;
    }

    addPanel(this, 374, 390, 652, 444);
    addPanel(this, 988, 390, 420, 444);
    this.renderGrid(items);
    this.renderDetails(selected);

    if (totalPages > 1) {
      addTextButton(
        this,
        260,
        642,
        "Назад",
        () => this.scene.restart({ page: this.page - 1, selectedInventoryId: this.selectedInventoryId }),
        { width: 150, height: 46, disabled: this.page === 0, fontSize: "20px" },
      );
      addInfoText(this, 348, 628, `${this.page + 1} / ${totalPages}`, "#ffffff", "22px");
      addTextButton(
        this,
        488,
        642,
        "Вперёд",
        () => this.scene.restart({ page: this.page + 1, selectedInventoryId: this.selectedInventoryId }),
        { width: 150, height: 46, disabled: this.page + 1 >= totalPages, fontSize: "20px" },
      );
    }
  }

  private renderGrid(items: InventoryCarView[]): void {
    const pageItems = items.slice(this.page * PAGE_SIZE, this.page * PAGE_SIZE + PAGE_SIZE);

    pageItems.forEach((item, index) => {
      const row = Math.floor(index / 4);
      const col = index % 4;
      const x = 120 + col * 166;
      const y = 230 + row * 178;
      const selected = item.inventoryId === (this.selectedInventoryId ?? pageItems[0]?.inventoryId);

      const background = this.add.rectangle(x, y, 144, 144, selected ? 0x30445c : 0x253044, 1);
      background.setStrokeStyle(2, selected ? 0x82b7ff : 0x3e4f64);
      const image = this.add.image(x, y - 24, item.car.imageKey);
      image.setDisplaySize(126, 72);
      const label = this.add
        .text(x, y + 50, item.car.name, {
          fontFamily: "Arial",
          fontSize: "15px",
          color: "#ffffff",
          align: "center",
          wordWrap: { width: 126 },
        })
        .setOrigin(0.5);

      const hitArea = this.add.zone(x, y, 144, 144).setOrigin(0.5).setInteractive({ useHandCursor: true });
      hitArea.on("pointerover", () => background.setFillStyle(0x30445c));
      hitArea.on("pointerout", () => background.setFillStyle(selected ? 0x30445c : 0x253044));
      hitArea.on("pointerdown", () => this.scene.restart({ page: this.page, selectedInventoryId: item.inventoryId }));
      this.add.container(0, 0, [background, image, label, hitArea]);
    });
  }

  private renderDetails(selected: InventoryCarView | null): void {
    if (!selected) {
      return;
    }

    addCarCard(this, 988, 338, selected.car, {
      width: 360,
      height: 300,
      imageWidth: 292,
      imageHeight: 154,
    });

    addInfoText(this, 838, 514, `Получена: ${new Date(selected.obtainedAt).toLocaleDateString("ru-RU")}`, "#d9e6f2", "20px");
    addInfoText(this, 838, 544, `Очки: ${selected.car.points.toLocaleString("ru-RU")}`, "#d9e6f2", "20px");
    addTextButton(
      this,
      988,
      616,
      `Продать за ${selected.car.value.toLocaleString("ru-RU")}`,
      async () => {
        const result = sellInventoryCar(saveService.current, selected.inventoryId, CARS);
        if (result.status === "ok") {
          await saveService.save(result.save);
        }
        this.scene.restart({ page: this.page });
      },
      { width: 300, height: 52, fillColor: 0x9e3c45, strokeColor: 0xff8b8b, fontSize: "21px" },
    );
  }
}
