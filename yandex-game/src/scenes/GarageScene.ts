import Phaser from "phaser";
import { CARS } from "../data/cars";
import { getInventoryViews, sellInventoryCar, sortInventoryViews, type InventoryCarView } from "../game/economy";
import { saveService } from "../services/saveService";
import { addTextButton } from "../ui/buttons";
import { addCarCard } from "../ui/carCard";
import { addBackToMenu, addInfoText, addPanel, addSceneTitle, drawBackground, getResponsiveLayout } from "../ui/layout";

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
    drawBackground(this);
    const save = saveService.current;
    const items = sortInventoryViews(getInventoryViews(save, CARS));
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    this.page = Phaser.Math.Clamp(this.page, 0, totalPages - 1);
    const selected = items.find((item) => item.inventoryId === this.selectedInventoryId) ?? items[0] ?? null;
    const layout = getResponsiveLayout(this);

    addSceneTitle(this, "Гараж");
    addBackToMenu(this);
    addInfoText(this, layout.padding, layout.height * 0.139, `Машин: ${save.inventory.length} / ${save.garageCap}`, "#d9e6f2", "26px");
    addInfoText(this, layout.padding, layout.height * 0.186, `Баланс: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "24px");

    if (items.length === 0) {
      const emptyPanelWidth = layout.width * 0.594;
      const emptyPanelHeight = layout.height * 0.361;
      addPanel(this, layout.width * 0.5, layout.height * 0.5, emptyPanelWidth, emptyPanelHeight);
      addInfoText(this, layout.width * 0.273, layout.height * 0.433, "Гараж пуст. Выиграйте первую машину в спине.", "#ffffff", "28px");
      addTextButton(this, layout.width * 0.5, layout.height * 0.569, "Крутить", () => this.scene.start("SpinScene"));
      return;
    }

    const leftPanelWidth = layout.width * 0.509;
    const rightPanelWidth = layout.width * 0.328;
    const panelHeight = layout.height * 0.617;
    const panelY = layout.height * 0.542;

    addPanel(this, layout.padding + leftPanelWidth / 2, panelY, leftPanelWidth, panelHeight);
    addPanel(this, layout.width - layout.padding - rightPanelWidth / 2, panelY, rightPanelWidth, panelHeight);
    this.renderGrid(items);
    this.renderDetails(selected);

    if (totalPages > 1) {
      const navY = layout.height * 0.881;
      const navLeftX = layout.width * 0.203;
      const navRightX = layout.width * 0.381;
      const navCenterX = layout.width * 0.272;

      addTextButton(
        this,
        navLeftX,
        navY,
        "Назад",
        () => this.scene.restart({ page: this.page - 1, selectedInventoryId: this.selectedInventoryId }),
        { width: 150, height: 46, disabled: this.page === 0, fontSize: "20px" },
      );
      addInfoText(this, navCenterX, navY - 14, `${this.page + 1} / ${totalPages}`, "#ffffff", "22px", {
        width: 96,
        align: "center",
      });
      addTextButton(
        this,
        navRightX,
        navY,
        "Вперёд",
        () => this.scene.restart({ page: this.page + 1, selectedInventoryId: this.selectedInventoryId }),
        { width: 150, height: 46, disabled: this.page + 1 >= totalPages, fontSize: "20px" },
      );
    }
  }

  private renderGrid(items: InventoryCarView[]): void {
    const layout = getResponsiveLayout(this);
    const pageItems = items.slice(this.page * PAGE_SIZE, this.page * PAGE_SIZE + PAGE_SIZE);
    const cardSize = layout.width * 0.1125; // ~144px at 1280
    const cardSpacingX = layout.width * 0.1297; // ~166px
    const cardSpacingY = layout.height * 0.247; // ~178px
    const startX = layout.width * 0.094;
    const startY = layout.height * 0.319;

    pageItems.forEach((item, index) => {
      const row = Math.floor(index / 4);
      const col = index % 4;
      const x = startX + col * cardSpacingX;
      const y = startY + row * cardSpacingY;
      const selected = item.inventoryId === (this.selectedInventoryId ?? pageItems[0]?.inventoryId);

      const cardGfx = this.add.graphics();
      const radius = 10;
      const hs = cardSize / 2;
      if (selected) {
        cardGfx.fillGradientStyle(0x4a2db0, 0x4a2db0, 0x1e1050, 0x1e1050, 1);
      } else {
        cardGfx.fillGradientStyle(0x2a1f60, 0x2a1f60, 0x110e38, 0x110e38, 1);
      }
      cardGfx.fillRoundedRect(x - hs, y - hs, cardSize, cardSize, radius);
      cardGfx.lineStyle(2, selected ? 0xb07aff : 0x5030a0, 1);
      cardGfx.strokeRoundedRect(x - hs, y - hs, cardSize, cardSize, radius);

      const image = this.add.image(x, y - 24, item.car.imageKey);
      image.setDisplaySize(126, 72);
      const label = this.add
        .text(x, y + 50, item.car.name, {
          fontFamily: "'Arial Black', Arial",
          fontStyle: "bold",
          fontSize: "14px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 3,
          align: "center",
          wordWrap: { width: 126 },
        })
        .setOrigin(0.5);

      const hitArea = this.add.zone(x, y, cardSize, cardSize).setOrigin(0.5).setInteractive({ useHandCursor: true });
      hitArea.on("pointerover", () => {
        cardGfx.clear();
        cardGfx.fillGradientStyle(0x5a3dc0, 0x5a3dc0, 0x2a1a60, 0x2a1a60, 1);
        cardGfx.fillRoundedRect(x - hs, y - hs, cardSize, cardSize, radius);
        cardGfx.lineStyle(2, 0xd0a0ff, 1);
        cardGfx.strokeRoundedRect(x - hs, y - hs, cardSize, cardSize, radius);
      });
      hitArea.on("pointerout", () => {
        cardGfx.clear();
        if (selected) {
          cardGfx.fillGradientStyle(0x4a2db0, 0x4a2db0, 0x1e1050, 0x1e1050, 1);
        } else {
          cardGfx.fillGradientStyle(0x2a1f60, 0x2a1f60, 0x110e38, 0x110e38, 1);
        }
        cardGfx.fillRoundedRect(x - hs, y - hs, cardSize, cardSize, radius);
        cardGfx.lineStyle(2, selected ? 0xb07aff : 0x5030a0, 1);
        cardGfx.strokeRoundedRect(x - hs, y - hs, cardSize, cardSize, radius);
      });
      hitArea.on("pointerdown", () => this.scene.restart({ page: this.page, selectedInventoryId: item.inventoryId }));
      this.add.container(0, 0, [cardGfx, image, label, hitArea]);
    });
  }

  private renderDetails(selected: InventoryCarView | null): void {
    if (!selected) {
      return;
    }

    const layout = getResponsiveLayout(this);
    const detailsX = layout.width * 0.772;
    const cardY = layout.height * 0.469;
    const infoStartX = layout.width * 0.655;
    const infoY1 = layout.height * 0.714;
    const infoY2 = layout.height * 0.756;
    const buttonY = layout.height * 0.856;

    addCarCard(this, detailsX, cardY, selected.car, {
      width: 360,
      height: 300,
      imageWidth: 292,
      imageHeight: 154,
    });

    addInfoText(this, infoStartX, infoY1, `Получена: ${new Date(selected.obtainedAt).toLocaleDateString("ru-RU")}`, "#d9e6f2", "20px");
    addInfoText(this, infoStartX, infoY2, `Очки: ${selected.car.points.toLocaleString("ru-RU")}`, "#d9e6f2", "20px");
    addTextButton(
      this,
      detailsX,
      buttonY,
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
