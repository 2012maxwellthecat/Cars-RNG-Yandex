import Phaser from "phaser";

export type TextButtonOptions = {
  width?: number;
  height?: number;
  fillColor?: number;
  strokeColor?: number;
  disabled?: boolean;
  fontSize?: string;
  minFontSize?: number;
  hitPadding?: number;
};

export function addTextButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => unknown,
  options: TextButtonOptions = {},
): Phaser.GameObjects.Container {
  const width = options.width ?? 280;
  const height = options.height ?? 56;
  const fillColor = options.disabled ? 0x3b4654 : options.fillColor ?? 0x2f7dd1;
  const strokeColor = options.disabled ? 0x596575 : options.strokeColor ?? 0x82b7ff;
  const background = scene.add.rectangle(0, 0, width, height, fillColor, 1);
  background.setStrokeStyle(2, strokeColor);

  const initialFontSize = Number.parseInt(options.fontSize ?? "24", 10);
  const minFontSize = options.minFontSize ?? 14;
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: "Arial",
      fontSize: options.fontSize ?? "24px",
      color: options.disabled ? "#aab3bf" : "#ffffff",
      align: "center",
      wordWrap: { width: width - 24 },
    })
    .setOrigin(0.5);
  fitTextInside(text, width - 24, height - 8, initialFontSize, minFontSize);

  const container = scene.add.container(x, y, [background, text]);
  container.setSize(width, height);
  if (options.disabled) {
    return container;
  }

  const hitPadding = options.hitPadding ?? 6;
  const hitZone = scene.add.zone(x, y, width + hitPadding * 2, height + hitPadding * 2).setOrigin(0.5);
  hitZone.setInteractive({ useHandCursor: true });

  let canClick = true;
  hitZone.on("pointerover", () => background.setFillStyle(0x3c8ee8));
  hitZone.on("pointerout", () => background.setFillStyle(fillColor));
  hitZone.on("pointerdown", () => {
    if (!canClick) {
      return;
    }

    canClick = false;
    background.setFillStyle(0x2468ad);
    void Promise.resolve(onClick()).finally(() => {
      if (!scene.scene.isActive() || !hitZone.active) {
        return;
      }

      scene.time.delayedCall(200, () => {
        canClick = true;
        if (background.active) {
          background.setFillStyle(fillColor);
        }
      });
    });
  });

  return container;
}

function fitTextInside(
  text: Phaser.GameObjects.Text,
  maxWidth: number,
  maxHeight: number,
  initialFontSize: number,
  minFontSize: number,
): void {
  let fontSize = initialFontSize;
  while ((text.width > maxWidth || text.height > maxHeight) && fontSize > minFontSize) {
    fontSize -= 1;
    text.setFontSize(fontSize);
  }
}
