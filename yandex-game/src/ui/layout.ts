import Phaser from "phaser";
import { addTextButton } from "./buttons";

export function addSceneTitle(scene: Phaser.Scene, title: string): Phaser.GameObjects.Text {
  return scene.add
    .text(48, 36, title, {
      fontFamily: "Arial",
      fontSize: "42px",
      color: "#ffffff",
    })
    .setOrigin(0, 0);
}

export function addBackToMenu(scene: Phaser.Scene): Phaser.GameObjects.Container {
  return addTextButton(scene, 132, 662, "Назад", () => scene.scene.start("MenuScene"), {
    width: 168,
    height: 48,
    fillColor: 0x263244,
    strokeColor: 0x55677f,
    fontSize: "22px",
  });
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
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: "Arial",
    fontSize,
    color,
    wordWrap: { width: 560 },
  });
}
