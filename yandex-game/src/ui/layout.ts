import Phaser from "phaser";
import { addTextButton } from "./buttons";
import { i18nService } from "../i18n/i18nService";

export function getResponsiveLayout(scene: Phaser.Scene) {
  const width = scene.scale.width;
  const height = scene.scale.height;
  const isPortrait = height > width;

  return {
    width,
    height,
    isPortrait,
    padding: Math.max(24, width * 0.0375),
    buttonSpacing: Math.max(40, height * 0.055),
    panelSpacing: Math.max(20, width * 0.015),
  };
}

export function drawBackground(scene: Phaser.Scene): void {
  const { width, height } = scene.scale;
  const gfx = scene.add.graphics();
  // Deep purple top → dark navy bottom
  gfx.fillGradientStyle(0x1a0a3e, 0x1a0a3e, 0x050a20, 0x050a20, 1);
  gfx.fillRect(0, 0, width, height);
  // Subtle radial-ish center highlight
  gfx.fillGradientStyle(0x2a1060, 0x2a1060, 0x0a0828, 0x0a0828, 0.35);
  gfx.fillRect(width * 0.15, 0, width * 0.7, height * 0.6);
}

export function addSceneTitle(scene: Phaser.Scene, title: string): Phaser.GameObjects.Text {
  const layout = getResponsiveLayout(scene);

  if (layout.isPortrait) {
    // Portrait mode: centered title at the top with larger font
    return scene.add
      .text(layout.width * 0.5, layout.padding * 0.9, title, {
        fontFamily: "'Arial Black', 'Arial Bold', Arial",
        fontStyle: "bold",
        fontSize: `${Math.max(38, layout.padding * 1.2)}px`,
        color: "#ffd700",
        stroke: "#000000",
        strokeThickness: 6,
        align: "center",
      })
      .setOrigin(0.5, 0);
  } else {
    // Landscape mode: left-aligned title (original behavior)
    return scene.add
      .text(layout.padding, layout.padding * 0.75, title, {
        fontFamily: "'Arial Black', 'Arial Bold', Arial",
        fontStyle: "bold",
        fontSize: `${Math.max(34, layout.padding * 0.875)}px`,
        color: "#ffd700",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0, 0);
  }
}

export function addBackToMenu(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const layout = getResponsiveLayout(scene);
  const t = i18nService.getTranslations();

  if (layout.isPortrait) {
    // Portrait mode: top-right corner to avoid overlapping with centered title
    return addTextButton(
      scene,
      layout.width - layout.padding - 70,
      layout.padding * 0.9,
      t.back,
      () => scene.scene.start("MenuScene"),
      {
        width: 140,
        height: 44,
        fillColor: 0x3b2280,
        strokeColor: 0x7b5cff,
        fontSize: "20px",
      }
    );
  } else {
    // Landscape mode: top-right corner (original behavior)
    return addTextButton(
      scene,
      layout.width - layout.padding - 84,
      layout.padding * 1.25,
      t.back,
      () => scene.scene.start("MenuScene"),
      {
        width: 168,
        height: 48,
        fillColor: 0x3b2280,
        strokeColor: 0x7b5cff,
        fontSize: "22px",
      }
    );
  }
}

export function addBackButton(scene: Phaser.Scene, callback: () => void): Phaser.GameObjects.Container {
  const layout = getResponsiveLayout(scene);
  const t = i18nService.getTranslations();

  if (layout.isPortrait) {
    // Portrait mode: top-right corner to avoid overlapping with centered title
    return addTextButton(
      scene,
      layout.width - layout.padding - 70,
      layout.padding * 0.9,
      t.back,
      callback,
      {
        width: 140,
        height: 44,
        fillColor: 0x3b2280,
        strokeColor: 0x7b5cff,
        fontSize: "20px",
      }
    );
  } else {
    // Landscape mode: top-right corner (original behavior)
    return addTextButton(
      scene,
      layout.width - layout.padding - 84,
      layout.padding * 1.25,
      t.back,
      callback,
      {
        width: 168,
        height: 48,
        fillColor: 0x3b2280,
        strokeColor: 0x7b5cff,
        fontSize: "22px",
      }
    );
  }
}

export function addPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.Graphics {
  const gfx = scene.add.graphics();
  const hw = width / 2;
  const hh = height / 2;
  const radius = 16;

  // Gradient fill: purple-blue top → deep navy bottom
  gfx.fillGradientStyle(0x2c1d5e, 0x2c1d5e, 0x0f0c38, 0x0f0c38, 0.95);
  gfx.fillRoundedRect(x - hw, y - hh, width, height, radius);

  // Inner highlight at top
  gfx.fillGradientStyle(0x5030a0, 0x5030a0, 0x2c1d5e, 0x2c1d5e, 0.3);
  gfx.fillRoundedRect(x - hw + 2, y - hh + 2, width - 4, height * 0.3, { tl: radius, tr: radius, bl: 0, br: 0 });

  // Bright border
  gfx.lineStyle(2, 0x7b5cff, 1);
  gfx.strokeRoundedRect(x - hw, y - hh, width, height, radius);

  return gfx;
}

export function addInfoText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color = "#d9e6f2",
  fontSize = "24px",
  options: { width?: number; fixedWidth?: number; align?: "left" | "center" | "right"; maxLines?: number } = {},
): Phaser.GameObjects.Text {
  const style: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: "'Arial Black', Arial",
    fontStyle: "bold",
    fontSize,
    color,
    align: options.align ?? "left",
    wordWrap: { width: options.width ?? 560 },
  };

  if (options.fixedWidth !== undefined) {
    style.fixedWidth = options.fixedWidth;
  }

  if (options.maxLines !== undefined) {
    style.maxLines = options.maxLines;
  }

  return scene.add.text(x, y, text, style);
}
