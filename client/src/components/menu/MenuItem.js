import React from 'react';

const MenuItem = ({ 
  item, 
  formatCurrency, 
  isAvailable, 
  soldOutAtLocation, 
  currentQuantity, 
  onIncrement, 
  onDecrement,
  onItemClick, // Add this new prop for modal functionality
  isLastInCategory // Add this new prop for bottom border
}) => {
  const itemData = item.item_data;
  const variation = itemData?.variations?.[0];
  const price = variation?.item_variation_data?.price_money;

  const handleCardClick = (e) => {
    // Don't trigger modal if clicking on quantity controls
    if (e.target.closest('.quantity-selector') || e.target.closest('.add-button')) {
      return;
    }
    onItemClick?.(item);
  };

  return (
    <div className="menu-item-card" onClick={handleCardClick}>
      <div className="item-content">
        <div className="item-header">
          <h3 className="item-name">{itemData?.name || 'Unknown Item'}</h3>
          
          {soldOutAtLocation && (
            <div className="sold-out-badge">
              Out of Stock at this Location
            </div>
          )}

          {itemData?.description && (
            <p className="item-description">{itemData.description}</p>
          )}

          <div className="item-price">
            {formatCurrency(price?.amount, price?.currency)}
          </div>
        </div>
      </div>

      <div className="item-image-container">
        {/* Item Image */}
        {itemData?.primaryImage ? (
          <img 
            src={itemData.primaryImage.url} 
            alt={'Menu item'}
            className="item-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="no-image-placeholder">
            <span>No Image</span>
          </div>
        )}

        {/* Add to Cart Button / Quantity Selector */}
        {isAvailable ? (
          currentQuantity > 0 ? (
            // Quantity Selector
            <div className="quantity-selector">
              <button 
                className="quantity-btn decrement"
                onClick={onDecrement}
              >
                −
              </button>
              <span className="quantity-display">
                {currentQuantity}
              </span>
              <button 
                className="quantity-btn increment"
                onClick={onIncrement}
              >
                +
              </button>
            </div>
          ) : (
            // Simple Add Button
            <button 
              className="add-button"
              onClick={onIncrement}
            >
              +
            </button>
          )
        ) : (
          <div className="out-of-stock-overlay">
            <span>Out of Stock</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .menu-item-card {
          background: white;
          border: none;
          transition: background-color 0.2s ease;
          display: flex;
          align-items: flex-start;
          padding: 20px 16px;
          position: relative;
          gap: 16px;
          font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          cursor: pointer;
        }

        .menu-item-card:hover {
          background: #f8f9fa;
        }

        .item-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          text-align: left;
          align-items: flex-start;
        }

        .item-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .item-name {
          font-size: 15px;
          font-weight: 600;
          color: #000;
          margin: 0;
          line-height: 1.2;
          font-family: 'Satoshi', sans-serif;
        }

        .sold-out-badge {
          background: #ff4757;
          color: white;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 400;
          display: inline-block;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: 'Satoshi', sans-serif;
        }

        .item-description {
          color:rgb(112, 112, 112);
          font-size: 14px;
          line-height: 1.4;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-family: 'Satoshi', sans-serif;
          font-weight: 400;
        }

        .item-price {
          font-size: 14px;
          font-weight: 400;
          color:rgb(112, 112, 112);
          margin-top: 4px;
          font-family: 'Satoshi', sans-serif;
        }

        .item-image-container {
          width: 150px;
          height: 150px;
          border-radius: 12px;
          overflow: hidden;
          background: #f7fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          flex-shrink: 0;
        }

        .item-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .no-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f7fafc;
          color: #a0aec0;
          font-size: 12px;
          font-family: 'Satoshi', sans-serif;
          font-weight: 400;
        }

        .add-button {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #000;
          color: white;
          border: none;
          font-size: 20px;
          font-weight: 300;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          font-family: 'Satoshi', sans-serif;
          z-index: 10;
        }

        .add-button:hover {
          background: #333;
          transform: scale(1.1);
        }

        .quantity-selector {
          position: absolute;
          top: 6px;
          right: 6px;
          display: flex;
          align-items: center;
          background: #ffffff;
          border-radius: 18px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          padding: 2px;
          gap: 2px;
          z-index: 10;
        }

        .quantity-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: #000;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-family: 'Satoshi', sans-serif;
        }

        .quantity-btn:hover {
          background: #333;
          transform: scale(1.05);
        }

        .quantity-btn.decrement {
          background: #ff4757;
        }

        .quantity-btn.decrement:hover {
          background: #ff3838;
        }

        .quantity-display {
          min-width: 24px;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
          padding: 0 4px;
          font-family: 'Satoshi', sans-serif;
        }

        .out-of-stock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 500;
          font-size: 12px;
          border-radius: 12px;
          font-family: 'Satoshi', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default MenuItem;