import Phaser from "phaser";
import { CARS } from "../data/cars";
import { calculateScore, getTopEntries, submitScore } from "../services/leaderboardService";
import { saveService } from "../services/saveService";
import { advertisementService } from "../services/advertisementService";
import type { LeaderboardEntry } from "../game/types";
import { addBackToMenu, addInfoText, addPanel, addSceneTitle, drawBackground } from "../ui/layout";

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super("LeaderboardScene");
  }

  async create(): Promise<void> {
    drawBackground(this);
    const layout = { width: this.scale.width, height: this.scale.height, isPortrait: this.scale.height > this.scale.width };

    // Уведомить advertisementService о смене сцены
    advertisementService.notifySceneChange("LeaderboardScene");

    // Показ fullscreen рекламы при переходе между сценами.
    // Внутри обязательный обратный отсчёт «Реклама через 3… 2… 1…».
    await advertisementService.tryShowSceneChangeAd();

    addSceneTitle(this, "Лидерборд");
    addBackToMenu(this);

    if (layout.isPortrait) {
      addPanel(this, layout.width * 0.5, layout.height * 0.5, layout.width * 0.88, layout.height * 0.7);
    } else {
      addPanel(this, 640, 384, 860, 470);
    }

    const score = calculateScore(saveService.current.inventory, CARS);
    try {
      await submitScore(score);
    } catch {
      // Local or unavailable SDK mode should not block the scene.
    }

    const scoreY = layout.isPortrait ? layout.height * 0.11 : 164;
    const scoreX = layout.isPortrait ? layout.width * 0.5 - 130 : 250;
    addInfoText(this, scoreX, scoreY, `Ваш счет: ${score.toLocaleString("ru-RU")}`, "#ffd166", layout.isPortrait ? "28px" : "30px");

    let entries: LeaderboardEntry[] = [];
    try {
      entries = await getTopEntries();
    } catch {
      entries = [];
    }
    if (entries.length === 0) {
      const emptyY = layout.isPortrait ? layout.height * 0.24 : 250;
      const emptyX = layout.isPortrait ? layout.width * 0.1 : 250;
      addInfoText(this, emptyX, emptyY, "Лидерборд будет доступен в окружении Яндекс Игр.", "#ffffff", layout.isPortrait ? "24px" : "26px", { width: layout.width * 0.8 });
      return;
    }

    const startY = layout.isPortrait ? layout.height * 0.21 : 230;
    const startX = layout.isPortrait ? layout.width * 0.1 : 250;
    const lineHeight = layout.isPortrait ? 46 : 38;

    entries.forEach((entry, index) => {
      this.add.text(startX, startY + index * lineHeight, `${entry.rank}. ${entry.displayName} — ${entry.score}`, {
        fontFamily: "Arial",
        fontSize: layout.isPortrait ? "24px" : "24px",
        color: "#ffffff",
        wordWrap: { width: layout.width * 0.75 },
      });
    });
  }
}
