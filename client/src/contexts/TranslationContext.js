import React, { createContext, useContext, useState, useEffect } from 'react';
import translationService from '../utils/translationService';

const TranslationContext = createContext();

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export const TranslationProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState(new Map());
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });

  // Load saved language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred_language');
    if (savedLanguage && translationService.getSupportedLanguages()[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  // Save language preference when it changes
  useEffect(() => {
    localStorage.setItem('preferred_language', currentLanguage);
  }, [currentLanguage]);

  // Function to translate text with caching and progress tracking
  const translateText = async (text, targetLang = currentLanguage) => {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return text;
    }

    // Return original text if target language is English
    if (targetLang === 'en') {
      return text;
    }

    const cacheKey = `${targetLang}-${text}`;
    
    // Check local cache first
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey);
    }

    try {
      setIsTranslating(true);
      const translatedText = await translationService.translateText(text, targetLang);
      
      // Update local cache
      setTranslationCache(prev => new Map(prev).set(cacheKey, translatedText));
      
      return translatedText;
    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Return original text on error
    } finally {
      setIsTranslating(false);
    }
  };

  // Function to translate multiple texts with progress tracking
  const translateBatch = async (texts, targetLang = currentLanguage) => {
    if (targetLang === 'en') {
      return texts;
    }

    try {
      setIsTranslating(true);
      setTranslationProgress({ current: 0, total: texts.length });

      const translatedTexts = [];
      
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        setTranslationProgress({ current: i + 1, total: texts.length });
        
        const translatedText = await translateText(text, targetLang);
        translatedTexts.push(translatedText);
        
        // Small delay to prevent API rate limiting
        if (i < texts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      return translatedTexts;
    } catch (error) {
      console.error('Batch translation failed:', error);
      return texts; // Return original texts on error
    } finally {
      setIsTranslating(false);
      setTranslationProgress({ current: 0, total: 0 });
    }
  };

  // Function to change language with loading state
  const changeLanguage = async (languageCode) => {
    if (translationService.getSupportedLanguages()[languageCode]) {
      setIsTranslating(true);
      setCurrentLanguage(languageCode);
      
      // Small delay to allow UI to update
      setTimeout(() => {
        setIsTranslating(false);
      }, 500);
    }
  };

  // Get supported languages
  const getSupportedLanguages = () => {
    return translationService.getSupportedLanguages();
  };

  // Get language name
  const getLanguageName = (langCode) => {
    return translationService.getLanguageName(langCode);
  };

  // Check if language is RTL
  const isRTL = (langCode = currentLanguage) => {
    return translationService.isRTLLanguage(langCode);
  };

  // Clear translation cache
  const clearCache = () => {
    setTranslationCache(new Map());
    translationService.clearCache();
  };

  const value = {
    currentLanguage,
    isTranslating,
    translationProgress,
    translateText,
    translateBatch,
    changeLanguage,
    getSupportedLanguages,
    getLanguageName,
    isRTL,
    clearCache
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};