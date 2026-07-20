import Phaser from "phaser";
import { CARS } from "../data/cars";
import { DEFAULT_INVENTORY_ORDER } from "../game/constants";
import type { InventoryCar, Car } from "../game/types";
import { saveService } from "../services/saveService";
import { addBackToMenu, addSceneTitle } from "../ui/layout";

export class GarageScene extends Phaser.Scene {
  constructor() {
    super("GarageScene");
  }

  create(): void {
    const save = saveService.current;
    addSceneTitle(this, "Гараж");
    addBackToMenu(this);

    this.add.text(48, 100, `Машин: ${save.inventory.length} / ${save.garageCap}`, {
      fontFamily: "Arial",
      fontSize: "26px",
      color: "#d9e6f2",
    });

    if (save.inventory.length === 0) {
      this.add.text(48, 170, "Гараж пуст. Сначала выиграйте машину.", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
      });
      return;
    }

    const carsById = new Map(CARS.map((car) => [car.id, car]));
    const items = save.inventory
      .map((item) => ({ item, car: carsById.get(item.carId) }))
      .filter((entry): entry is { item: InventoryCar; car: Car } => {
        return entry.car !== undefined;
      })
      .sort((left, right) => {
        const rarityDiff =
          DEFAULT_INVENTORY_ORDER.indexOf(left.car.rarity) - DEFAULT_INVENTORY_ORDER.indexOf(right.car.rarity);
        if (rarityDiff !== 0) {
          return rarityDiff;
        }
        return right.car.value - left.car.value || left.item.obtainedAt - right.item.obtainedAt;
      });

    items.slice(0, 12).forEach(({ item, car }, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const x = 80 + col * 390;
      const y = 170 + row * 90;

      const text = this.add
        .text(x, y, `${car.name}\n${car.rarity} | ${car.value.toLocaleString("ru-RU")}`, {
          fontFamily: "Arial",
          fontSize: "20px",
          color: "#ffffff",
        })
        .setInteractive({ useHandCursor: true });

      text.on("pointerup", async () => {
        save.inventory = save.inventory.filter((inventoryCar) => inventoryCar.inventoryId !== item.inventoryId);
        save.money += car.value;
        save.stats.carsSold += 1;
        await saveService.save(save);
        this.scene.restart();
      });
    });
  }
}
