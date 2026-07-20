import Phaser from "phaser";
import { CARS } from "../data/cars";
import { getInventoryViews, sellInventoryCar, sortInventoryViews } from "../game/economy";
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

    const items = sortInventoryViews(getInventoryViews(save, CARS));

    items.slice(0, 12).forEach(({ car, inventoryId }, index) => {
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
        const result = sellInventoryCar(save, inventoryId, CARS);
        if (result.status === "ok") {
          await saveService.save(result.save);
        }
        this.scene.restart();
      });
    });
  }
}
