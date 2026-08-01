export type Language = 'ru' | 'en';

export interface Translations {
  // Common
  back: string;
  loading: string;

  // Menu Scene
  menuTitle: string;
  menuSpin: string;
  menuCases: string;
  menuGarage: string;
  menuUpgrades: string;
  menuLeaderboard: string;
  menuSettings: string;

  // Settings Scene
  settingsTitle: string;
  settingsSound: string;
  settingsSoundOn: string;
  settingsSoundOff: string;

  // Spin Scene
  spinTitle: string;
  spinButton: string;
  spinBalance: string;
  spinAutoSpin: string;
  spinSpinning: string;
  spinNewCar: string;
  spinDuplicate: string;
  spinSold: string;
  spinHint: string;
  spinStop: string;
  spinSpins: string;
  spinKeep: string;
  spinSell: string;
  spinGarageFull: string;

  // Cases Scene
  casesTitle: string;
  casesBalance: string;
  casesOpen: string;
  casesOpening: string;
  casesPrice: string;
  casesHint: string;
  casesNotEnoughMoney: string;

  // Garage Scene
  garageTitle: string;
  garageEmpty: string;
  garageTotal: string;
  garageCars: string;
  garageValue: string;
  garageTotalValue: string;

  // Upgrades Scene
  upgradesTitle: string;
  upgradesBalance: string;
  upgradesOwned: string;
  upgradesLevel: string;
  upgradesMaxLevel: string;
  upgradesBuy: string;
  upgradesEffect: string;
  upgradesLuckBonus: string;
  upgradesMoneyBonus: string;
  upgradesFreeSpin: string;
  upgradesBonusMoney: string;
  upgradesFreeCase: string;
  upgradesDiscount: string;
  upgradesWatchAd: string;
  upgradesNotEnoughMoney: string;
  upgradesAdUnavailable: string;
  upgradesAdCooldown: string;

  // Upgrade names
  upgradeChanceName: string;
  upgradeMoneyName: string;
  upgradeGarageName: string;
  upgradeAutoSpinName: string;

  // Upgrade descriptions
  upgradeChanceDesc: string;
  upgradeMoneyDesc: string;
  upgradeGarageDesc: string;
  upgradeAutoSpinDesc: string;

  // Leaderboard Scene
  leaderboardTitle: string;
  leaderboardYourScore: string;
  leaderboardUnavailable: string;
  leaderboardEmpty: string;
  leaderboardLoginHint: string;
  leaderboardLoginButton: string;

  // Rarities
  rarityCommon: string;
  rarityUncommon: string;
  rarityRare: string;
  rarityEpic: string;
  rarityLegendary: string;
  rarityExclusive: string;

  // Ad countdown
  adCountdownText: string;
  adCountdownSeconds: string;
}

