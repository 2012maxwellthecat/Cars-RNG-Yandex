import Phaser from "phaser";
import { CARS } from "../data/cars";
import { keepPendingReward, sellPendingReward } from "../game/economy";
import { spin } from "../game/spinEngine";
import { saveService } from "../services/saveService";
import { addTextButton } from "../ui/buttons";
import { addCarCard } from "../ui/carCard";
import { addBackToMenu, addInfoText, addPanel, addSceneTitle, getResponsiveLayout } from "../ui/layout";

export class SpinScene extends Phaser.Scene {
  constructor() {
    super("SpinScene");
  }

  create(): void {
    const layout = getResponsiveLayout(this);
    addSceneTitle(this, "Спин");
    addBackToMenu(this);

    const save = saveService.current;
    const infoPanelWidth = layout.width * 0.416;
    const infoPanelHeight = layout.height * 0.128;
    const infoPanelX = layout.padding + infoPanelWidth / 2;
    const infoPanelY = layout.height * 0.214;

    addPanel(this, infoPanelX, infoPanelY, infoPanelWidth, infoPanelHeight);
    addInfoText(this, layout.padding * 1.71, layout.height * 0.181, `Баланс: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "24px");
    addInfoText(this, layout.padding * 1.71, layout.height * 0.228, `Гараж: ${save.inventory.length} / ${save.garageCap}`, "#d9e6f2", "22px");

    const pendingCar = CARS.find((car) => car.id === save.pendingReward?.carId);
    if (pendingCar) {
      this.showPending(pendingCar);
      return;
    }

    addInfoText(this, layout.width * 0.336, layout.height * 0.381, "Нажмите кнопку, чтобы получить машину.", "#ffffff", "26px");
    addTextButton(this, layout.width * 0.5, layout.height * 0.514, "Крутить", () => {
      if (CARS.length === 0) {
        this.add.text(layout.width * 0.32, layout.height * 0.597, "Каталог машин будет добавлен на этапе 3.", {
          fontFamily: "Arial",
          fontSize: "24px",
          color: "#ffffff",
        });
        return;
      }

      this.playSpinAnimation();
    });
  }

  private playSpinAnimation(): void {
    const save = saveService.current;
    const layout = getResponsiveLayout(this);
    const preview = this.add.container(layout.width * 0.5, layout.height * 0.456);
    const previewCars = Phaser.Utils.Array.Shuffle(CARS.filter((car) => car.rarity !== "Эксклюзивный")).slice(0, 8);
    let step = 0;

    const tick = () => {
      preview.removeAll(true);
      const car = previewCars[step % previewCars.length];
      const image = this.add.image(0, -18, car.imageKey);
      image.setDisplaySize(300, 160);
      const label = this.add
        .text(0, 94, car.name, {
          fontFamily: "Arial",
          fontSize: "24px",
          color: "#ffffff",
          align: "center",
          wordWrap: { width: 420 },
        })
        .setOrigin(0.5);
      preview.add([image, label]);
      step += 1;

      if (step < 14) {
        this.time.delayedCall(70 + step * 12, tick);
        return;
      }

      void this.finishSpin();
    };

    tick();
  }

  private async finishSpin(): Promise<void> {
    const save = saveService.current;
    const car = spin(CARS, save.chanceLevel);
    const nextSave = {
      ...save,
      pendingReward: {
        source: "spin" as const,
        carId: car.id,
        createdAt: Date.now(),
      },
      stats: {
        ...save.stats,
        spins: save.stats.spins + 1,
      },
    };

    await saveService.save(nextSave);
    this.scene.restart();
  }

  private showPending(car: (typeof CARS)[number]): void {
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
          width: layout.width * 0.422,
          maxLines: 2,
        });
        return;
      }

      if (result.status !== "ok") {
        this.scene.restart();
        return;
      }

      await saveService.save(result.save);
      this.scene.start("GarageScene");
    });

    addTextButton(this, button2X, buttonY, `Продать за ${car.value.toLocaleString("ru-RU")}`, async () => {
      const result = sellPendingReward(save, CARS);
      if (result.status !== "ok") {
        this.scene.restart();
        return;
      }

      await saveService.save(result.save);
      this.scene.start("MenuScene");
    });
  }
}
