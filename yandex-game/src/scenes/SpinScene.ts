import Phaser from "phaser";
import { CARS } from "../data/cars";
import { spin } from "../game/spinEngine";
import { saveService } from "../services/saveService";
import { addTextButton } from "../ui/buttons";
import { addCarCard } from "../ui/carCard";
import { addBackToMenu, addSceneTitle } from "../ui/layout";

export class SpinScene extends Phaser.Scene {
  constructor() {
    super("SpinScene");
  }

  create(): void {
    addSceneTitle(this, "Спин");
    addBackToMenu(this);

    const save = saveService.current;
    const pendingCar = CARS.find((car) => car.id === save.pendingReward?.carId);
    if (pendingCar) {
      this.showPending(pendingCar);
      return;
    }

    addTextButton(this, 640, 360, "Крутить", async () => {
      if (CARS.length === 0) {
        this.add.text(410, 430, "Каталог машин будет добавлен на этапе 3.", {
          fontFamily: "Arial",
          fontSize: "24px",
          color: "#ffffff",
        });
        return;
      }

      const car = spin(CARS, save.chanceLevel);
      save.pendingReward = {
        source: "spin",
        carId: car.id,
        createdAt: Date.now(),
      };
      save.stats.spins += 1;
      await saveService.save(save);
      this.scene.restart();
    });
  }

  private showPending(car: (typeof CARS)[number]): void {
    const save = saveService.current;
    addCarCard(this, 640, 320, car);
    addTextButton(this, 480, 540, "Оставить", async () => {
      if (save.inventory.length >= save.garageCap) {
        this.add.text(430, 600, "Гараж заполнен. Продайте машину или освободите место.", {
          fontFamily: "Arial",
          fontSize: "22px",
          color: "#ff8b8b",
        });
        return;
      }

      save.inventory.push({
        inventoryId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        carId: car.id,
        obtainedAt: Date.now(),
      });
      save.pendingReward = null;
      await saveService.save(save);
      this.scene.start("GarageScene");
    });

    addTextButton(this, 800, 540, "Продать", async () => {
      save.money += car.value;
      save.pendingReward = null;
      save.stats.carsSold += 1;
      await saveService.save(save);
      this.scene.start("MenuScene");
    });
  }
}
