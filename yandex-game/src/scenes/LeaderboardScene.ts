import Phaser from "phaser";
import { CARS } from "../data/cars";
import { calculateScore, getTopEntries, submitScore } from "../services/leaderboardService";
import { saveService } from "../services/saveService";
import type { LeaderboardEntry } from "../game/types";
import { addBackToMenu, addInfoText, addPanel, addSceneTitle } from "../ui/layout";

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super("LeaderboardScene");
  }

  async create(): Promise<void> {
    addSceneTitle(this, "Лидерборд");
    addBackToMenu(this);
    addPanel(this, 640, 384, 860, 470);

    const score = calculateScore(saveService.current.inventory, CARS);
    try {
      await submitScore(score);
    } catch {
      // Local or unavailable SDK mode should not block the scene.
    }

    addInfoText(this, 250, 164, `Ваш счет: ${score.toLocaleString("ru-RU")}`, "#ffd166", "30px");

    let entries: LeaderboardEntry[] = [];
    try {
      entries = await getTopEntries();
    } catch {
      entries = [];
    }
    if (entries.length === 0) {
      addInfoText(this, 250, 250, "Лидерборд будет доступен в окружении Яндекс Игр.", "#ffffff", "26px");
      return;
    }

    entries.forEach((entry, index) => {
      this.add.text(250, 230 + index * 38, `${entry.rank}. ${entry.displayName} — ${entry.score}`, {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
      });
    });
  }
}
