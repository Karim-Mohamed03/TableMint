import { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/TranslationContext';

export const useTranslatedText = (originalText, dependencies = []) => {
  const { currentLanguage, translateTextDynamic } = useTranslation();
  const [translatedText, setTranslatedText] = useState(originalText);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const translateText = async () => {
      if (currentLanguage === 'en' || !originalText) {
        setTranslatedText(originalText);
        return;
      }

      setIsLoading(true);
      try {
        const translated = await translateTextDynamic(originalText);
        setTranslatedText(translated);
      } catch (error) {
        console.error('Translation error:', error);
        setTranslatedText(originalText); // Fallback to original
      } finally {
        setIsLoading(false);
      }
    };

    translateText();
  }, [currentLanguage, originalText, translateTextDynamic, ...dependencies]);

  return { translatedText, isLoading };
};

// Component wrapper for translated text
export const TranslatedText = ({ children, className, style, ...props }) => {
  const { translatedText, isLoading } = useTranslatedText(children);
  
  if (isLoading) {
    return (
      <span className={className} style={style} {...props}>
        {children}
      </span>
    );
  }
  
  return (
    <span className={className} style={style} {...props}>
      {translatedText}
    </span>
  );
}; 