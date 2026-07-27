import Phaser from "phaser";

import { BootScene } from "./scenes/BootScene";
import { CasesScene } from "./scenes/CasesScene";
import { GarageScene } from "./scenes/GarageScene";
import { LeaderboardScene } from "./scenes/LeaderboardScene";
import { MenuScene } from "./scenes/MenuScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { SpinScene } from "./scenes/SpinScene";
import { UpgradesScene } from "./scenes/UpgradesScene";
import "./styles.css";

// Определяем ориентацию на основе размера окна
const isPortrait = window.innerHeight > window.innerWidth;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#0e0b2e",
  render: {
    antialias: true,
    mipmapFilter: "LINEAR_MIPMAP_LINEAR",
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Портрет: 720x1280, Ландшафт: 1280x720
    width: isPortrait ? 720 : 1280,
    height: isPortrait ? 1280 : 720,
    // Использовать window размеры для полного покрытия
    parent: "game",
    expandParent: true,
    fullscreenTarget: "game",
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    SpinScene,
    CasesScene,
    GarageScene,
    UpgradesScene,
    LeaderboardScene,
  ],
};

new Phaser.Game(config);
