/**
 * Mock Yandex Games SDK для локальной разработки
 * Имитирует полный API Yandex Games включая рекламу
 */

(function() {
  'use strict';

  console.log('[MOCK SDK] Yandex Games SDK mock загружен');

  // Генерация случайных данных для лидербордов
  const generateMockLeaderboard = () => {
    const names = ['Игрок1', 'ProGamer', 'Racer777', 'CarLover', 'SpeedKing', 'WheelMaster', 'TurboFan', 'DriftKing', 'NitroBoost', 'RoadRunner'];
    return Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      score: Math.floor(Math.random() * 1000000) + 10000,
      player: {
        publicName: names[i] || `Игрок${i + 1}`
      }
    })).sort((a, b) => b.score - a.score).map((entry, i) => ({ ...entry, rank: i + 1 }));
  };

  // Mock Player API
  const createMockPlayer = () => {
    let playerData = {};

    return {
      getData: async (keys) => {
        console.log('[MOCK SDK] Player.getData called with keys:', keys);
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!keys || keys.length === 0) {
          return playerData;
        }

        const result = {};
        keys.forEach(key => {
          if (playerData.hasOwnProperty(key)) {
            result[key] = playerData[key];
          }
        });
        return result;
      },

      setData: async (data, flush = false) => {
        console.log('[MOCK SDK] Player.setData called:', data, 'flush:', flush);
        await new Promise(resolve => setTimeout(resolve, 50));
        playerData = { ...playerData, ...data };
        console.log('[MOCK SDK] Player data saved:', playerData);
        return;
      },

      getUniqueID: () => {
        return 'mock-player-' + Math.random().toString(36).substr(2, 9);
      },

      getName: () => {
        return 'Dev Player';
      }
    };
  };

  // Mock Leaderboards API
  const createMockLeaderboards = () => {
    const leaderboards = new Map();

    return {
      setLeaderboardScore: async (name, score) => {
        console.log('[MOCK SDK] Leaderboards.setLeaderboardScore called:', name, score);
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!leaderboards.has(name)) {
          leaderboards.set(name, []);
        }

        const board = leaderboards.get(name);
        board.push({ score, timestamp: Date.now() });
        board.sort((a, b) => b.score - a.score);

        console.log('[MOCK SDK] Score saved to leaderboard:', name);
        return;
      },

      getLeaderboardEntries: async (name, options = {}) => {
        console.log('[MOCK SDK] Leaderboards.getLeaderboardEntries called:', name, options);
        await new Promise(resolve => setTimeout(resolve, 150));

        const entries = generateMockLeaderboard();
        const limit = options.quantityTop || 10;

        return {
          entries: entries.slice(0, limit)
        };
      }
    };
  };

  // Mock Advertisement API
  const createMockAdvertisement = () => {
    return {
      showFullscreenAdv: (options = {}) => {
        console.log('%c[MOCK SDK] 📺 Fullscreen Ad показывается...', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
        console.log('[MOCK SDK] Fullscreen options:', options);

        // Симуляция показа рекламы (1 секунда)
        setTimeout(() => {
          const wasShown = Math.random() > 0.1; // 90% успешных показов

          if (wasShown) {
            console.log('%c[MOCK SDK] ✅ Fullscreen Ad закрыта пользователем', 'color: #4CAF50; font-weight: bold;');
          } else {
            console.log('%c[MOCK SDK] ❌ Fullscreen Ad не показана (ошибка или блокировщик)', 'color: #FF9800; font-weight: bold;');
          }

          if (options.callbacks?.onClose) {
            options.callbacks.onClose(wasShown);
          }
        }, 1000);
      },

      showRewardedVideo: (options = {}) => {
        console.log('%c[MOCK SDK] 🎁 Rewarded Video показывается...', 'color: #2196F3; font-weight: bold; font-size: 14px;');
        console.log('[MOCK SDK] Rewarded options:', options);

        // Симуляция просмотра рекламы (2 секунды)
        setTimeout(() => {
          const wasWatched = Math.random() > 0.05; // 95% досмотров

          if (wasWatched) {
            console.log('%c[MOCK SDK] ✅ Rewarded Video просмотрена! Награда выдана', 'color: #4CAF50; font-weight: bold;');

            if (options.callbacks?.onRewarded) {
              options.callbacks.onRewarded();
            }
          } else {
            console.log('%c[MOCK SDK] ⚠️ Rewarded Video закрыта досрочно (награда не выдана)', 'color: #FF9800; font-weight: bold;');
          }

          if (options.callbacks?.onClose) {
            options.callbacks.onClose();
          }
        }, 2000);
      }
    };
  };

  // Mock SDK Instance
  const createMockSdk = () => {
    const leaderboardsInstance = createMockLeaderboards();

    return {
      getPlayer: async (options = {}) => {
        console.log('[MOCK SDK] SDK.getPlayer called with options:', options);
        await new Promise(resolve => setTimeout(resolve, 100));
        return createMockPlayer();
      },

      getLeaderboards: async () => {
        console.log('[MOCK SDK] SDK.getLeaderboards called (deprecated)');
        await new Promise(resolve => setTimeout(resolve, 100));
        return leaderboardsInstance;
      },

      leaderboards: leaderboardsInstance,

      environment: {
        i18n: {
          lang: 'ru',
          tld: 'ru'
        },
        app: {
          id: 'mock-app-id'
        },
        browser: {
          lang: 'ru-RU'
        },
        payload: ''
      },

      features: {
        LoadingAPI: {
          ready: () => {
            console.log('%c[MOCK SDK] ✅ LoadingAPI.ready() вызван - игра готова к показу', 'color: #4CAF50; font-weight: bold;');
          }
        }
      },

      adv: createMockAdvertisement()
    };
  };

  // Глобальный объект YaGames
  window.YaGames = {
    init: async () => {
      console.log('%c[MOCK SDK] 🚀 YaGames.init() вызван - инициализация mock SDK...', 'color: #9C27B0; font-weight: bold; font-size: 16px;');
      console.log('[MOCK SDK] Это mock версия SDK для локальной разработки');
      console.log('[MOCK SDK] В production окружении Yandex Games будет использоваться настоящий SDK');

      // Симуляция задержки инициализации
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log('%c[MOCK SDK] ✅ SDK инициализирован успешно', 'color: #4CAF50; font-weight: bold;');

      return createMockSdk();
    }
  };

  console.log('[MOCK SDK] window.YaGames доступен');
})();