export const translations: Record<Language, Translations> = {
  ru: {
    // Common
    back: 'Назад',
    loading: 'Загрузка...',

    // Menu Scene
    menuTitle: 'Cars RNG',
    menuSpin: 'Крутить',
    menuCases: 'Кейсы',
    menuGarage: 'Гараж',
    menuUpgrades: 'Улучшения',
    menuLeaderboard: 'Лидерборд',
    menuSettings: 'Настройки',

    // Settings Scene
    settingsTitle: 'Настройки',
    settingsSound: 'Звук',
    settingsSoundOn: 'Включен',
    settingsSoundOff: 'Выключен',

    // Spin Scene
    spinTitle: 'Крутить',
    spinButton: 'Крутить ($500)',
    spinBalance: 'Баланс',
    spinAutoSpin: 'Авто',
    spinSpinning: 'Крутим...',
    spinNewCar: 'Новая машина!',
    spinDuplicate: 'Дубликат',
    spinSold: 'Продано за',
    spinHint: 'Нажмите кнопку, чтобы получить машину.',
    spinStop: 'Стоп',
    spinSpins: 'спинов',
    spinKeep: 'Оставить',
    spinSell: 'Продать',
    spinGarageFull: 'Гараж заполнен',

    // Cases Scene
    casesTitle: 'Кейсы',
    casesBalance: 'Баланс',
    casesOpen: 'Открыть',
    casesOpening: 'Открываем...',
    casesPrice: 'Цена',
    casesHint: 'Открывайте кейсы, чтобы получить случайную машину!',
    casesNotEnoughMoney: 'Недостаточно денег',

    // Garage Scene
    garageTitle: 'Гараж',
    garageEmpty: 'Ваш гараж пуст. Покрутите, чтобы получить машины!',
    garageTotal: 'Всего машин',
    garageCars: 'машин',
    garageValue: 'Стоимость',
    garageTotalValue: 'Общая стоимость',

    // Upgrades Scene
    upgradesTitle: 'Улучшения',
    upgradesBalance: 'Баланс',
    upgradesOwned: 'Куплено',
    upgradesLevel: 'Уровень',
    upgradesMaxLevel: 'МАКС',
    upgradesBuy: 'Купить',
    upgradesEffect: 'Эффект',
    upgradesLuckBonus: 'Бонус удачи',
    upgradesMoneyBonus: 'Бонус денег',
    upgradesFreeSpin: 'Бесплатный спин',
    upgradesBonusMoney: 'Бонусные деньги',
    upgradesFreeCase: 'Бесплатный кейс',
    upgradesDiscount: 'Скидка на улучшения',
    upgradesWatchAd: 'Смотреть рекламу',
    upgradesNotEnoughMoney: 'Недостаточно денег',
    upgradesAdUnavailable: 'Реклама недоступна',
    upgradesAdCooldown: 'Доступно через',

    // Upgrade names
    upgradeChanceName: 'Бонус удачи',
    upgradeMoneyName: 'Бонус денег',
    upgradeGarageName: 'Расширение гаража',
    upgradeAutoSpinName: 'Автоматизация',

    // Upgrade descriptions
    upgradeChanceDesc: 'Увеличивает шанс редких машин',
    upgradeMoneyDesc: 'Увеличивает деньги от продажи',
    upgradeGarageDesc: 'Увеличивает вместимость гаража',
    upgradeAutoSpinDesc: 'Разблокирует автоматический спин',

    // Leaderboard Scene
    leaderboardTitle: 'Лидерборд',
    leaderboardYourScore: 'Ваш счет',
    leaderboardUnavailable: 'Лидерборд сейчас недоступен.',
    leaderboardEmpty: 'В лидерборде пока никого нет.',
    leaderboardLoginHint: 'Войдите в аккаунт, чтобы попасть в лидерборд.',
    leaderboardLoginButton: 'Войти в аккаунт',

    // Rarities
    rarityCommon: 'Обычный',
    rarityUncommon: 'Необычный',
    rarityRare: 'Редкий',
    rarityEpic: 'Эпический',
    rarityLegendary: 'Легендарный',
    rarityExclusive: 'Эксклюзивный',

    // Ad countdown
    adCountdownText: 'Реклама через',
    adCountdownSeconds: 'сек',
  },
  en: {
    // Common
    back: 'Back',
    loading: 'Loading...',

    // Menu Scene
    menuTitle: 'Cars RNG',
    menuSpin: 'Spin',
    menuCases: 'Cases',
    menuGarage: 'Garage',
    menuUpgrades: 'Upgrades',
    menuLeaderboard: 'Leaderboard',
    menuSettings: 'Settings',

    // Settings Scene
    settingsTitle: 'Settings',
    settingsSound: 'Sound',
    settingsSoundOn: 'On',
    settingsSoundOff: 'Off',

    // Spin Scene
    spinTitle: 'Spin',
    spinButton: 'Spin ($500)',
    spinBalance: 'Balance',
    spinAutoSpin: 'Auto',
    spinSpinning: 'Spinning...',
    spinNewCar: 'New Car!',
    spinDuplicate: 'Duplicate',
    spinSold: 'Sold for',
    spinHint: 'Click the button to get a car.',
    spinStop: 'Stop',
    spinSpins: 'spins',
    spinKeep: 'Keep',
    spinSell: 'Sell',
    spinGarageFull: 'Garage is full',

    // Cases Scene
    casesTitle: 'Cases',
    casesBalance: 'Balance',
    casesOpen: 'Open',
    casesOpening: 'Opening...',
    casesPrice: 'Price',
    casesHint: 'Open cases to get a random car!',
    casesNotEnoughMoney: 'Not enough money',

    // Garage Scene
    garageTitle: 'Garage',
    garageEmpty: 'Your garage is empty. Spin to get cars!',
    garageTotal: 'Total cars',
    garageCars: 'cars',
    garageValue: 'Value',
    garageTotalValue: 'Total value',

    // Upgrades Scene
    upgradesTitle: 'Upgrades',
    upgradesBalance: 'Balance',
    upgradesOwned: 'Owned',
    upgradesLevel: 'Level',
    upgradesMaxLevel: 'MAX',
    upgradesBuy: 'Buy',
    upgradesEffect: 'Effect',
    upgradesLuckBonus: 'Luck Bonus',
    upgradesMoneyBonus: 'Money Bonus',
    upgradesFreeSpin: 'Free Spin',
    upgradesBonusMoney: 'Bonus Money',
    upgradesFreeCase: 'Free Case',
    upgradesDiscount: 'Upgrade Discount',
    upgradesWatchAd: 'Watch Ad',
    upgradesNotEnoughMoney: 'Not enough money',
    upgradesAdUnavailable: 'Ad unavailable',
    upgradesAdCooldown: 'Available in',

    // Upgrade names
    upgradeChanceName: 'Luck Bonus',
    upgradeMoneyName: 'Money Bonus',
    upgradeGarageName: 'Garage Expansion',
    upgradeAutoSpinName: 'Automation',

    // Upgrade descriptions
    upgradeChanceDesc: 'Increases chance for rare cars',
    upgradeMoneyDesc: 'Increases money from selling',
    upgradeGarageDesc: 'Increases garage capacity',
    upgradeAutoSpinDesc: 'Unlocks automatic spin',

    // Leaderboard Scene
    leaderboardTitle: 'Leaderboard',
    leaderboardYourScore: 'Your score',
    leaderboardUnavailable: 'Leaderboard is currently unavailable.',
    leaderboardEmpty: 'No one is on the leaderboard yet.',
    leaderboardLoginHint: 'Log in to appear on the leaderboard.',
    leaderboardLoginButton: 'Log In',

    // Rarities
    rarityCommon: 'Common',
    rarityUncommon: 'Uncommon',
    rarityRare: 'Rare',
    rarityEpic: 'Epic',
    rarityLegendary: 'Legendary',
    rarityExclusive: 'Exclusive',

    // Ad countdown
    adCountdownText: 'Ad in',
    adCountdownSeconds: 'sec',
  },
};
