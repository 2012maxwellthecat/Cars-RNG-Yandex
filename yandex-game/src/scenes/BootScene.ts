import Phaser from "phaser";
import { saveService } from "../services/saveService";
import { yandexSdk } from "../services/yandexSdk";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  async create(): Promise<void> {
    await yandexSdk.init();
    await saveService.load();
    this.scene.start("PreloadScene");
  }
}
