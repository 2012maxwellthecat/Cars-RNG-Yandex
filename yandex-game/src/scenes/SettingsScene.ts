import Phaser from "phaser";
import { audioService } from "../services/audioService";
import { addTextButton } from "../ui/buttons";
import { addBackButton, addInfoText, addPanel, addSceneTitle, drawBackground, getResponsiveLayout } from "../ui/layout";
import { i18nService } from "../i18n/i18nService";

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super("SettingsScene");
  }

  create(): void {
    drawBackground(this);
    const layout = getResponsiveLayout(this);
    const t = i18nService.getTranslations();

    addSceneTitle(this, t.settingsTitle);

    // Кнопка "Назад" возвращает в главное меню
    addBackButton(this, () => {
      audioService.playSound("button");
      this.scene.start("MenuScene");
    });

    if (layout.isPortrait) {
      // Портретный режим
      const panelWidth = layout.width * 0.88;
      const panelHeight = layout.height * 0.4;
      const centerX = layout.width * 0.5;
      const centerY = layout.height * 0.4;

      addPanel(this, centerX, centerY, panelWidth, panelHeight);

      const labelY = layout.height * 0.25;
      const buttonY = layout.height * 0.35;

      addInfoText(this, layout.padding * 1.5, labelY, t.settingsSound, "#ffffff", "26px");

      this.createSoundToggleButton(centerX, buttonY, layout.width * 0.7, 64, "24px");
    } else {
      // Ландшафтный режим
      const panelWidth = layout.width * 0.5;
      const panelHeight = layout.height * 0.4;
      const centerX = layout.width * 0.5;
      const centerY = layout.height * 0.45;

      addPanel(this, centerX, centerY, panelWidth, panelHeight);

      const labelY = layout.height * 0.3;
      const buttonY = layout.height * 0.42;

      addInfoText(this, layout.width * 0.28, labelY, t.settingsSound, "#ffffff", "26px");

      this.createSoundToggleButton(centerX, buttonY, 320, 56, "22px");
    }
  }

  private createSoundToggleButton(x: number, y: number, width: number, height: number, fontSize: string): void {
    const t = i18nService.getTranslations();
    const isMuted = audioService.getMuted();
    const buttonText = isMuted ? t.settingsSoundOff : t.settingsSoundOn;
    const fillColor = isMuted ? 0x9e3c45 : 0x27ae60;

    addTextButton(
      this,
      x,
      y,
      buttonText,
      () => {
        audioService.toggleMute();
        // Воспроизвести тестовый звук при включении
        if (!audioService.getMuted()) {
          audioService.playSound("click");
        }
        this.scene.restart();
      },
      {
        width,
        height,
        fillColor,
        fontSize,
      }
    );
  }
}
