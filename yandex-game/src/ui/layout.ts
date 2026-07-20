import Phaser from "phaser";

export function addSceneTitle(scene: Phaser.Scene, title: string): Phaser.GameObjects.Text {
  return scene.add
    .text(48, 36, title, {
      fontFamily: "Arial",
      fontSize: "42px",
      color: "#ffffff",
    })
    .setOrigin(0, 0);
}

export function addBackToMenu(scene: Phaser.Scene): Phaser.GameObjects.Text {
  const back = scene.add
    .text(48, 650, "Назад", {
      fontFamily: "Arial",
      fontSize: "26px",
      color: "#9fc8ff",
    })
    .setInteractive({ useHandCursor: true });

  back.on("pointerup", () => scene.scene.start("MenuScene"));
  return back;
}
