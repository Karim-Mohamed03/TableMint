import React, { useState } from 'react';
import { useTranslation } from '../contexts/TranslationContext';

const LanguageSelector = ({ position = 'top-right', showLabel = true }) => {
  const { 
    currentLanguage, 
    changeLanguage, 
    getSupportedLanguages, 
    getLanguageName,
    isRTL 
  } = useTranslation();
  
  const [isOpen, setIsOpen] = useState(false);
  const supportedLanguages = getSupportedLanguages();

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Popular languages to show at the top
  const popularLanguages = ['en', 'es', 'fr', 'de', 'ar', 'zh'];
  const otherLanguages = Object.keys(supportedLanguages).filter(
    lang => !popularLanguages.includes(lang)
  );

  const renderLanguageOption = (langCode, isPopular = false) => (
    <button
      key={langCode}
      onClick={() => handleLanguageChange(langCode)}
      className={`language-option ${currentLanguage === langCode ? 'active' : ''} ${isPopular ? 'popular' : ''}`}
      style={{
        direction: isRTL(langCode) ? 'rtl' : 'ltr',
        textAlign: isRTL(langCode) ? 'right' : 'left'
      }}
    >
      <span className="language-flag">
        {getLanguageFlag(langCode)}
      </span>
      <span className="language-name">
        {getLanguageName(langCode)}
      </span>
      {currentLanguage === langCode && (
        <span className="checkmark">✓</span>
      )}
    </button>
  );

  // Simple flag emojis for languages
  const getLanguageFlag = (langCode) => {
    const flags = {
      'en': '🇺🇸',
      'es': '🇪🇸',
      'fr': '🇫🇷',
      'de': '🇩🇪',
      'it': '🇮🇹',
      'pt': '🇵🇹',
      'ru': '🇷🇺',
      'ja': '🇯🇵',
      'ko': '🇰🇷',
      'zh': '🇨🇳',
      'ar': '🇸🇦',
      'hi': '🇮🇳',
      'tr': '🇹🇷',
      'nl': '🇳🇱',
      'sv': '🇸🇪',
      'da': '🇩🇰',
      'no': '🇳🇴',
      'fi': '🇫🇮',
      'pl': '🇵🇱',
      'cs': '🇨🇿'
    };
    return flags[langCode] || '🌐';
  };

  return (
    <div className={`language-selector ${position}`}>
      <button
        onClick={toggleDropdown}
        className="language-toggle"
        aria-label="Change language"
      >
        <span className="current-flag">
          {getLanguageFlag(currentLanguage)}
        </span>
        {showLabel && (
          <span className="current-language">
            {getLanguageName(currentLanguage)}
          </span>
        )}
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <>
          <div className="language-overlay" onClick={() => setIsOpen(false)} />
          <div className="language-dropdown">
            <div className="language-section">
              <div className="section-title">Popular Languages</div>
              {popularLanguages.map(langCode => renderLanguageOption(langCode, true))}
            </div>
            
            {otherLanguages.length > 0 && (
              <div className="language-section">
                <div className="section-title">Other Languages</div>
                {otherLanguages.map(langCode => renderLanguageOption(langCode))}
              </div>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        .language-selector {
          position: relative;
          z-index: 1000;
        }

        .language-selector.top-right {
          position: fixed;
          top: 20px;
          right: 20px;
        }

        .language-selector.header {
          display: inline-block;
        }

        .language-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .language-toggle:hover {
          background: #f8f8f8;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .current-flag {
          font-size: 16px;
        }

        .current-language {
          white-space: nowrap;
        }

        .dropdown-arrow {
          font-size: 10px;
          transition: transform 0.2s ease;
        }

        .dropdown-arrow.open {
          transform: rotate(180deg);
        }

        .language-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999;
        }

        .language-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          min-width: 200px;
          max-width: 250px;
          max-height: 400px;
          overflow-y: auto;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          margin-top: 4px;
          z-index: 1001;
        }

        .language-section {
          padding: 8px 0;
        }

        .language-section:not(:last-child) {
          border-bottom: 1px solid #f0f0f0;
        }

        .section-title {
          padding: 8px 16px 4px;
          font-size: 12px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .language-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: #333;
          transition: background-color 0.2s ease;
        }

        .language-option:hover {
          background: #f8f8f8;
        }

        .language-option.active {
          background: #e3f2fd;
          color: #1976d2;
          font-weight: 500;
        }

        .language-option.popular {
          font-weight: 500;
        }

        .language-flag {
          font-size: 16px;
          flex-shrink: 0;
        }

        .language-name {
          flex: 1;
          text-align: left;
        }

        .checkmark {
          color: #1976d2;
          font-weight: bold;
          flex-shrink: 0;
        }

        /* RTL support */
        .language-dropdown[dir="rtl"] {
          right: auto;
          left: 0;
        }

        .language-option[dir="rtl"] .language-name {
          text-align: right;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .language-selector.top-right {
            top: 10px;
            right: 10px;
          }

          .language-toggle {
            padding: 6px 10px;
            font-size: 13px;
          }

          .language-dropdown {
            min-width: 180px;
            max-height: 300px;
          }

          .language-option {
            padding: 10px 12px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

export default LanguageSelector;