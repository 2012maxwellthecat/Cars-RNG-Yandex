import Phaser from "phaser";

export function addTextButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
): Phaser.GameObjects.Container {
  const width = 280;
  const height = 56;
  const background = scene.add.rectangle(0, 0, width, height, 0x2f7dd1, 1);
  background.setStrokeStyle(2, 0x82b7ff);

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  const container = scene.add.container(x, y, [background, text]);
  container.setSize(width, height);
  container.setInteractive(
    new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
    Phaser.Geom.Rectangle.Contains,
  );
  container.on("pointerup", onClick);
  return container;
}
