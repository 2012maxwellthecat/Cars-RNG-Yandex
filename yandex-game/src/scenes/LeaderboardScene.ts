import Phaser from "phaser";
import { CARS } from "../data/cars";
import { calculateScore, getTopEntries, submitScore } from "../services/leaderboardService";
import { saveService } from "../services/saveService";
import { addBackToMenu, addSceneTitle } from "../ui/layout";

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super("LeaderboardScene");
  }

  async create(): Promise<void> {
    addSceneTitle(this, "Лидерборд");
    addBackToMenu(this);

    const score = calculateScore(saveService.current.inventory, CARS);
    await submitScore(score);

    this.add.text(48, 110, `Ваш счет: ${score.toLocaleString("ru-RU")}`, {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#ffd166",
    });

    const entries = await getTopEntries();
    if (entries.length === 0) {
      this.add.text(48, 170, "Лидерборд будет доступен в окружении Яндекс Игр.", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
      });
      return;
    }

    entries.forEach((entry, index) => {
      this.add.text(48, 170 + index * 42, `${entry.rank}. ${entry.displayName} — ${entry.score}`, {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
      });
    });
  }
}
