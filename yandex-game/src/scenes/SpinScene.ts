import Phaser from "phaser";
import { CARS } from "../data/cars";
import { keepPendingReward, sellPendingReward } from "../game/economy";
import { spin } from "../game/spinEngine";
import { saveService } from "../services/saveService";
import { addTextButton } from "../ui/buttons";
import { addCarCard } from "../ui/carCard";
import { addBackToMenu, addInfoText, addPanel, addSceneTitle } from "../ui/layout";

export class SpinScene extends Phaser.Scene {
  constructor() {
    super("SpinScene");
  }

  create(): void {
    addSceneTitle(this, "Спин");
    addBackToMenu(this);

    const save = saveService.current;
    addPanel(this, 314, 154, 532, 92);
    addInfoText(this, 82, 130, `Баланс: ${save.money.toLocaleString("ru-RU")}`, "#ffd166", "24px");
    addInfoText(this, 82, 164, `Гараж: ${save.inventory.length} / ${save.garageCap}`, "#d9e6f2", "22px");

    const pendingCar = CARS.find((car) => car.id === save.pendingReward?.carId);
    if (pendingCar) {
      this.showPending(pendingCar);
      return;
    }

    addInfoText(this, 430, 274, "Нажмите кнопку, чтобы получить машину.", "#ffffff", "26px");
    addTextButton(this, 640, 370, "Крутить", () => {
      if (CARS.length === 0) {
        this.add.text(410, 430, "Каталог машин будет добавлен на этапе 3.", {
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
    const preview = this.add.container(640, 328);
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
    addCarCard(this, 640, 350, car);
    addInfoText(this, 442, 146, "Выберите, что сделать с машиной.", "#ffffff", "24px");
    addTextButton(this, 480, 594, "Оставить", async () => {
      const result = keepPendingReward(save);
      if (result.status === "garage-full") {
        addInfoText(this, 370, 642, "Гараж заполнен. Продайте машину или освободите место.", "#ff8b8b", "22px");
        return;
      }

      if (result.status !== "ok") {
        this.scene.restart();
        return;
      }

      await saveService.save(result.save);
      this.scene.start("GarageScene");
    });

    addTextButton(this, 800, 594, `Продать за ${car.value.toLocaleString("ru-RU")}`, async () => {
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
