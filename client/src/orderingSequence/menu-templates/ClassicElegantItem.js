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
        padding: '24px 0',
        gap: '16px',
        transition: 'all 0.2s ease-out',
        cursor: 'pointer',
        fontFamily: 'Satoshi, Georgia, "Times New Roman", serif',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        position: 'relative',
      }}
    >
      {/* Elegant left border accent */}
      <div style={{
        position: 'absolute',
        left: '-16px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '2px',
        height: '0',
        backgroundColor: '#d4af37',
        transition: 'height 0.3s ease-out',
        borderRadius: '1px',
      }} className="elegant-accent" />

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
          fontWeight: '600',
          color: '#1a1a1a',
          margin: 0,
          lineHeight: '1.3',
          fontFamily: 'Satoshi, Georgia, serif',
          letterSpacing: '-0.01em',
        }}>
          {item.name || <TranslatedText>Unnamed Item</TranslatedText>}
        </h3>
        
        {item.description && (
          <p style={{
            fontSize: '14px',
            color: '#5a5a5a',
            margin: 0,
            lineHeight: '1.4',
            fontFamily: 'Satoshi, Georgia, serif',
            fontStyle: 'italic',
            fontWeight: '400',
            opacity: '0.9',
          }}>
            {item.description}
          </p>
        )}
      </div>
      
      {/* Price */}
      {item.price !== undefined && (
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          minWidth: '80px',
          height: '20px',
          marginTop: '2px',
          paddingRight: '16px',
        }}>
          <span style={{
            color: '#1a1a1a',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            fontSize: '16px',
            fontFamily: 'Satoshi, Georgia, serif',
            letterSpacing: '-0.01em',
            flexShrink: 0,
          }}>
            {displayPrice()}
          </span>
        </div>
      )}

      <style jsx>{`
        .classic-elegant-item:hover {
          background: rgba(212, 175, 55, 0.02) !important;
          border-radius: 8px !important;
          padding-left: 12px !important;
          padding-right: 12px !important;
        }
        
        .classic-elegant-item:hover .elegant-accent {
          height: 32px !important;
        }
        
        .classic-elegant-item:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06) !important;
        }

        /* Mobile responsive styles */
        @media (max-width: 767px) {
          .classic-elegant-item {
            padding: 20px 0 !important;
            gap: 12px !important;
          }
          
          .classic-elegant-item h3 {
            font-size: 16px !important;
          }
          
          .classic-elegant-item p {
            font-size: 13px !important;
            line-height: 1.3 !important;
          }
          
          .classic-elegant-item > div:last-child {
            min-width: 70px !important;
            padding-right: 12px !important;
          }
          
          .classic-elegant-item:hover {
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
          
          .classic-elegant-item:hover .elegant-accent {
            height: 28px !important;
          }
          
          .classic-elegant-item .elegant-accent {
            left: -12px !important;
            width: 2px !important;
          }
          
          .classic-elegant-item span {
            font-size: 15px !important;
          }
        }

        /* Tablet responsive styles */
        @media (min-width: 768px) and (max-width: 1023px) {
          .classic-elegant-item {
            padding: 26px 0 !important;
            gap: 18px !important;
          }
          
          .classic-elegant-item h3 {
            font-size: 18px !important;
          }
          
          .classic-elegant-item p {
            font-size: 14px !important;
          }
          
          .classic-elegant-item > div:last-child {
            min-width: 80px !important;
            padding-right: 18px !important;
          }
          
          .classic-elegant-item span {
            font-size: 16px !important;
          }
        }

        /* Desktop styles */
        @media (min-width: 1024px) {
          .classic-elegant-item {
            padding: 28px 0 !important;
            gap: 20px !important;
          }
          
          .classic-elegant-item h3 {
            font-size: 19px !important;
          }
          
          .classic-elegant-item p {
            font-size: 15px !important;
            line-height: 1.5 !important;
          }
          
          .classic-elegant-item > div:last-child {
            min-width: 90px !important;
            padding-right: 20px !important;
          }
          
          .classic-elegant-item span {
            font-size: 17px !important;
          }
          
          .classic-elegant-item:hover {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
          
          .classic-elegant-item:hover .elegant-accent {
            height: 40px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ClassicElegantItem;
