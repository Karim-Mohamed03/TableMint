// import React, { useState, useEffect } from 'react';
// import { useCart } from '../../contexts/CartContext';

// const ItemDetailModal = ({ 
//   isOpen, 
//   onClose, 
//   item, 
//   formatCurrency, 
//   isItemInStock 
// }) => {
//   const [quantity, setQuantity] = useState(1);
//   const { addItem } = useCart();

//   // Reset quantity when modal opens
//   useEffect(() => {
//     if (isOpen) {
//       setQuantity(1);
//     }
//   }, [isOpen]);

//   if (!isOpen || !item) return null;

//   const itemData = item.item_data;
//   const variation = itemData?.variations?.[0];
//   const price = variation?.item_variation_data?.price_money;
//   const inStock = isItemInStock(item.id);

//   const handleQuantityChange = (delta) => {
//     setQuantity(Math.max(1, quantity + delta));
//   };

//   const handleAddToCart = () => {
//     const cartItem = {
//       id: variation?.id || item.id,
//       name: itemData?.name || 'Unknown Item',
//       price: price?.amount ? price.amount / 100 : 0,
//       currency: price?.currency || 'USD',
//       quantity: quantity
//     };
    
//     // Add multiple quantities at once
//     for (let i = 0; i < quantity; i++) {
//       addItem({ ...cartItem, quantity: 1 });
//     }
    
//     onClose();
//   };

//   return (
//     <div className={`modal-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose}>
//       <div className={`item-detail-modal ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
//         {/* Drag handle */}
//         <div className="modal-header">
//           <div className="drag-handle"></div>
//         </div>

//         {/* Item Image */}
//         <div className="detail-image-container">
//           {itemData?.primaryImage ? (
//             <img 
//               src={itemData.primaryImage.url} 
//               alt={itemData.primaryImage.caption || itemData?.name || 'Menu item'}
//               className="detail-image"
//             />
//           ) : (
//             <div className="detail-no-image">
//               <span>No Image</span>
//             </div>
//           )}
//         </div>

//         {/* Item Info */}
//         <div className="detail-content">
//           <h1 className="detail-title">{itemData?.name || 'Unknown Item'}</h1>
          
//           {itemData?.description && (
//             <p className="detail-description">{itemData.description}</p>
//           )}

//           <div className="detail-price">
//             {formatCurrency(price?.amount, price?.currency)}
//           </div>

//           {/* Nutrition Info */}
//           {itemData?.food_and_beverage_details?.calorie_count && (
//             <div className="nutrition-info">
//               <div className="nutrition-item">
//                 <span className="nutrition-value">{itemData.food_and_beverage_details.calorie_count}</span>
//                 <span className="nutrition-label">kcal</span>
//               </div>
//             </div>
//           )}

//           {/* Quantity and Add to Cart */}
//           <div className="add-to-cart-section">
//             <div className="quantity-controls">
//               <button 
//                 className="quantity-btn" 
//                 onClick={() => handleQuantityChange(-1)}
//                 disabled={quantity <= 1}
//               >
//                 −
//               </button>
//               <span className="quantity-display">{quantity}</span>
//               <button 
//                 className="quantity-btn" 
//                 onClick={() => handleQuantityChange(1)}
//               >
//                 +
//               </button>
//             </div>
            
//             <button 
//               className={`add-to-cart-btn ${!inStock ? 'disabled' : ''}`}
//               disabled={!inStock}
//               onClick={handleAddToCart}
//             >
//               {inStock ? `Add to cart • ${formatCurrency(price?.amount * quantity, price?.currency)}` : 'Out of Stock'}
//             </button>
//           </div>
//         </div>

//         <style jsx>{`
//           .modal-backdrop {
//             position: fixed;
//             top: 0;
//             left: 0;
//             width: 100%;
//             height: 100%;
//             background-color: rgba(0, 0, 0, 0.5);
//             display: flex;
//             justify-content: center;
//             align-items: flex-end;
//             z-index: 1000;
//             visibility: hidden;
//             opacity: 0;
//             transition: visibility 0s linear 0.3s, opacity 0.3s;
//             pointer-events: none;
//           }
          
//           .modal-backdrop.open {
//             visibility: visible;
//             opacity: 1;
//             transition-delay: 0s;
//             pointer-events: auto;
//           }

//           .item-detail-modal {
//             background: white;
//             width: 100%;
//             max-width: 500px;
//             max-height: 90vh;
//             border-radius: 20px 20px 0 0;
//             transform: translateY(100%);
//             transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
//             display: flex;
//             flex-direction: column;
//             overflow: hidden;
//             position: relative;
//             z-index: 1001;
//             pointer-events: auto;
//             box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
//             font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
//           }

//           .item-detail-modal.open {
//             transform: translateY(0);
//           }

//           .modal-header {
//             padding: 12px 0 8px 0;
//             display: flex;
//             justify-content: center;
//             flex-shrink: 0;
//           }

