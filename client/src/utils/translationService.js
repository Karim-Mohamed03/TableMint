// Translation service using free Google Translate API via proxy
class TranslationService {
  constructor() {
    // Cache to store translations to avoid repeated API calls
    this.cache = new Map();
    // Supported languages with their display names
    this.supportedLanguages = {
      'en': 'English',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'it': 'Italiano',
      'pt': 'Português',
      'ru': 'Русский',
      'ja': '日本語',
      'ko': '한국어',
      'zh': '中文',
      'ar': 'العربية',
      'hi': 'हिन्दी',
      'tr': 'Türkçe',
      'nl': 'Nederlands',
      'sv': 'Svenska',
      'da': 'Dansk',
      'no': 'Norsk',
      'fi': 'Suomi',
      'pl': 'Polski',
      'cs': 'Čeština'
    };
  }

  // Get the cache key for a translation
  getCacheKey(text, targetLang, sourceLang = 'en') {
    return `${sourceLang}-${targetLang}-${text}`;
  }

  // Translate text using free Google Translate API via proxy
  async translateText(text, targetLang, sourceLang = 'en') {
    // If target language is the same as source, return original text
    if (targetLang === sourceLang) {
      return text;
    }

    // Check if text is marked as untranslatable (wrapped in [[ ]])
    if (text.startsWith('[[') && text.endsWith(']]')) {
      return text.slice(2, -2); // Remove the markers and return original text
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text, targetLang, sourceLang);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Use free translation API via proxy service
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
      
      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Parse the response (Google Translate free API returns array format)
      let translatedText = '';
      if (data && data[0]) {
        translatedText = data[0].map(item => item[0]).join('');
      }

      // Cache the result
      this.cache.set(cacheKey, translatedText);
      
      return translatedText || text; // Fallback to original text if translation fails
    } catch (error) {
      console.error('Translation error:', error);
      // Return original text if translation fails
      return text;
    }
  }

  // Translate multiple texts in batch
  async translateBatch(texts, targetLang, sourceLang = 'en') {
    const promises = texts.map(text => this.translateText(text, targetLang, sourceLang));
    return await Promise.all(promises);
  }

  // Get list of supported languages
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  // Get language name by code
  getLanguageName(langCode) {
    return this.supportedLanguages[langCode] || langCode;
  }

  // Clear translation cache
  clearCache() {
    this.cache.clear();
  }

  // Detect if text contains mostly non-Latin characters (for RTL languages)
  isRTLLanguage(langCode) {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(langCode);
  }
}

// Create and export a singleton instance
const translationService = new TranslationService();
export default translationService;