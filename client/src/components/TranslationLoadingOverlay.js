import React from 'react';
import { useTranslation } from '../contexts/TranslationContext';

const TranslationLoadingOverlay = () => {
  const { isTranslating, translationProgress, getLanguageName, currentLanguage } = useTranslation();

  if (!isTranslating) return null;

  const progressPercentage = translationProgress.total > 0 
    ? (translationProgress.current / translationProgress.total) * 100 
    : 0;

  return (
    <div className="translation-overlay">
      <div className="translation-modal">
        <div className="translation-content">
          <div className="translation-spinner">
            <div className="spinner"></div>
          </div>
          
          <h3>Translating to {getLanguageName(currentLanguage)}</h3>
          <p>Please wait while we translate the menu...</p>
          
          {translationProgress.total > 0 && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="progress-text">
                {translationProgress.current} of {translationProgress.total} items
              </span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .translation-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
        }

        .translation-modal {
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 320px;
          width: 90%;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          animation: fadeInScale 0.3s ease-out;
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .translation-content h3 {
          margin: 16px 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .translation-content p {
          margin: 0 0 20px 0;
          color: #666;
          font-size: 14px;
        }

        .translation-spinner {
          margin-bottom: 20px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #2196F3;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .progress-container {
          margin-top: 16px;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: #f0f0f0;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #2196F3, #21CBF3);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 12px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default TranslationLoadingOverlay;