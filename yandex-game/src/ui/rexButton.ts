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

function scaleColor(color: number, factor: number): number {
  const r = Math.min(255, Math.floor(((color >> 16) & 0xff) * factor));
  const g = Math.min(255, Math.floor(((color >> 8) & 0xff) * factor));
  const b = Math.min(255, Math.floor((color & 0xff) * factor));
  return (r << 16) | (g << 8) | b;
}

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
  const bgColor = options.background?.color ?? 0xf9c30f;
  const radius = options.background?.radius ?? 18;
  const shadowOffset = 6;

  const gfx = scene.add.graphics();

  function draw(pressed: boolean, hover: boolean): void {
    gfx.clear();

    const hw = width / 2;
    const hh = height / 2;
    const yOff = pressed ? shadowOffset : 0;

    // Black drop shadow (hidden when pressed)
    if (!pressed) {
      gfx.fillStyle(0x000000, 1);
      gfx.fillRoundedRect(-hw, -hh + shadowOffset, width, height, radius);
    }

    // Main button face
    const faceColor = hover && !pressed ? scaleColor(bgColor, 1.12) : bgColor;
    gfx.fillStyle(faceColor, 1);
    gfx.fillRoundedRect(-hw, -hh + yOff, width, height, radius);

    // Top shimmer highlight
    gfx.fillStyle(0xffffff, pressed ? 0.08 : 0.22);
    gfx.fillRoundedRect(-hw + 4, -hh + yOff + 4, width - 8, height * 0.42, radius - 3);

    // Thick black border
    gfx.lineStyle(4, 0x000000, 1);
    gfx.strokeRoundedRect(-hw, -hh + yOff, width, height, radius);
  }

  draw(false, false);

  const label = scene.add
    .text(0, 0, text, {
      fontFamily: "'Arial Black', 'Arial Bold', Arial",
      fontStyle: "bold",
      fontSize: options.text?.fontSize ?? "22px",
      color: options.text?.color ?? "#ffffff",
      stroke: "#000000",
      strokeThickness: 5,
      align: "center",
    })
    .setOrigin(0.5);

  const container = scene.add.container(x, y, [gfx, label]);
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });

  container
    .on("pointerover", () => draw(false, true))
    .on("pointerout", () => {
      draw(false, false);
      label.setY(0);
    })
    .on("pointerdown", () => {
      draw(true, false);
      label.setY(shadowOffset);
      onClick();
    })
    .on("pointerup", () => {
      draw(false, true);
      label.setY(0);
    });

  return container;
}
