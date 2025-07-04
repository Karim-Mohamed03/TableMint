import React, { useState } from 'react';
import { TranslatedText } from '../../hooks/useTranslatedText';

const ModernMinimalistItem = ({
  item,
  formatCurrency,
  isAvailable = true,
  soldOutAtLocation = false,
  currentQuantity = 0,
  onIncrement,
  onDecrement,
  onItemClick,
  isLastInCategory
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    console.log('✅ Image loaded successfully:', item.image);
    setImageError(false);
  };

  const handleImageError = (e) => {
    console.error('❌ Image failed to load:', item.image);
    setImageError(true);
  };

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
      className="menu-item-card"
      onClick={handleItemClick}
      style={{
        background: 'white',
        border: 'none',
        transition: 'background-color 0.2s ease',
        display: 'flex',
        alignItems: 'flex-start',
        padding: '10px 0px',
        paddingRight: '30px',
        position: 'relative',
        gap: '16px',
        fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        cursor: 'pointer',
      }}
    >
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        alignItems: 'flex-start'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          width: '100%'
        }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#000',
            margin: 0,
            lineHeight: 1.2,
            fontFamily: 'Satoshi, sans-serif'
          }}>
            {item.name || <TranslatedText>Unnamed Item</TranslatedText>}
          </h3>

          {item.description && (
            <p style={{
              color: 'rgb(112, 112, 112)',
              fontSize: '14px',
              lineHeight: 1.4,
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontFamily: 'Satoshi, sans-serif',
              fontWeight: 400
            }}>
              {item.description}
            </p>
          )}

          <div style={{
            fontSize: '14px',
            fontWeight: 400,
            color: 'rgb(112, 112, 112)',
            marginTop: '4px',
            fontFamily: 'Satoshi, sans-serif'
          }}>
            {displayPrice()}
          </div>
        </div>
      </div>

      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#f7fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0
      }}>
        {item.image && !imageError ? (
          <img
            src={item.image}
            alt={item.name || 'Menu item'}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            loading="lazy"
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f7fafc',
            color: '#a0aec0',
            fontSize: '12px',
            fontFamily: 'Satoshi, sans-serif',
            textAlign: 'center'
          }}>
            {imageError ? (
              <TranslatedText>Image not available</TranslatedText>
            ) : (
              <TranslatedText>No image</TranslatedText>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernMinimalistItem;