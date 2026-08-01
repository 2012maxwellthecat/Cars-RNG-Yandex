/**
 * Определение окружения и режима работы приложения
 */

export interface EnvironmentInfo {
  mode: 'development' | 'production';
  sdkAvailable: boolean;
  isRealYandexEnvironment: boolean;
  shouldUseMockAds: boolean;
  features: {
    ads: boolean;
    leaderboards: boolean;
    cloudSaves: boolean;
  };
}

/**
 * Определяет текущее окружение приложения
 * @returns Информация об окружении
 */
export function detectEnvironment(): EnvironmentInfo {
  const isDev = import.meta.env.DEV;
  const isProd = import.meta.env.PROD;
  const sdkAvailable = typeof window !== 'undefined' && !!window.YaGames;

  // Проверяем, является ли SDK настоящим (не mock)
  // Mock SDK содержит строку '[MOCK SDK]' в логах и специфичную реализацию
  const hasRealSDK = sdkAvailable && !isMockSDK();

  return {
    mode: isDev ? 'development' : 'production',
    sdkAvailable,
    isRealYandexEnvironment: hasRealSDK && isProd,
    shouldUseMockAds: isDev || !hasRealSDK,
    features: {
      ads: sdkAvailable, // Реклама доступна всегда (mock или real)
      leaderboards: hasRealSDK, // Лидерборды только с настоящим SDK
      cloudSaves: hasRealSDK, // Облачные сохранения только с настоящим SDK
    },
  };
}

/**
 * Проверяет, является ли текущий SDK mock версией
 * @returns true если используется mock SDK
 */
function isMockSDK(): boolean {
  if (typeof window === 'undefined' || !window.YaGames) {
    return false;
  }

  // Mock помечает себя флагом (см. public/sdk.js).
  // Прежняя проверка через YaGames.toString() не работала: для объекта она
  // всегда даёт "[object Object]", поэтому mock считался настоящим SDK.
  return window.YaGames.__isMock === true;
}

/**
 * Логирует информацию об окружении в консоль
 * Используется при инициализации приложения
 */
export function logEnvironmentInfo(): void {
  const env = detectEnvironment();

  console.log('=================================');
  console.log('🌍 Environment Info');
  console.log('=================================');
  console.log(`Mode: ${env.mode}`);
  console.log(`SDK Available: ${env.sdkAvailable}`);
  console.log(`Real Yandex Environment: ${env.isRealYandexEnvironment}`);
  console.log(`Using Mock Ads: ${env.shouldUseMockAds}`);
  console.log('Features:');
  console.log(`  - Ads: ${env.features.ads ? '✅' : '❌'}`);
  console.log(`  - Leaderboards: ${env.features.leaderboards ? '✅' : '❌'}`);
  console.log(`  - Cloud Saves: ${env.features.cloudSaves ? '✅' : '❌'}`);
  console.log('=================================');
}

export const ENV = detectEnvironment();