//           .drag-handle {
//             width: 36px;
//             height: 4px;
//             background-color: #d1d1d6;
//             border-radius: 2px;
//           }

//           .detail-image-container {
//             width: 100%;
//             height: 250px;
//             overflow: hidden;
//             background: #f7fafc;
//             flex-shrink: 0;
//           }

//           .detail-image {
//             width: 100%;
//             height: 100%;
//             object-fit: cover;
//           }

//           .detail-no-image {
//             width: 100%;
//             height: 100%;
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             color: #a0aec0;
//             font-size: 16px;
//             font-family: 'Satoshi', sans-serif;
//             font-weight: 400;
//           }

//           .detail-content {
//             padding: 24px;
//             flex: 1;
//             overflow-y: auto;
//             display: flex;
//             flex-direction: column;
//             gap: 16px;
//           }

//           .detail-title {
//             font-size: 24px;
//             font-weight: 600;
//             color: #000;
//             margin: 0;
//             line-height: 1.2;
//             font-family: 'Satoshi', sans-serif;
//           }

//           .detail-description {
//             color: rgb(112, 112, 112);
//             font-size: 16px;
//             line-height: 1.5;
//             margin: 0;
//             font-family: 'Satoshi', sans-serif;
//             font-weight: 400;
//           }

//           .detail-price {
//             font-size: 20px;
//             font-weight: 500;
//             color: rgb(112, 112, 112);
//             font-family: 'Satoshi', sans-serif;
//           }

//           .nutrition-info {
//             display: flex;
//             gap: 24px;
//           }

//           .nutrition-item {
//             display: flex;
//             flex-direction: column;
//             align-items: center;
//           }

//           .nutrition-value {
//             font-size: 20px;
//             font-weight: 600;
//             color: #000;
//             font-family: 'Satoshi', sans-serif;
//           }

//           .nutrition-label {
//             font-size: 14px;
//             color: rgb(112, 112, 112);
//             margin-top: 4px;
//             font-family: 'Satoshi', sans-serif;
//             font-weight: 400;
//           }

//           .add-to-cart-section {
//             display: flex;
//             gap: 16px;
//             align-items: center;
//             margin-top: auto;
//             padding-top: 24px;
//           }

//           .quantity-controls {
//             display: flex;
//             align-items: center;
//             gap: 16px;
//             background: #f7fafc;
//             border-radius: 12px;
//             padding: 8px 16px;
//           }

//           .quantity-btn {
//             background: none;
//             border: none;
//             font-size: 20px;
//             font-weight: 600;
//             color: #000;
//             cursor: pointer;
//             width: 32px;
//             height: 32px;
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             border-radius: 50%;
//             transition: background-color 0.2s ease;
//             font-family: 'Satoshi', sans-serif;
//           }

//           .quantity-btn:hover:not(:disabled) {
//             background: #e2e8f0;
//           }

//           .quantity-btn:disabled {
//             opacity: 0.5;
//             cursor: not-allowed;
//           }

//           .quantity-display {
//             font-size: 16px;
//             font-weight: 600;
//             color: #000;
//             min-width: 20px;
//             text-align: center;
//             font-family: 'Satoshi', sans-serif;
//           }

//           .add-to-cart-btn {
//             flex: 1;
//             background: #000;
//             color: white;
//             border: none;
//             padding: 16px 24px;
//             border-radius: 12px;
//             font-size: 16px;
//             font-weight: 500;
//             cursor: pointer;
//             transition: background-color 0.2s ease;
//             font-family: 'Satoshi', sans-serif;
//           }

//           .add-to-cart-btn:hover:not(.disabled) {
//             background: #333;
//           }

//           .add-to-cart-btn.disabled {
//             background: #cbd5e0;
//             cursor: not-allowed;
//           }

//           /* Mobile responsiveness */
//           @media (max-width: 480px) {
//             .detail-content {
//               padding: 20px;
//             }

//             .detail-title {
//               font-size: 22px;
//             }

//             .add-to-cart-section {
//               flex-direction: column;
//               gap: 12px;
//             }

//             .add-to-cart-btn {
//               width: 100%;
//             }
//           }
//         `}</style>
//       </div>
//     </div>
//   );
// };

// export default ItemDetailModal;


