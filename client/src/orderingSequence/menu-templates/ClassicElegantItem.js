import React from 'react';
import { TranslatedText } from '../../hooks/useTranslatedText';

const ClassicElegantItem = ({ 
  item, 
  formatCurrency,
  isAvailable = true,
  onItemClick 
}) => {
  const handleItemClick = (e) => {
    e.stopPropagation();
    onItemClick?.(item);
  };

  // Use the formatCurrency prop if available, otherwise create a simple formatter
  const displayPrice = () => {
    if (formatCurrency && item.price) {
      return formatCurrency(item.price);
    } else if (item.price) {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
      }).format(item.price);
    }
    return 'Price not available';
  };
  
  return (
    <div 
      className="classic-elegant-item"
      onClick={handleItemClick}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '16px 0',
        gap: '16px',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        borderBottom: '1px solid #f3f4f6',
      }}
    >
      {/* Left side - Name and Description */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        textAlign: 'left',
      }}>
        <h3 style={{
          fontSize: '17px',
          fontWeight: 600,
          color: '#111827',
          margin: 0,
          lineHeight: 1.3,
          fontFamily: 'Satoshi, sans-serif',
        }}>
          {item.name || <TranslatedText>Unnamed Item</TranslatedText>}
        </h3>
        {item.description && (
          <p style={{
            fontSize: '15px',
            color: '#6b7280',
            margin: 0,
            lineHeight: 1.4,
            fontFamily: 'Satoshi, sans-serif',
            fontWeight: 400,
          }}>
            {item.description}
          </p>
        )}
      </div>
      
      {/* Right side - Price */}
      {item.price !== undefined && (
        <div style={{
          marginLeft: '16px',
          flexShrink: 0,
        }}>
          <span style={{
            color: '#111827',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            fontSize: '16px',
            fontFamily: 'Satoshi, sans-serif',
          }}>
            {displayPrice()}
          </span>
        </div>
      )}
    </div>
  );
};

export default ClassicElegantItem;
