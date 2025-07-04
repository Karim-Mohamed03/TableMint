# Translation Setup Guide

## Overview
The SmartMenu now supports dynamic translation to 12 different languages using either Google Translate API or the free MyMemory API as a fallback.

## Supported Languages
- 🇺🇸 English (default)
- 🇪🇸 Spanish (Español)
- 🇫🇷 French (Français)
- 🇩🇪 German (Deutsch)
- 🇮🇹 Italian (Italiano)
- 🇵🇹 Portuguese (Português)
- 🇸🇦 Arabic (العربية) - RTL support
- 🇨🇳 Chinese (中文)
- 🇯🇵 Japanese (日本語)
- 🇰🇷 Korean (한국어)
- 🇷🇺 Russian (Русский)
- 🇮🇳 Hindi (हिन्दी)

## Setup Instructions

### Option 1: Using Google Translate API (Recommended)

1. **Get a Google Translate API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "Cloud Translation API"
   - Go to "Credentials" and create an API key
   - Restrict the API key to only the Translation API for security

2. **Add the API key to your environment:**
   Create a `.env` file in the `client` directory:
   ```
   REACT_APP_GOOGLE_TRANSLATE_API_KEY=your_actual_api_key_here
   ```

3. **Restart your development server:**
   ```bash
   npm start
   ```

### Option 2: Using Free MyMemory API (Default)

If you don't provide a Google Translate API key, the system will automatically use the free MyMemory API:

- **No setup required** - works out of the box
- **Rate limits:** 1000 words/day for anonymous usage
- **Quality:** Good for basic translations

## Features

### Dynamic Translation
- **All content is translated dynamically** - no predefined translations needed
- **Menu items, descriptions, and UI text** are all translated
- **Caching system** prevents repeated API calls for the same text
- **Fallback handling** ensures the app works even if translation fails

### Language Selector
- **Located in the menu header** for easy access
- **Dropdown with flags and language names**
- **Remembers user's language preference**
- **Loading indicator** during translation

### RTL Support
- **Right-to-left languages** (Arabic) are fully supported
- **Automatic text direction** changes based on selected language
- **Proper layout adjustments** for RTL reading

## Usage

1. **Open the SmartMenu**
2. **Click the language selector** in the top-right corner of the header
3. **Select your preferred language**
4. **Wait for translation to complete** (loading indicator will show)
5. **All content will be translated** including menu items and descriptions

## Technical Details

### Translation Flow
1. User selects a language
2. System checks cache for existing translations
3. If not cached, makes API call to translate text
4. Results are cached for future use
5. UI updates with translated content

### Performance Optimizations
- **Intelligent caching** reduces API calls
- **Batch translation** for menu items
- **Lazy loading** of translations
- **Fallback to original text** if translation fails

### Error Handling
- **Graceful degradation** - shows original text if translation fails
- **Multiple API fallbacks** - Google Translate → MyMemory → Original text
- **User feedback** - loading states and error handling

## Troubleshooting

### Translation not working
1. Check browser console for error messages
2. Verify API key is correctly set in `.env` file
3. Ensure API key has Translation API enabled
4. Check rate limits on your API usage

### Slow translations
1. This is normal for first-time translations
2. Subsequent loads will be faster due to caching
3. Consider using Google Translate API for better performance

### Missing translations
1. Some specialized terms might not translate well
2. Very short text might not be translated
3. Check if the source text contains special characters

## Cost Considerations

### Google Translate API
- **Free tier:** $10 credit monthly (≈500,000 characters)
- **Pricing:** $20 per 1M characters after free tier
- **Recommended for production** due to higher quality and reliability

### MyMemory API
- **Free tier:** 1000 words/day
- **Upgrade options available** for higher usage
- **Good for development and testing**

## Development

### Adding New Languages
To add support for new languages, update the `LANGUAGES` object in `client/src/contexts/TranslationContext.js`:

```javascript
export const LANGUAGES = {
  // ... existing languages
  'new_code': { name: 'Language Name', flag: '🏳️' }
};
```

### Customizing Translation Behavior
The translation service can be customized in `client/src/contexts/TranslationContext.js`:
- Modify caching behavior
- Add custom translation rules
- Implement additional API providers 