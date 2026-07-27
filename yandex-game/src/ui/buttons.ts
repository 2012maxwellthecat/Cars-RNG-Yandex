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

function scaleColor(color: number, factor: number): number {
  const r = Math.min(255, Math.floor(((color >> 16) & 0xff) * factor));
  const g = Math.min(255, Math.floor(((color >> 8) & 0xff) * factor));
  const b = Math.min(255, Math.floor((color & 0xff) * factor));
  return (r << 16) | (g << 8) | b;
}

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
  const radius = 16;
  const shadowOffset = 5;

  const gfx = scene.add.graphics();

  function draw(pressed: boolean, hover: boolean): void {
    gfx.clear();
    const hw = width / 2;
    const hh = height / 2;

    if (options.disabled) {
      gfx.fillStyle(fillColor, 1);
      gfx.fillRoundedRect(-hw, -hh, width, height, radius);
      gfx.lineStyle(3, 0x000000, 0.35);
      gfx.strokeRoundedRect(-hw, -hh, width, height, radius);
      return;
    }

    const yOff = pressed ? shadowOffset : 0;

    if (!pressed) {
      gfx.fillStyle(0x000000, 1);
      gfx.fillRoundedRect(-hw, -hh + shadowOffset, width, height, radius);
    }

    const faceColor = hover && !pressed ? scaleColor(fillColor, 1.12) : fillColor;
    gfx.fillStyle(faceColor, 1);
    gfx.fillRoundedRect(-hw, -hh + yOff, width, height, radius);

    gfx.fillStyle(0xffffff, pressed ? 0.07 : 0.2);
    gfx.fillRoundedRect(-hw + 4, -hh + yOff + 4, width - 8, height * 0.42, radius - 3);

    gfx.lineStyle(4, 0x000000, 1);
    gfx.strokeRoundedRect(-hw, -hh + yOff, width, height, radius);
  }

  draw(false, false);

  const initialFontSize = Number.parseInt(options.fontSize ?? "22", 10);
  const minFontSize = options.minFontSize ?? 14;
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: "'Arial Black', 'Arial Bold', Arial",
      fontStyle: "bold",
      fontSize: options.fontSize ?? "22px",
      color: options.disabled ? "#aab3bf" : "#ffffff",
      stroke: "#000000",
      strokeThickness: options.disabled ? 0 : 5,
      align: "center",
      wordWrap: { width: width - 24 },
    })
    .setOrigin(0.5);
  fitTextInside(text, width - 24, height - 8, initialFontSize, minFontSize);

  const container = scene.add.container(x, y, [gfx, text]);
  container.setSize(width, height);
  if (options.disabled) {
    return container;
  }

  const hitPadding = options.hitPadding ?? 6;
  // Создаем hitZone с позицией (0, 0) относительно контейнера
  const hitZone = scene.add.zone(0, 0, width + hitPadding * 2, height + hitPadding * 2).setOrigin(0.5);
  hitZone.setInteractive({ useHandCursor: true });

  // Добавляем hitZone в контейнер, чтобы он двигался вместе с кнопкой
  container.add(hitZone);

  let canClick = true;
  hitZone.on("pointerover", () => draw(false, true));
  hitZone.on("pointerout", () => {
    draw(false, false);
    text.setY(0);
  });
  hitZone.on("pointerup", () => {
    draw(false, true);
    text.setY(0);
  });
  hitZone.on("pointerdown", () => {
    if (!canClick) return;
    canClick = false;
    draw(true, false);
    text.setY(shadowOffset);
    void Promise.resolve(onClick()).finally(() => {
      if (!scene.scene.isActive() || !hitZone.active) return;
      scene.time.delayedCall(200, () => {
        canClick = true;
        if (gfx.active) {
          draw(false, false);
          text.setY(0);
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
