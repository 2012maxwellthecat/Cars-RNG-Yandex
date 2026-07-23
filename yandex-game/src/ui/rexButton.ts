import Phaser from "phaser";

export type RexButtonOptions = {
  width?: number;
  height?: number;
  background?: {
    color?: number;
    strokeColor?: number;
    strokeWidth?: number;
    radius?: number;
  };
  text?: {
    fontSize?: string;
    color?: string;
  };
  space?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
};

export function createRexButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  onClick: () => void,
  options: RexButtonOptions = {}
): Phaser.GameObjects.Container {
  const width = options.width ?? 280;
  const height = options.height ?? 56;
  const bgColor = options.background?.color ?? 0x2f7dd1;
  const strokeColor = options.background?.strokeColor ?? 0x82b7ff;
  const strokeWidth = options.background?.strokeWidth ?? 2;
  const radius = options.background?.radius ?? 8;

  const gfx = scene.add.graphics();

  function draw(color: number): void {
    gfx.clear();
    gfx.fillStyle(color, 1);
    gfx.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    gfx.lineStyle(strokeWidth, strokeColor, 1);
    gfx.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
  }

  draw(bgColor);

  const label = scene.add
    .text(0, 0, text, {
      fontFamily: "Arial",
      fontSize: options.text?.fontSize ?? "24px",
      color: options.text?.color ?? "#ffffff",
      align: "center",
    })
    .setOrigin(0.5);

  const container = scene.add.container(x, y, [gfx, label]);
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });

  container
    .on("pointerover", () => draw(0x3c8ee8))
    .on("pointerout", () => draw(bgColor))
    .on("pointerdown", () => {
      draw(0x2468ad);
      onClick();
    })
    .on("pointerup", () => draw(bgColor));

  return container;
}
