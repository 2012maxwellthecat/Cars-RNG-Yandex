# Internationalization (i18n) System

## Overview

The game now includes automatic language detection via Yandex Games SDK. The language is set based on the player's location:
- **Russian (ru)**: For players from Russia
- **English (en)**: For all other countries

## Architecture

### Files Added

1. **`src/i18n/translations.ts`**
   - Contains all UI text translations
   - Structured by scene and component
   - Type-safe with TypeScript interfaces

2. **`src/i18n/i18nService.ts`**
   - Singleton service managing current language
   - Initialized from Yandex SDK `environment.i18n.lang`
   - Provides translations to all scenes

3. **`src/i18n/rarityTranslations.ts`**
   - Helper function for car rarity translations
   - Maps both Russian and English rarity names

### Integration Points

#### Yandex SDK Integration
`src/services/yandexSdk.ts` - Language detection during SDK initialization:
```typescript
if (this.sdk.environment?.i18n?.lang) {
  this.detectedLanguage = this.sdk.environment.i18n.lang;
  i18nService.setLanguageFromSDK(this.detectedLanguage);
}
```

#### Ad Countdown Overlay
`src/ui/adWarningOverlay.ts` - Translated countdown before ads:
- Russian: "Реклама через 3 сек"
- English: "Ad in 3 sec"

#### Scenes Updated
- **MenuScene**: Main menu buttons and stats
- **LeaderboardScene**: Leaderboard UI and login prompt
- **Cars Data**: Car rarities translated dynamically

## Usage

### In Scenes
```typescript
import { i18nService } from "../i18n/i18nService";

const t = i18nService.getTranslations();
addTextButton(this, x, y, t.menuSpin, callback);
```

### Adding New Translations

1. Add key to `Translations` interface in `translations.ts`
2. Add translation for both `ru` and `en` in the `translations` object
3. Use via `i18nService.getTranslations()` or `i18nService.t(key)`

### Quick Checks
```typescript
i18nService.isRussian()  // true for Russian language
i18nService.getLanguage()  // 'ru' | 'en'
```

## Remaining Work

The following scenes still have hardcoded Russian text and need translation:
- **SpinScene**: Spin button, balance, hints
- **CasesScene**: Case opening UI
- **GarageScene**: Empty garage message, stats
- **UpgradesScene**: Upgrade names, descriptions, buttons

To complete the translation:
1. Add missing keys to `Translations` interface
2. Provide both Russian and English text
3. Replace hardcoded strings in scenes with `t.keyName`

## Testing

**Local Development:**
- Uses mock SDK from `public/sdk.js`
- Mock SDK returns `'ru'` by default
- Can be changed in mock SDK file for testing English

**Production:**
- Language auto-detected from Yandex Games SDK
- Russia → Russian, all other countries → English
- Fallback to Russian if detection fails
