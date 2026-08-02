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
      extraData: '',
      player: {
        publicName: names[i] || `Игрок${i + 1}`,
        uniqueID: `mock-player-${i + 1}`
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
      },

      // В настоящем SDK getPlayer() резолвится и для гостя,
      // авторизацию проверяют отдельно этим методом.
      isAuthorized: () => {
        return true;
      }
    };
  };

  /**
   * Mock Leaderboards API.
   *
   * Имена методов обязаны совпадать с настоящим ysdk.leaderboards:
   * setScore / getEntries. У устаревшего ysdk.getLeaderboards() они назывались
   * setLeaderboardScore / getLeaderboardEntries, и когда mock реализовывал
   * старые имена, ошибка вызова вылезала только в продакшене.
   */
  const createMockLeaderboards = () => {
    const leaderboards = new Map();

    return {
      setScore: async (name, score, extraData) => {
        console.log('[MOCK SDK] leaderboards.setScore called:', name, score, extraData);
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

      getEntries: async (name, options = {}) => {
        console.log('[MOCK SDK] leaderboards.getEntries called:', name, options);
        await new Promise(resolve => setTimeout(resolve, 150));

        const entries = generateMockLeaderboard();
        const limit = options.quantityTop || 5;

        return {
          userRank: 0,
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
      },

      showBannerAdv: async () => {
        console.log('%c[MOCK SDK] 📌 Sticky Banner показывается...', 'color: #9C27B0; font-weight: bold; font-size: 14px;');
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('%c[MOCK SDK] ✅ Sticky Banner показан', 'color: #4CAF50; font-weight: bold;');
      },

      hideBannerAdv: async () => {
        console.log('%c[MOCK SDK] 📌 Sticky Banner скрывается...', 'color: #9C27B0; font-weight: bold;');
        await new Promise(resolve => setTimeout(resolve, 50));
        console.log('%c[MOCK SDK] ✅ Sticky Banner скрыт', 'color: #4CAF50; font-weight: bold;');
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

      // getLeaderboards() устарел и в mock намеренно не реализован:
      // код должен работать только через ysdk.leaderboards.
      leaderboards: leaderboardsInstance,

      isAvailableMethod: async (methodName) => {
        console.log('[MOCK SDK] SDK.isAvailableMethod called:', methodName);
        await new Promise(resolve => setTimeout(resolve, 50));
        return true;
      },

      auth: {
        openAuthDialog: async () => {
          console.log('[MOCK SDK] auth.openAuthDialog called (mock: сразу успех)');
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      },

      environment: {
        i18n: {
          // Для тестирования английского языка измените 'ru' на 'en', 'tr', 'de' и т.д.
          // Любой язык кроме 'ru' переключит игру на английский
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
        },
        GameplayAPI: {
          start: () => {
            console.log('%c[MOCK SDK] ▶️ GameplayAPI.start() вызван - геймплей начат', 'color: #4CAF50; font-weight: bold;');
          },
          stop: () => {
            console.log('%c[MOCK SDK] ⏸️ GameplayAPI.stop() вызван - геймплей остановлен', 'color: #FF9800; font-weight: bold;');
          }
        }
      },

      adv: createMockAdvertisement()
    };
  };

  // Глобальный объект YaGames
  window.YaGames = {
    // Явный признак mock. Раньше окружение определялось по YaGames.toString(),
    // но для объекта это всегда "[object Object]", и mock не распознавался.
    __isMock: true,

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
