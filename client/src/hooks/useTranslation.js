import { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/TranslationContext';

// Custom hook for translating text with automatic updates when language changes
export const useTranslatedText = (text, dependencies = []) => {
  const { translateText, currentLanguage } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      setTranslatedText(text);
      return;
    }

    const translateAsync = async () => {
      setIsLoading(true);
      try {
        const translated = await translateText(text);
        setTranslatedText(translated);
      } catch (error) {
        console.error('Translation failed:', error);
        setTranslatedText(text); // Fallback to original text
      } finally {
        setIsLoading(false);
      }
    };

    translateAsync();
  }, [text, currentLanguage, translateText, ...dependencies]);

  return { translatedText, isLoading };
};

// Custom hook for translating multiple texts
export const useTranslatedTexts = (texts, dependencies = []) => {
  const { translateBatch, currentLanguage } = useTranslation();
  const [translatedTexts, setTranslatedTexts] = useState(texts);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!Array.isArray(texts) || texts.length === 0) {
      setTranslatedTexts(texts);
      return;
    }

    const translateAsync = async () => {
      setIsLoading(true);
      try {
        const translated = await translateBatch(texts);
        setTranslatedTexts(translated);
      } catch (error) {
        console.error('Batch translation failed:', error);
        setTranslatedTexts(texts); // Fallback to original texts
      } finally {
        setIsLoading(false);
      }
    };

    translateAsync();
  }, [JSON.stringify(texts), currentLanguage, translateBatch, ...dependencies]);

  return { translatedTexts, isLoading };
};

// Component wrapper for translating text inline
export const TranslatedText = ({ 
  children, 
  text, 
  fallback = '', 
  className = '',
  style = {},
  tag = 'span' 
}) => {
  const textToTranslate = text || children;
  const { translatedText, isLoading } = useTranslatedText(textToTranslate);
  
  const Tag = tag;
  const displayText = translatedText || fallback;

  return (
    <Tag 
      className={`${className} ${isLoading ? 'translating' : ''}`}
      style={style}
    >
      {displayText}
      {isLoading && (
        <span className="translation-loading" style={{ marginLeft: '4px', opacity: 0.5 }}>
          ⟳
        </span>
      )}
    </Tag>
  );
};