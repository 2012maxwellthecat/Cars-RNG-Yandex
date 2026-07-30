import Phaser from "phaser";
import { saveService } from "../services/saveService";
import { yandexSdk } from "../services/yandexSdk";
import { advertisementService } from "../services/advertisementService";
import { logEnvironmentInfo } from "../config/environment";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  async create(): Promise<void> {
    // Инициализация Yandex SDK
    await yandexSdk.init();

    // Логирование информации об окружении
    logEnvironmentInfo();

    // Инициализация сервиса рекламы с передачей game instance
    advertisementService.init(yandexSdk.getSdk(), this.game);

    // Загрузка сохранений
    await saveService.load();

    // Переход к загрузке ассетов
    this.scene.start("PreloadScene");
  }
}
