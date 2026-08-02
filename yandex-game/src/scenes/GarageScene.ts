import Phaser from "phaser";
import { CARS } from "../data/cars";
import { getInventoryViews, sellInventoryCar, sortInventoryViews, type InventoryCarView } from "../game/economy";
import { saveService } from "../services/saveService";
import { advertisementService } from "../services/advertisementService";
import { reportGameplayStopped } from "../services/gameplayLifecycleService";
import { addTextButton } from "../ui/buttons";
import { addCarCard } from "../ui/carCard";
import { addBackToMenu, addInfoText, addPanel, addSceneTitle, drawBackground, getResponsiveLayout } from "../ui/layout";
import { i18nService } from "../i18n/i18nService";

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

  async create(): Promise<void> {
    drawBackground(this);
    const save = saveService.current;
    const items = sortInventoryViews(getInventoryViews(save, CARS));
    const layout = getResponsiveLayout(this);
    const t = i18nService.getTranslations();

    // Уведомить advertisementService о смене сцены
    advertisementService.notifySceneChange("GarageScene");
    reportGameplayStopped();

    // Показ fullscreen рекламы при переходе между сценами.
    // Внутри обязательный обратный отсчёт «Реклама через 3… 2… 1…».
    await advertisementService.tryShowSceneChangeAd();

    // В портретном режиме показываем меньше машин на странице
    const pageSize = layout.isPortrait ? 5 : PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    this.page = Phaser.Math.Clamp(this.page, 0, totalPages - 1);
    const selected = items.find((item) => item.inventoryId === this.selectedInventoryId) ?? items[0] ?? null;

    addSceneTitle(this, t.garageTitle);
    addBackToMenu(this);

    if (layout.isPortrait) {
      addInfoText(this, layout.padding, layout.height * 0.11, `${t.garageCars}: ${save.inventory.length} / ${save.garageCap}`, "#d9e6f2", "24px");
      addInfoText(this, layout.padding, layout.height * 0.145, `${t.spinBalance}: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "26px");
    } else {
      addInfoText(this, layout.padding, layout.height * 0.139, `${t.garageCars}: ${save.inventory.length} / ${save.garageCap}`, "#d9e6f2", "26px");
      addInfoText(this, layout.padding, layout.height * 0.186, `${t.spinBalance}: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "24px");
    }

    if (items.length === 0) {
      const emptyPanelWidth = layout.isPortrait ? layout.width * 0.88 : layout.width * 0.594;
      const emptyPanelHeight = layout.isPortrait ? layout.height * 0.28 : layout.height * 0.361;
      addPanel(this, layout.width * 0.5, layout.height * 0.5, emptyPanelWidth, emptyPanelHeight);
      addInfoText(this, layout.isPortrait ? layout.padding * 1.5 : layout.width * 0.273, layout.height * 0.42, t.garageEmpty, "#ffffff", layout.isPortrait ? "26px" : "28px", { width: emptyPanelWidth * 0.85 });
      addTextButton(this, layout.width * 0.5, layout.height * 0.56, t.spinButton, () => this.scene.start("SpinScene"), {
        width: layout.isPortrait ? layout.width * 0.7 : 280,
        height: layout.isPortrait ? 64 : 56,
        fontSize: layout.isPortrait ? "24px" : "22px",
      });
      return;
    }

    if (layout.isPortrait) {
      // Портретный режим: одна колонка с детальным списком
      const panelWidth = layout.width * 0.88;
      const panelHeight = layout.height * 0.62;
      const panelY = layout.height * 0.51;
      addPanel(this, layout.width * 0.5, panelY, panelWidth, panelHeight);

      const pageItems = items.slice(this.page * pageSize, this.page * pageSize + pageSize);
      const startY = layout.height * 0.24;
      const itemHeight = layout.height * 0.1;

      pageItems.forEach((item, index) => {
        const y = startY + index * itemHeight;
        const isSelected = item.inventoryId === (this.selectedInventoryId ?? pageItems[0]?.inventoryId);

        addTextButton(this, layout.width * 0.5, y, `${item.car.name} (${item.car.value.toLocaleString("ru-RU")})`,
          () => this.scene.restart({ page: this.page, selectedInventoryId: item.inventoryId }),
          { width: layout.width * 0.78, height: 58, fontSize: "21px", fillColor: isSelected ? 0x4a2db0 : 0x2a1f60 }
        );
      });

      if (selected) {
        const detailY = layout.height * 0.8;
        addTextButton(this, layout.width * 0.5, detailY, `${t.spinSell} ${selected.car.value.toLocaleString("ru-RU")}`, async () => {
          const result = sellInventoryCar(save, selected.inventoryId, CARS);
          if (result.status !== "ok") return;
          await saveService.save(result.save);
          this.scene.restart({ page: this.page });
        }, { width: layout.width * 0.78, height: 64, fillColor: 0x9e3c45, fontSize: "24px" });
      }
    } else {
      // Ландшафтный режим: оригинальная сетка
      const leftPanelWidth = layout.width * 0.509;
      const rightPanelWidth = layout.width * 0.328;
      const panelHeight = layout.height * 0.617;
      const panelY = layout.height * 0.542;

      addPanel(this, layout.padding + leftPanelWidth / 2, panelY, leftPanelWidth, panelHeight);
      addPanel(this, layout.width - layout.padding - rightPanelWidth / 2, panelY, rightPanelWidth, panelHeight);
      this.renderGrid(items);
      this.renderDetails(selected);
    }

    if (totalPages > 1) {
      const navY = layout.isPortrait ? layout.height * 0.92 : layout.height * 0.881;
      const btnW = layout.isPortrait ? layout.width * 0.32 : 150;
      const textW = layout.isPortrait ? layout.width * 0.28 : 130;
      const gap = 18;
      const navCenterX = layout.width * 0.5;
      const navLeftX = navCenterX - textW / 2 - gap - btnW / 2;
      const navRightX = navCenterX + textW / 2 + gap + btnW / 2;
      const textLeft = navCenterX - textW / 2;

      addTextButton(
        this,
        navLeftX,
        navY,
        t.previousPage,
        () => this.scene.restart({ page: this.page - 1, selectedInventoryId: this.selectedInventoryId }),
        { width: btnW, height: layout.isPortrait ? 52 : 46, disabled: this.page === 0, fontSize: "20px" },
      );
      addInfoText(this, textLeft, navY - 14, `${this.page + 1} / ${totalPages}`, "#ffffff", "24px", {
        fixedWidth: textW,
        align: "center",
      });
      addTextButton(
        this,
        navRightX,
        navY,
        t.nextPage,
        () => this.scene.restart({ page: this.page + 1, selectedInventoryId: this.selectedInventoryId }),
        { width: btnW, height: layout.isPortrait ? 52 : 46, disabled: this.page + 1 >= totalPages, fontSize: "20px" },
      );
    }
  }

  private renderGrid(items: InventoryCarView[]): void {
    const layout = getResponsiveLayout(this);
    const pageItems = items.slice(this.page * PAGE_SIZE, this.page * PAGE_SIZE + PAGE_SIZE);
    const cardSize = layout.width * 0.1125; // ~144px at 1280
    const cardSpacingX = layout.width * 0.1297; // ~166px
    const cardSpacingY = layout.height * 0.247; // ~178px
    const startX = layout.width * 0.097;
    const startY = layout.height * 0.399;

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

      const imgW = Math.round(cardSize * 0.875);
      const imgH = Math.round(cardSize * 0.5);
      const image = this.add.image(x, y - Math.round(cardSize * 0.167), item.car.imageKey);
      image.setDisplaySize(imgW, imgH);
      const label = this.add
        .text(x, y + Math.round(cardSize * 0.347), item.car.name, {
          fontFamily: "'Arial Black', Arial",
          fontStyle: "bold",
          fontSize: "14px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 3,
          align: "center",
          wordWrap: { width: imgW },
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
    const t = i18nService.getTranslations();
    const detailsX = layout.width * 0.798;
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

    const obtainedLabel = t.obtained;
    const pointsLabel = t.points;
    addInfoText(this, infoStartX, infoY1, `${obtainedLabel}: ${new Date(selected.obtainedAt).toLocaleDateString("ru-RU")}`, "#d9e6f2", "20px");
    addInfoText(this, infoStartX, infoY2, `${pointsLabel}: ${selected.car.points.toLocaleString("ru-RU")}`, "#d9e6f2", "20px");
    addTextButton(
      this,
      detailsX,
      buttonY,
      `${t.spinSell} ${selected.car.value.toLocaleString("ru-RU")}`,
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
