import React from 'react';
import { TranslatedText } from '../../hooks/useTranslation';

const ClassicElegantItem = ({ 
  item, 
  useTranslation = false // Flag to enable/disable translation
}) => {
  const formatPrice = (price) => {
    if (!price) return '$0.00';
    const amount = typeof price === 'number' ? price / 100 : 0;
    return `$${amount.toFixed(2)}`;
  };

  // Text content with conditional translation
  const renderText = (text, fallback = '') => {
    if (!text) return fallback;
    return useTranslation ? (
      <TranslatedText>{text}</TranslatedText>
    ) : text;
  };
  
  return (
    <div 
      className="flex justify-between items-start py-3 gap-4 transition-colors duration-200 cursor-pointer"
      style={{
        fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
      }}
    >
      {/* Left side - Name and Description */}
      <div className="flex-1 min-w-0">
        <h3 
          className="text-base font-semibold text-gray-900 mb-1"
          style={{
            fontFamily: 'Satoshi, sans-serif',
            fontSize: '16px',
            lineHeight: '1.3',
            fontWeight: 600
          }}
        >
          {renderText(item.name, 'Unnamed Item')}
        </h3>
        {item.description && (
          <p 
            className="text-gray-600 text-sm"
            style={{
              fontFamily: 'Satoshi, sans-serif',
              fontSize: '14px',
              color: 'rgb(112, 112, 112)',
              lineHeight: '1.4',
              marginTop: '4px'
            }}
          >
            {renderText(item.description)}
          </p>
        )}
      </div>
      
      {/* Right side - Price */}
      {item.price !== undefined && (
        <div className="ml-4">
          <span className="text-gray-900 font-medium whitespace-nowrap text-base">
            {formatPrice(item.price)}
          </span>
        </div>
      )}
    </div>
  );
};

export default ClassicElegantItem;
