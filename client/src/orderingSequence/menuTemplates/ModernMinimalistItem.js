import React, { useState } from 'react';
import ItemDetailModal from '../../components/menu/ItemDetailModal';
import { TranslatedText } from '../../hooks/useTranslation';

const ModernMinimalistItem = ({
  item,
  formatCurrency,
  isAvailable = true,
  soldOutAtLocation = false,
  currentQuantity = 0,
  onIncrement,
  onDecrement,
  onItemClick,
  isLastInCategory,
  useTranslation = false // Flag to enable/disable translation
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageStatus, setImageStatus] = useState('loading'); // 'loading', 'loaded', 'error'

  const handleImageLoad = () => {
    console.log('✅ Image loaded successfully:', item.image);
    setImageStatus('loaded');
  };

  const handleImageError = (e) => {
    console.error('❌ Image failed to load:', item.image, e);
    setImageStatus('error');
  };

  const handleItemClick = (e) => {
    e.stopPropagation();
    setIsModalOpen(true);
    onItemClick?.(item);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const itemData = item.item_data || {};
  const variation = itemData?.variations?.[0];
  const price = variation?.item_variation_data?.price_money || {
    amount: item.price * 100,
    currency: 'USD'
  };

  const formatPrice = (amount, currency = 'USD') => {
    if (!amount) return '$0.00';
    const value = typeof amount === 'number' ? amount / 100 : 0;
    return `$${value.toFixed(2)}`;
  };

  // Text content with conditional translation
  const renderText = (text, fallback = '') => {
    if (!text) return fallback;
    return useTranslation ? (
      <TranslatedText>{text}</TranslatedText>
    ) : text;
  };

  // Debug logging
  console.log('ModernMinimalistItem render:', {
    itemName: item.name,
    imageUrl: item.image,
    imageStatus,
    hasImage: !!item.image,
    useTranslation
  });

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
        paddingLeft: '8px',
        paddingRight: '28px',
        position: 'relative',
        gap: '16px',
        fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        cursor: 'pointer'
        // borderBottom: isLastInCategory ? 'none' : '1px solid #eee'
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
            {renderText(item.name, 'Unnamed Item')}
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
              {renderText(item.description)}
            </p>
          )}

          <div style={{
            fontSize: '14px',
            fontWeight: 400,
            color: 'rgb(112, 112, 112)',
            marginTop: '4px',
            fontFamily: 'Satoshi, sans-serif'
          }}>
            {formatPrice(price.amount, price.currency)}
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
        {item.image ? (
          <>
            {/* Always render the image, but control visibility */}
            <img
              src={item.image}
              alt={item.name || 'Menu item'}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: imageStatus === 'loaded' ? 'block' : 'none'
              }}
              loading="lazy"
            />
            
            {/* Show loading or error state */}
            {imageStatus === 'loading' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f7fafc',
                color: '#a0aec0',
                fontSize: '12px',
                fontFamily: 'Satoshi, sans-serif'
              }}>
                {useTranslation ? <TranslatedText>Loading...</TranslatedText> : 'Loading...'}
              </div>
            )}
            
            {imageStatus === 'error' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
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
                {useTranslation ? <TranslatedText>Image not available</TranslatedText> : 'Image not available'}
              </div>
            )}
          </>
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
            fontFamily: 'Satoshi, sans-serif'
          }}>
            {useTranslation ? <TranslatedText>No image</TranslatedText> : 'No image'}
          </div>
        )}
      </div>

      <ItemDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        item={item}
        isItemInStock={() => isAvailable}
      />
    </div>
  );
};

export default ModernMinimalistItem;