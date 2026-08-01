import { i18nService } from './i18nService';
import type { Rarity } from '../game/types';

/**
 * Получить перевод редкости машины
 */
export function translateRarity(rarity: string): Rarity {
  const t = i18nService.getTranslations();

  switch (rarity) {
    case 'Обычный':
    case 'Common':
      return t.rarityCommon as Rarity;
    case 'Необычный':
    case 'Uncommon':
      return t.rarityUncommon as Rarity;
    case 'Редкий':
    case 'Rare':
      return t.rarityRare as Rarity;
    case 'Эпический':
    case 'Epic':
      return t.rarityEpic as Rarity;
    case 'Легендарный':
    case 'Legendary':
      return t.rarityLegendary as Rarity;
    case 'Эксклюзивный':
    case 'Exclusive':
      return t.rarityExclusive as Rarity;
    default:
      return rarity as Rarity;
  }
}
