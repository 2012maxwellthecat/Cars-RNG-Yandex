import type { SaveData } from "../game/saveModel";
import type { LeaderboardEntry } from "../game/types";
import type { YandexGamesSdk, YandexPlayer } from "../types/yandex-games";

const LEADERBOARD_NAME = "carsRngPoints";

export class YandexSdkService {
  private sdk: YandexGamesSdk | null = null;
  private player: YandexPlayer | null = null;

  async init(): Promise<void> {
    if (!window.YaGames) {
      return;
    }

    this.sdk = await window.YaGames.init();
    this.player = await this.sdk.getPlayer({ scopes: false });
  }

  isAvailable(): boolean {
    return this.sdk !== null && this.player !== null;
  }

  getSdk(): YandexGamesSdk | null {
    return this.sdk;
  }

  getPlayerName(): string {
    return this.player?.getName() || "Игрок";
  }

  async loadPlayerData(): Promise<SaveData | null> {
    if (!this.player) {
      return null;
    }

    const data = await this.player.getData(["saveData"]);
    return data.saveData ?? null;
  }

  async savePlayerData(saveData: SaveData): Promise<void> {
    if (!this.player) {
      return;
    }

    await this.player.setData({ saveData }, true);
  }

  async submitLeaderboardScore(score: number): Promise<void> {
    if (!this.sdk?.getLeaderboards) {
      return;
    }

    const leaderboards = await this.sdk.getLeaderboards();
    await leaderboards.setLeaderboardScore(LEADERBOARD_NAME, score);
  }

  async getLeaderboardEntries(limit = 10): Promise<LeaderboardEntry[]> {
    if (!this.sdk?.getLeaderboards) {
      return [];
    }

    const leaderboards = await this.sdk.getLeaderboards();
    const response = await leaderboards.getLeaderboardEntries(LEADERBOARD_NAME, {
      quantityTop: limit,
    });

    return response.entries.map((entry) => ({
      rank: entry.rank,
      displayName: entry.player.publicName || "Игрок",
      score: entry.score,
    }));
  }
}

export const yandexSdk = new YandexSdkService();
