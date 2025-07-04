import React, { useState, useRef, useEffect } from 'react';
import { useTranslation, LANGUAGES } from '../contexts/TranslationContext';

const LanguageSelector = () => {
  const { currentLanguage, changeLanguage, isLoading } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };

  const currentLang = LANGUAGES[currentLanguage];

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        className={`language-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <span className="flag">{currentLang.flag}</span>
        <span className="language-name">{currentLang.name}</span>
        <svg 
          className={`chevron ${isOpen ? 'rotated' : ''}`} 
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none"
        >
          <path 
            d="M4 6L8 10L12 6" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="language-dropdown">
          {Object.entries(LANGUAGES).map(([code, lang]) => (
            <button
              key={code}
              className={`language-option ${code === currentLanguage ? 'active' : ''}`}
              onClick={() => handleLanguageChange(code)}
            >
              <span className="flag">{lang.flag}</span>
              <span className="language-name">{lang.name}</span>
              {code === currentLanguage && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path 
                    d="M13.5 4.5L6 12L2.5 8.5" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="translation-loading">
          <div className="loading-spinner"></div>
        </div>
      )}

      <style jsx>{`
        .language-selector {
          position: relative;
          display: inline-block;
        }

        .language-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #333;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 120px;
          justify-content: space-between;
        }

        .language-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .language-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .language-button.open {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .flag {
          font-size: 16px;
          line-height: 1;
        }

        .language-name {
          flex: 1;
          text-align: left;
          font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .chevron {
          transition: transform 0.2s ease;
          color: #666;
        }

        .chevron.rotated {
          transform: rotate(180deg);
        }

        .language-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          z-index: 1000;
          margin-top: 4px;
          max-height: 300px;
          overflow-y: auto;
        }

        .language-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.2s ease;
          font-size: 14px;
          color: #333;
        }

        .language-option:hover {
          background-color: #f8fafc;
        }

        .language-option.active {
          background-color: #f0f9ff;
          color: #0369a1;
        }

        .language-option .flag {
          font-size: 16px;
        }

        .language-option .language-name {
          flex: 1;
          font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .translation-loading {
          position: absolute;
          top: 50%;
          right: 8px;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* RTL Support */
        [dir="rtl"] .language-name {
          text-align: right;
        }

        [dir="rtl"] .language-dropdown {
          left: auto;
          right: 0;
        }
      `}</style>
    </div>
  );
};

export default LanguageSelector; 