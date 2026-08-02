import Phaser from "phaser";
import { CARS } from "../data/cars";
import {
  calculateScore,
  canRequestAuthorization,
  getTopEntries,
  requestAuthorization,
  submitScore,
} from "../services/leaderboardService";
import { saveService } from "../services/saveService";
import { advertisementService } from "../services/advertisementService";
import { reportGameplayStopped } from "../services/gameplayLifecycleService";
import type { LeaderboardEntry } from "../game/types";
import { addTextButton } from "../ui/buttons";
import { addBackToMenu, addInfoText, addPanel, addSceneTitle, drawBackground } from "../ui/layout";
import { i18nService } from "../i18n/i18nService";

type SceneLayout = { width: number; height: number; isPortrait: boolean };

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super("LeaderboardScene");
  }

  async create(): Promise<void> {
    drawBackground(this);
    const layout = { width: this.scale.width, height: this.scale.height, isPortrait: this.scale.height > this.scale.width };
    const t = i18nService.getTranslations();

    // Уведомить advertisementService о смене сцены
    advertisementService.notifySceneChange("LeaderboardScene");
    reportGameplayStopped();

    // Показ fullscreen рекламы при переходе между сценами.
    // Внутри обязательный обратный отсчёт «Реклама через 3… 2… 1…».
    await advertisementService.tryShowSceneChangeAd();

    addSceneTitle(this, t.leaderboardTitle);
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
    addInfoText(this, scoreX, scoreY, `${t.leaderboardYourScore}: ${score.toLocaleString("ru-RU")}`, "#ffd166", layout.isPortrait ? "28px" : "30px");

    let entries: LeaderboardEntry[] | null = null;
    try {
      entries = await getTopEntries();
    } catch {
      entries = null;
    }

    const startY = layout.isPortrait ? layout.height * 0.21 : 230;
    const startX = layout.isPortrait ? layout.width * 0.1 : 250;
    const lineHeight = layout.isPortrait ? 46 : 38;
    const fontSize = layout.isPortrait ? "24px" : "26px";

    if (entries === null) {
      // API не ответило. Причины: игра запущена вне Яндекс Игр, либо
      // технического имени лидерборда нет в консоли разработчика (404).
      // Точную причину не угадываем — она уже в console.error.
      addInfoText(this, startX, startY, t.leaderboardUnavailable, "#ffffff", fontSize, { width: layout.width * 0.75 });
    } else if (entries.length === 0) {
      addInfoText(this, startX, startY, t.leaderboardEmpty, "#ffffff", fontSize, { width: layout.width * 0.75 });
    } else {
      entries.forEach((entry, index) => {
        this.add.text(startX, startY + index * lineHeight, `${entry.rank}. ${entry.displayName} — ${entry.score}`, {
          fontFamily: "Arial",
          fontSize: "24px",
          color: "#ffffff",
          wordWrap: { width: layout.width * 0.75 },
        });
      });
    }

    this.addAuthPrompt(layout);
  }

  /**
   * Предложить войти в аккаунт: таблицу гость видит, но его собственный счёт
   * в лидерборд не попадает — setScore требует авторизации.
   */
  private addAuthPrompt(layout: SceneLayout): void {
    if (!canRequestAuthorization()) {
      return;
    }

    const t = i18nService.getTranslations();
    const hintX = layout.isPortrait ? layout.width * 0.1 : 250;
    const hintY = layout.isPortrait ? layout.height * 0.62 : 628;
    const buttonX = layout.isPortrait ? layout.width * 0.5 : 640;
    const buttonY = layout.isPortrait ? layout.height * 0.68 : 678;

    addInfoText(this, hintX, hintY, t.leaderboardLoginHint, "#ffd166", layout.isPortrait ? "22px" : "20px", {
      width: layout.width * 0.75,
    });

    addTextButton(this, buttonX, buttonY, t.leaderboardLoginButton, async () => {
      if (await requestAuthorization()) {
        // Перезапуск сцены: теперь счёт можно отправить и увидеть себя в топе.
        this.scene.restart();
      }
    }, {
      width: layout.isPortrait ? layout.width * 0.7 : 260,
      height: layout.isPortrait ? 56 : 48,
      fillColor: 0x27ae60,
      fontSize: layout.isPortrait ? "24px" : "22px",
    });
  }
}
