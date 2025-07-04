import React, { createContext, useContext, useState, useEffect } from 'react';

const TranslationContext = createContext();

// Language options with their codes
export const LANGUAGES = {
  'en': { name: 'English', flag: '🇺🇸' },
  'es': { name: 'Español', flag: '🇪🇸' },
  'fr': { name: 'Français', flag: '🇫🇷' },
  'de': { name: 'Deutsch', flag: '🇩🇪' },
  'it': { name: 'Italiano', flag: '🇮🇹' },
  'pt': { name: 'Português', flag: '🇵🇹' },
  'ar': { name: 'العربية', flag: '🇸🇦' },
  'zh': { name: '中文', flag: '🇨🇳' },
  'ja': { name: '日本語', flag: '🇯🇵' },
  'ko': { name: '한국어', flag: '🇰🇷' },
  'ru': { name: 'Русский', flag: '🇷🇺' },
  'hi': { name: 'हिन्दी', flag: '🇮🇳' }
};

// Translation cache to avoid repeated API calls
const translationCache = new Map();

class TranslationService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY;
    this.baseUrl = 'https://translation.googleapis.com/language/translate/v2';
  }

  async translateText(text, targetLanguage, sourceLanguage = 'en') {
    if (!text || targetLanguage === sourceLanguage) {
      return text;
    }

    // Create cache key
    const cacheKey = `${text}:${sourceLanguage}:${targetLanguage}`;
    
    // Check cache first
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey);
    }

    try {
      // If no API key, use a free alternative service (MyMemory)
      if (!this.apiKey) {
        return await this.translateWithMyMemory(text, targetLanguage, sourceLanguage);
      }

      // Use Google Translate API
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLanguage,
          target: targetLanguage,
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      const translatedText = data.data.translations[0].translatedText;
      
      // Cache the result
      translationCache.set(cacheKey, translatedText);
      
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback to MyMemory
      return await this.translateWithMyMemory(text, targetLanguage, sourceLanguage);
    }
  }

  async translateWithMyMemory(text, targetLanguage, sourceLanguage = 'en') {
    const cacheKey = `${text}:${sourceLanguage}:${targetLanguage}`;
    
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLanguage}|${targetLanguage}`
      );
      
      const data = await response.json();
      
      if (data.responseStatus === 200) {
        const translatedText = data.responseData.translatedText;
        translationCache.set(cacheKey, translatedText);
        return translatedText;
      }
      
      return text; // Fallback to original text
    } catch (error) {
      console.error('MyMemory translation error:', error);
      return text; // Fallback to original text
    }
  }

  async translateBatch(texts, targetLanguage, sourceLanguage = 'en') {
    const results = await Promise.all(
      texts.map(text => this.translateText(text, targetLanguage, sourceLanguage))
    );
    return results;
  }
}

const translationService = new TranslationService();

export const TranslationProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [translatedContent, setTranslatedContent] = useState(new Map());

  const translateContent = async (content, targetLanguage) => {
    if (targetLanguage === 'en') {
      setTranslatedContent(new Map());
      return;
    }

    setIsLoading(true);
    
    try {
      const contentMap = new Map();
      
      // Translate all content
      for (const [key, value] of Object.entries(content)) {
        if (typeof value === 'string') {
          const translated = await translationService.translateText(value, targetLanguage);
          contentMap.set(key, translated);
        } else if (typeof value === 'object' && value !== null) {
          // Handle nested objects (like menu items)
          const translatedObj = {};
          for (const [nestedKey, nestedValue] of Object.entries(value)) {
            if (typeof nestedValue === 'string') {
              translatedObj[nestedKey] = await translationService.translateText(nestedValue, targetLanguage);
            } else {
              translatedObj[nestedKey] = nestedValue;
            }
          }
          contentMap.set(key, translatedObj);
        }
      }
      
      setTranslatedContent(contentMap);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = (languageCode) => {
    setCurrentLanguage(languageCode);
  };

  const getTranslatedText = (originalText, key = null) => {
    if (currentLanguage === 'en') {
      return originalText;
    }

    const cacheKey = key || originalText;
    return translatedContent.get(cacheKey) || originalText;
  };

  const translateTextDynamic = async (text) => {
    if (currentLanguage === 'en') {
      return text;
    }
    
    return await translationService.translateText(text, currentLanguage);
  };

  const value = {
    currentLanguage,
    changeLanguage,
    isLoading,
    translateContent,
    getTranslatedText,
    translateTextDynamic,
    isRTL: () => ['ar', 'he', 'fa', 'ur'].includes(currentLanguage)
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}; 