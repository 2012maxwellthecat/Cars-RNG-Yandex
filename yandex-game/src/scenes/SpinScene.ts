import Phaser from "phaser";
import { CARS } from "../data/cars";
import { keepPendingReward, processCarIntoGarage, sellPendingReward } from "../game/economy";
import { spin } from "../game/spinEngine";
import type { Car } from "../game/types";
import { saveService } from "../services/saveService";
import { addTextButton } from "../ui/buttons";
import { addCarCard } from "../ui/carCard";
import { addBackToMenu, addInfoText, addPanel, addSceneTitle, drawBackground, getResponsiveLayout } from "../ui/layout";

export class SpinScene extends Phaser.Scene {
  private autoSpinActive = false;

  constructor() {
    super("SpinScene");
  }

  init(): void {
    this.autoSpinActive = false;
  }

  create(): void {
    drawBackground(this);
    const layout = getResponsiveLayout(this);
    addSceneTitle(this, "Спин");
    addBackToMenu(this);

    const save = saveService.current;
    const infoPanelWidth = layout.width * 0.416;

    addPanel(this, layout.padding + infoPanelWidth / 2, layout.height * 0.214, infoPanelWidth, layout.height * 0.128);
    addInfoText(this, layout.padding * 1.71, layout.height * 0.181, `Баланс: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "24px");
    addInfoText(this, layout.padding * 1.71, layout.height * 0.228, `Гараж: ${save.inventory.length} / ${save.garageCap}`, "#d9e6f2", "22px");

    const pendingCar = CARS.find((car) => car.id === save.pendingReward?.carId);
    if (pendingCar) {
      this.showPending(pendingCar);
      return;
    }

    this.showSpinUI(layout);
  }

  private showSpinUI(layout: ReturnType<typeof getResponsiveLayout>): void {
    const cx = layout.width * 0.5;

    const hintText = addInfoText(this, layout.width * 0.336, layout.height * 0.36, "Нажмите кнопку, чтобы получить машину.", "#ffffff", "24px");

    const spinBtn = addTextButton(this, cx, layout.height * 0.478, "Крутить", () => {
      if (CARS.length === 0) return;
      this.playSpinAnimation(() => void this.finishSpin());
    });

    // --- Auto-spin stats UI (hidden until started) ---
    const panelW = layout.width * 0.35;
    const panelX = layout.width * 0.18;
    const panelY = layout.height * 0.57;
    const statsPanelGfx = addPanel(this, panelX, panelY, panelW, layout.height * 0.28);
    statsPanelGfx.setVisible(false);

    const spinsText = this.add.text(panelX, panelY - layout.height * 0.1, "0 спинов", {
      fontFamily: "'Arial Black', Arial", fontStyle: "bold",
      fontSize: "24px", color: "#ffd700",
      stroke: "#000000", strokeThickness: 4, align: "center",
    }).setOrigin(0.5).setVisible(false);

    const progressText = this.add.text(panelX, panelY, "", {
      fontFamily: "'Arial Black', Arial", fontStyle: "bold",
      fontSize: "17px", color: "#d9e6f2",
      stroke: "#000000", strokeThickness: 3,
      align: "center", lineSpacing: 6,
      wordWrap: { width: panelW - 32 },
    }).setOrigin(0.5).setVisible(false);

    const stopBtn = addTextButton(this, cx, layout.height * 0.86, "Стоп", () => {
      this.autoSpinActive = false;
    }, { width: 220, fillColor: 0x9e3c45 });
    stopBtn.setVisible(false);

    // --- Auto-spin start button ---
    addTextButton(this, cx, layout.height * 0.597, "Автокрутка", () => {
      hintText.setVisible(false);
      spinBtn.setVisible(false);
      statsPanelGfx.setVisible(true);
      spinsText.setVisible(true);
      progressText.setVisible(true);
      stopBtn.setVisible(true);
      this.runAutoSpin({ spinsText, progressText }, layout);
    }, { width: 220, fillColor: 0x5b2fa0 });
  }

  private runAutoSpin(
    ui: { spinsText: Phaser.GameObjects.Text; progressText: Phaser.GameObjects.Text },
    layout: ReturnType<typeof getResponsiveLayout>,
  ): void {
    this.autoSpinActive = true;
    let save = saveService.current;
    const moneyBefore = save.money;
    let done = 0;
    let added = 0;
    let replaced = 0;
    let soldNew = 0;

    const autoTick = () => {
      if (!this.autoSpinActive) {
        this.scene.restart();
        return;
      }

      this.playSpinAnimation(() => {
        const car = spin(CARS, save.chanceLevel);
        const result = processCarIntoGarage(save, car, CARS);
        save = { ...result.save, stats: { ...result.save.stats, spins: result.save.stats.spins + 1 } };

        if (result.action === "added") added++;
        else if (result.action === "replaced") replaced++;
        else soldNew++;
        done++;

        // Show car card for 1 second
        const card = addCarCard(this, layout.width * 0.5, layout.height * 0.486, car, {
          width: 360, height: 280, imageWidth: 280, imageHeight: 140,
        });
        const actionColor = result.action === "added" ? "#65d68b" : result.action === "replaced" ? "#ffd166" : "#ff8b8b";
        const actionLabel = result.action === "added" ? "В гараж" : result.action === "replaced" ? "Замена" : "Продано";
        const actionText = this.add.text(layout.width * 0.5, layout.height * 0.72, actionLabel, {
          fontFamily: "'Arial Black', Arial", fontStyle: "bold",
          fontSize: "28px", color: actionColor,
          stroke: "#000000", strokeThickness: 5, align: "center",
        }).setOrigin(0.5);

        void saveService.save(save).then(() => {
          if (ui.spinsText.active) ui.spinsText.setText(`${done} спинов`);
          if (ui.progressText.active) {
            const earned = save.money - moneyBefore;
            ui.progressText.setText(
              `Добавлено: ${added}  Заменено: ${replaced}  Продано: ${soldNew}\n` +
              `Баланс: ${save.money.toLocaleString("ru-RU")} $\n` +
              `${earned >= 0 ? "+" : ""}${earned.toLocaleString("ru-RU")} $`,
            );
          }
          this.time.delayedCall(1000, () => {
            card.destroy();
            actionText.destroy();
            autoTick();
          });
        });
      });
    };

    autoTick();
  }

  // onDone is called after animation ends; preview container is cleared before the call
  private playSpinAnimation(onDone: () => void): void {
    const layout = getResponsiveLayout(this);
    const preview = this.add.container(layout.width * 0.5, layout.height * 0.456);
    const previewCars = Phaser.Utils.Array.Shuffle(CARS.filter((car) => car.rarity !== "Эксклюзивный")).slice(0, 8);
    let step = 0;

    const tick = () => {
      preview.removeAll(true);
      if (step >= 14) {
        preview.destroy();
        onDone();
        return;
      }
      const car = previewCars[step % previewCars.length];
      const image = this.add.image(0, -18, car.imageKey);
      image.setDisplaySize(300, 160);
      const label = this.add.text(0, 94, car.name, {
        fontFamily: "Arial", fontSize: "24px",
        color: "#ffffff", align: "center", wordWrap: { width: 420 },
      }).setOrigin(0.5);
      preview.add([image, label]);
      step++;
      this.time.delayedCall(70 + step * 12, tick);
    };

    tick();
  }

  private async finishSpin(): Promise<void> {
    const save = saveService.current;
    const car = spin(CARS, save.chanceLevel);
    await saveService.save({
      ...save,
      pendingReward: { source: "spin" as const, carId: car.id, createdAt: Date.now() },
      stats: { ...save.stats, spins: save.stats.spins + 1 },
    });
    this.scene.restart();
  }

  private showPending(car: Car): void {
    const save = saveService.current;
    const layout = getResponsiveLayout(this);

    addCarCard(this, layout.width * 0.5, layout.height * 0.486, car);
    addInfoText(this, layout.width * 0.345, layout.height * 0.203, "Выберите, что сделать с машиной.", "#ffffff", "24px");

    const button1X = layout.width * 0.375;
    const button2X = layout.width * 0.625;
    const buttonY = layout.height * 0.825;

    addTextButton(this, button1X, buttonY, "Оставить", async () => {
      const result = keepPendingReward(save);
      if (result.status === "garage-full") {
        addInfoText(this, layout.width * 0.289, layout.height * 0.761, "Гараж заполнен. Продайте машину или освободите место.", "#ff8b8b", "20px", {
          width: layout.width * 0.422, maxLines: 2,
        });
        return;
      }
      if (result.status !== "ok") { this.scene.restart(); return; }
      await saveService.save(result.save);
      this.scene.start("GarageScene");
    });

    addTextButton(this, button2X, buttonY, `Продать за ${car.value.toLocaleString("ru-RU")}`, async () => {
      const result = sellPendingReward(save, CARS);
      if (result.status !== "ok") { this.scene.restart(); return; }
      await saveService.save(result.save);
      this.scene.start("MenuScene");
    });
  }
}
