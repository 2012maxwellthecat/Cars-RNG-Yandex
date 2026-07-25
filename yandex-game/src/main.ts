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

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#0e0b2e",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
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
