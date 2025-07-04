import React, { useState, useEffect, useRef } from 'react';
import { TranslatedText } from '../../../hooks/useTranslatedText';

const ItemDetailModal = ({ 
  isOpen, 
  onClose, 
  item, 
  isItemInStock,
  formatCurrency 
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const modalRef = useRef(null);

  // Mouse handlers for desktop drag
  const handleMouseMove = React.useCallback((e) => {
    if (!isDragging) return;
    
    const currentY = e.clientY;
    const diff = currentY - dragStartY;
    
    // Only allow dragging down
    if (diff > 0) {
      setDragOffset(diff);
    }
  }, [isDragging, dragStartY]);

  const handleMouseUp = React.useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // If dragged down more than 100px, close the modal
    if (dragOffset > 100) {
      onClose();
    } else {
      // Snap back to original position
      setDragOffset(0);
    }
  }, [isDragging, dragOffset, onClose]);

  // Reset quantity when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setDragOffset(0);
    }
  }, [isOpen]);

  // Add mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isOpen || !item) return null;

  const itemData = item.item_data || item;
  
  // Handle price formatting - use the formatCurrency prop if available
  const displayPrice = () => {
    if (formatCurrency && itemData.price_money) {
      return formatCurrency(itemData.price_money.amount, itemData.price_money.currency);
    } else if (formatCurrency && item.price) {
      return formatCurrency(item.price);
    } else if (itemData.price_money) {
      const amount = itemData.price_money.amount;
      const currency = itemData.price_money.currency || 'GBP';
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: currency
      }).format(amount);
    } else if (item.price) {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
      }).format(item.price);
    }
    return <TranslatedText>Price not available</TranslatedText>;
  };



  // Touch/drag handlers
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - dragStartY;
    
    // Only allow dragging down
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // If dragged down more than 100px, close the modal
    if (dragOffset > 100) {
      onClose();
    } else {
      // Snap back to original position
      setDragOffset(0);
    }
  };

  // Mouse handlers for desktop drag
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStartY(e.clientY);
  };

     return (
    <div 
      className={`modal-backdrop ${isOpen ? 'open' : ''}`} 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        ref={modalRef}
        className={`item-detail-modal ${isOpen ? 'open' : ''}`} 
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Drag handle */}
        <div className="modal-header" onMouseDown={handleMouseDown}>
          <div className="drag-handle"></div>
        </div>

        {/* Item Image */}
        <div className="detail-image-container">
          {itemData?.primaryImage?.url || item.image ? (
            <img 
              src={itemData?.primaryImage?.url || item.image} 
              alt={itemData?.name || item.name || 'Menu item'}
              className="detail-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="detail-no-image" style={{ display: (itemData?.primaryImage?.url || item.image) ? 'none' : 'flex' }}>
            <span><TranslatedText>No Image</TranslatedText></span>
          </div>
        </div>

        {/* Item Info */}
        <div className="detail-content">
          <h1 className="detail-title">{itemData?.name || item.name || <TranslatedText>Unknown Item</TranslatedText>}</h1>
          
          {(itemData?.description || item.description) && (
            <p className="detail-description">{itemData?.description || item.description}</p>
          )}

          <div className="detail-price">
            {displayPrice()}
          </div>

          {/* Nutrition Info */}
          {itemData?.food_and_beverage_details?.calorie_count && (
            <div className="nutrition-info">
              <div className="nutrition-item">
                <span className="nutrition-value">{itemData.food_and_beverage_details.calorie_count}</span>
                <span className="nutrition-label">kcal</span>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: flex-end;
            z-index: 1000;
            visibility: hidden;
            opacity: 0;
            transition: visibility 0s linear 0.3s, opacity 0.3s;
            pointer-events: none;
          }
          
          .modal-backdrop.open {
            visibility: visible;
            opacity: 1;
            transition-delay: 0s;
            pointer-events: auto;
          }

          .item-detail-modal {
            background: white;
            width: 100%;
            max-width: 100%;
            min-height: 85vh;
            max-height: 95vh;
            border-radius: 20px 20px 0 0;
            transform: translateY(100%);
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
            z-index: 1001;
            pointer-events: auto;
            box-shadow: none;
            font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            border: none;
            user-select: none;
          }

          .item-detail-modal.open {
            transform: translateY(0);
          }

          .modal-header {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            padding: 12px 0 8px 0;
            display: flex;
            justify-content: center;
            flex-shrink: 0;
            z-index: 10;
            background: transparent;
            border: none;
            border-bottom: none;
            box-shadow: none;
            cursor: grab;
          }

          .modal-header:active {
            cursor: grabbing;
          }

          .drag-handle {
            width: 36px;
            height: 4px;
            background-color: white;
            border-radius: 2px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          }

          .detail-image-container {
            width: 100%;
            height: 300px;
            overflow: hidden;
            background: #f7fafc;
            flex-shrink: 0;
            margin-top: 0;
            position: relative;
          }

          .detail-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .detail-no-image {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #a0aec0;
            font-size: 16px;
            font-family: 'Satoshi', sans-serif;
            font-weight: 400;
            position: absolute;
            top: 0;
            left: 0;
          }

          .detail-content {
            padding: 24px;
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
            text-align: left;
          }

          .detail-title {
            font-size: 24px;
            font-weight: 600;
            color: #000;
            margin: 0;
            line-height: 1.2;
            font-family: 'Satoshi', sans-serif;
            text-align: left;
          }

          .detail-description {
            color: rgb(112, 112, 112);
            font-size: 16px;
            line-height: 1.5;
            margin: 0;
            font-family: 'Satoshi', sans-serif;
            font-weight: 400;
            text-align: left;
          }

          .detail-price {
            font-size: 20px;
            font-weight: 600;
            color: #000;
            font-family: 'Satoshi', sans-serif;
            text-align: left;
          }

          .nutrition-info {
            display: flex;
            gap: 24px;
            justify-content: flex-start;
          }

          .nutrition-item {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          .nutrition-value {
            font-size: 20px;
            font-weight: 600;
            color: #000;
            font-family: 'Satoshi', sans-serif;
          }

          .nutrition-label {
            font-size: 14px;
            color: rgb(112, 112, 112);
            margin-top: 4px;
            font-family: 'Satoshi', sans-serif;
            font-weight: 400;
          }

          /* Mobile responsiveness */
          @media (max-width: 480px) {
            .detail-content {
              padding: 20px;
            }

            .detail-title {
              font-size: 22px;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ItemDetailModal;