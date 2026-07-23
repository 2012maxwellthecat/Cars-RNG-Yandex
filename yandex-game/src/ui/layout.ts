import Phaser from "phaser";
import { addTextButton } from "./buttons";

// Get responsive coordinates based on actual game size
export function getResponsiveLayout(scene: Phaser.Scene) {
  const width = scene.scale.width;
  const height = scene.scale.height;

  return {
    width,
    height,
    padding: Math.max(24, width * 0.0375), // 48px at 1280px width
    buttonSpacing: Math.max(40, height * 0.055), // 80px at 720px height
    panelSpacing: Math.max(20, width * 0.015),
  };
}

export function addSceneTitle(scene: Phaser.Scene, title: string): Phaser.GameObjects.Text {
  const layout = getResponsiveLayout(scene);
  return scene.add
    .text(layout.padding, layout.padding * 0.75, title, {
      fontFamily: "Arial",
      fontSize: `${Math.max(32, layout.padding * 0.875)}px`,
      color: "#ffffff",
    })
    .setOrigin(0, 0);
}

export function addBackToMenu(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const layout = getResponsiveLayout(scene);
  return addTextButton(
    scene,
    layout.width - layout.padding - 84,
    layout.padding * 1.25,
    "Назад",
    () => scene.scene.start("MenuScene"),
    {
      width: 168,
      height: 48,
      fillColor: 0x263244,
      strokeColor: 0x55677f,
      fontSize: "22px",
    }
  );
}

export function addPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.Rectangle {
  const panel = scene.add.rectangle(x, y, width, height, 0x202938, 1);
  panel.setStrokeStyle(2, 0x38485c);
  return panel;
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
    fontFamily: "Arial",
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
