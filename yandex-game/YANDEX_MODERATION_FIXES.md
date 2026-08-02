# Yandex Games Moderation Fixes

## Must Fix Before Submission

1. **Guest-first authorization flow** - Done
   - Startup player lookup now uses `getPlayer({ scopes: false })`.
   - Do not request player scopes on game startup.
   - Use `auth.openAuthDialog()` only after an explicit player action, e.g. the leaderboard login button.
   - Keep the game playable without authorization.

2. **GameplayAPI lifecycle** - Done
   - `GameplayAPI.start()` is now reported only from active gameplay (`SpinScene`) or after returning to active gameplay.
   - `GameplayAPI.stop()` is now reported when entering menu/cases/garage/upgrades/settings/leaderboard, losing visibility, or showing ads.
   - Removed the direct `GameplayAPI.start()` call from every `MenuScene` recreation.
   - Debug-panel routes remain supported: gamepad start/stop and `game_api_pause` / `game_api_resume`.

3. **Rewarded ad copy clarity** - Done
   - Bonus-money rewarded button now clearly says the reward requires an ad.
   - RU: `Смотреть рекламу за 50 000$`.
   - EN: `Watch Ad for $50,000`.

4. **LoadingAPI.ready() one-shot guard** - Done
   - `LoadingAPI.ready()` now goes through `reportLoadingReady()` with an internal one-shot guard.
   - It is still called after the first fully interactive `MenuScene` UI is rendered.
   - Returning to `MenuScene` no longer calls `LoadingAPI.ready()` again.

5. **Promo/material rights check**
   - Confirm all car photos and promotional assets are owned/licensed for use.
   - Replace any uncertain third-party images before submission.

6. **Manual platform QA before submit**
   - Test desktop and mobile only if those are selected in the Yandex draft.
   - Do not select TV unless remote-control navigation is implemented.
   - Verify portrait/landscape layouts, focus loss, app switching, network throttling, cloud-data clear, ads, and leaderboard auth.

## Already Fixed / Verified

- Game pauses and resumes on `visibilitychange`, `pageshow`, `blur/focus`, `game_api_pause/resume`, and `GameplayAPI.start/stop`.
- Context menu is blocked over the game.
- Local mock SDK supports `sdk.on/off` and emits gameplay pause/resume events.
- Unused vulnerable `phaser3-rex-plugins` dependency was removed.
- `npm audit --omit=dev` reports `0 vulnerabilities`.
- Production SDK path uses the real Yandex Games SDK outside local/private hosts.
