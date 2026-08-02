import Phaser from "phaser";

import { BootScene } from "./scenes/BootScene";
import { CasesScene } from "./scenes/CasesScene";
import { GarageScene } from "./scenes/GarageScene";
import { LeaderboardScene } from "./scenes/LeaderboardScene";
import { MenuScene } from "./scenes/MenuScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { SpinScene } from "./scenes/SpinScene";
import { UpgradesScene } from "./scenes/UpgradesScene";
import { SettingsScene } from "./scenes/SettingsScene";
import "./styles.css";

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
    width: isPortrait ? 720 : 1280,
    height: isPortrait ? 1280 : 720,
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
    SettingsScene,
  ],
};

const game = new Phaser.Game(config);

type PauseReason = "debug" | "visibility" | "blur";

const pauseReasons = new Set<PauseReason>();
const pausedSceneKeys = new Set<string>();
let isGamePaused = false;
let sdkPauseEventsAttached = false;

function notifyGameplayStopped(): void {
  if (!window.ysdk?.features?.GameplayAPI) return;

  try {
    window.ysdk.features.GameplayAPI.stop();
    console.log("[Yandex API] GameplayAPI.stop() called");
  } catch (error) {
    console.error("[Yandex API] GameplayAPI.stop() error:", error);
  }
}

function notifyGameplayStarted(): void {
  if (!window.ysdk?.features?.GameplayAPI) return;

  try {
    window.ysdk.features.GameplayAPI.start();
    console.log("[Yandex API] GameplayAPI.start() called");
  } catch (error) {
    console.error("[Yandex API] GameplayAPI.start() error:", error);
  }
}

function syncGamePauseState(): void {
  const shouldPause = pauseReasons.size > 0;

  if (shouldPause === isGamePaused) return;
  isGamePaused = shouldPause;

  if (shouldPause) {
    for (const scene of game.scene.getScenes(true)) {
      const key = scene.scene.key;
      game.scene.pause(key);
      pausedSceneKeys.add(key);
    }

    game.sound.pauseAll();
    console.log("[Pause] Game paused. Reasons:", [...pauseReasons]);
    return;
  }

  for (const key of pausedSceneKeys) {
    if (game.scene.isPaused(key)) {
      game.scene.resume(key);
    }
  }

  pausedSceneKeys.clear();
  game.sound.resumeAll();
  console.log("[Resume] Game resumed");
}

function setPauseReason(reason: PauseReason, enabled: boolean): void {
  if (enabled) {
    pauseReasons.add(reason);
  } else {
    pauseReasons.delete(reason);
  }

  syncGamePauseState();
}

if (typeof window !== "undefined") {
  const handleDebugPause = () => {
    console.log("[Yandex API] game_api_pause received");
    setPauseReason("debug", true);
  };

  const handleDebugResume = () => {
    console.log("[Yandex API] game_api_resume received");
    setPauseReason("debug", false);
  };

  window.addEventListener("game_api_pause", handleDebugPause);
  window.addEventListener("game_api_resume", handleDebugResume);

  const attachSdkPauseEvents = () => {
    const sdk = window.ysdk;
    if (sdkPauseEventsAttached || !sdk?.on) return;

    sdk.on("game_api_pause", handleDebugPause);
    sdk.on("game_api_resume", handleDebugResume);
    sdkPauseEventsAttached = true;
    console.log("[Yandex API] SDK pause events attached");
  };

  attachSdkPauseEvents();

  const attachSdkEventsInterval = window.setInterval(() => {
    attachSdkPauseEvents();

    if (sdkPauseEventsAttached) {
      window.clearInterval(attachSdkEventsInterval);
    }
  }, 500);

  window.setTimeout(() => {
    window.clearInterval(attachSdkEventsInterval);
  }, 30000);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    console.log("[Visibility] Document hidden");
    setPauseReason("visibility", true);
    notifyGameplayStopped();
  } else {
    console.log("[Visibility] Document visible");
    setPauseReason("visibility", false);
    if (pauseReasons.size === 0) {
      notifyGameplayStarted();
    }
  }
});

window.addEventListener("blur", () => {
  console.log("[Blur] Window lost focus");
  setPauseReason("blur", true);
});

window.addEventListener("focus", () => {
  console.log("[Focus] Window focused");

  if (!document.hidden) {
    setPauseReason("blur", false);
  }
});