import React, { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';

const ItemDetailModal = ({ 
  isOpen, 
  onClose, 
  item, 
  formatCurrency, 
  isItemInStock 
}) => {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  // Reset quantity when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const itemData = item.item_data;
  const variation = itemData?.variations?.[0];
  const price = variation?.item_variation_data?.price_money;
  const inStock = isItemInStock(item.id);

  const handleQuantityChange = (delta) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const handleAddToCart = () => {
    const cartItem = {
      id: variation?.id || item.id,
      name: itemData?.name || 'Unknown Item',
      price: price?.amount ? price.amount / 100 : 0,
      currency: price?.currency || 'USD',
      quantity: quantity
    };
    
    // Add multiple quantities at once
    for (let i = 0; i < quantity; i++) {
      addItem({ ...cartItem, quantity: 1 });
    }
    
    onClose();
  };

  return (
    <div className={`modal-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className={`item-detail-modal ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
        {/* Drag handle */}
        <div className="modal-header">
          <div className="drag-handle"></div>
        </div>

        {/* Item Image */}
        <div className="detail-image-container">
          {itemData?.primaryImage ? (
            <img 
              src={itemData.primaryImage.url} 
              alt={itemData.primaryImage.caption || itemData?.name || 'Menu item'}
              className="detail-image"
            />
          ) : (
            <div className="detail-no-image">
              <span>No Image</span>
            </div>
          )}
        </div>

        {/* Item Info */}
        <div className="detail-content">
          <h1 className="detail-title">{itemData?.name || 'Unknown Item'}</h1>
          
          {itemData?.description && (
            <p className="detail-description">{itemData.description}</p>
          )}

          <div className="detail-price">
            {formatCurrency(price?.amount, price?.currency)}
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

          {/* Quantity and Add to Cart */}
          <div className="add-to-cart-section">
            <div className="quantity-controls">
              <button 
                className="quantity-btn" 
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="quantity-display">{quantity}</span>
              <button 
                className="quantity-btn" 
                onClick={() => handleQuantityChange(1)}
              >
                +
              </button>
            </div>
            
            <button 
              className={`add-to-cart-btn ${!inStock ? 'disabled' : ''}`}
              disabled={!inStock}
              onClick={handleAddToCart}
            >
              {inStock ? `Add to cart • ${formatCurrency(price?.amount * quantity, price?.currency)}` : 'Out of Stock'}
            </button>
          </div>
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
            max-width: 500px;
            max-height: 90vh;
            border-radius: 20px 20px 0 0;
            transform: translateY(100%);
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
            z-index: 1001;
            pointer-events: auto;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
            font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }

          .item-detail-modal.open {
            transform: translateY(0);
          }

          .modal-header {
            padding: 12px 0 8px 0;
            display: flex;
            justify-content: center;
            flex-shrink: 0;
          }

          .drag-handle {
            width: 36px;
            height: 4px;
            background-color: #d1d1d6;
            border-radius: 2px;
          }

          .detail-image-container {
            width: 100%;
            height: 250px;
            overflow: hidden;
            background: #f7fafc;
            flex-shrink: 0;
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
          }

          .detail-content {
            padding: 24px;
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .detail-title {
            font-size: 24px;
            font-weight: 600;
            color: #000;
            margin: 0;
            line-height: 1.2;
            font-family: 'Satoshi', sans-serif;
          }

          .detail-description {
            color: rgb(112, 112, 112);
            font-size: 16px;
            line-height: 1.5;
            margin: 0;
            font-family: 'Satoshi', sans-serif;
            font-weight: 400;
          }

          .detail-price {
            font-size: 20px;
            font-weight: 500;
            color: rgb(112, 112, 112);
            font-family: 'Satoshi', sans-serif;
          }

          .nutrition-info {
            display: flex;
            gap: 24px;
          }

          .nutrition-item {
            display: flex;
            flex-direction: column;
            align-items: center;
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

          .add-to-cart-section {
            display: flex;
            gap: 16px;
            align-items: center;
            margin-top: auto;
            padding-top: 24px;
          }

          .quantity-controls {
            display: flex;
            align-items: center;
            gap: 16px;
            background: #f7fafc;
            border-radius: 12px;
            padding: 8px 16px;
            flex-shrink: 0;
          }

          .quantity-btn {
            background: none;
            border: none;
            font-size: 20px;
            font-weight: 600;
            color: #000;
            cursor: pointer;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s ease;
            font-family: 'Satoshi', sans-serif;
          }

          .quantity-btn:hover:not(:disabled) {
            background: #e2e8f0;
          }

          .quantity-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .quantity-display {
            font-size: 16px;
            font-weight: 600;
            color: #000;
            min-width: 20px;
            text-align: center;
            font-family: 'Satoshi', sans-serif;
          }

          .add-to-cart-btn {
            flex: 1;
            background: #000;
            color: white;
            border: none;
            padding: 16px 24px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s ease;
            font-family: 'Satoshi', sans-serif;
            min-width: 0;
          }

          .add-to-cart-btn:hover:not(.disabled) {
            background: #333;
          }

          .add-to-cart-btn.disabled {
            background: #cbd5e0;
            cursor: not-allowed;
          }

          /* Mobile responsiveness */
          @media (max-width: 480px) {
            .detail-content {
              padding: 20px;
            }

            .detail-title {
              font-size: 22px;
            }

            .add-to-cart-section {
              gap: 12px;
            }

            .quantity-controls {
              gap: 12px;
              padding: 6px 12px;
            }

            .add-to-cart-btn {
              font-size: 14px;
              padding: 14px 16px;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ItemDetailModal;