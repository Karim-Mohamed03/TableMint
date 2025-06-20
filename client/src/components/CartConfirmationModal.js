import React from 'react';
import { useCart } from '../contexts/CartContext';
import { X, Trash2, Minus, Plus } from 'lucide-react';
import './CartConfirmationModal.css';

const CartConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  const { items, subtotal, getItemCount, updateQuantity, removeItem } = useCart();

  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount / 100);
  };

  const handleQuantityChange = (item, delta) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity === 0) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
          <h1 className="modal-title">Your Cart</h1>
          <div className="header-spacer"></div>
        </div>
        
        <div className="modal-body">
          {items.length === 0 ? (
            <p className="empty-cart">Your cart is empty</p>
          ) : (
            <>
              <div className="cart-items">
                {items.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="item-image-container">
                      {item.item_data?.primaryImage ? (
                        <img 
                          src={item.item_data.primaryImage.url} 
                          alt={item.name}
                          className="item-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="no-image">
                          <span>No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="item-info">
                      <h4>{item.name}</h4>
                      {item.description && (
                        <p className="item-description">{item.description}</p>
                      )}
                      <div className="item-price-controls">
                        <span className="price">{formatCurrency(item.price)}</span>
                        <div className="quantity-controls">
                          <button 
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item, -1)}
                          >
                            {item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                          </button>
                          <span className="quantity">{item.quantity}</span>
                          <button 
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item, 1)}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
            </>
          )}
        </div>
        
        {items.length > 0 && (
          <div className="modal-footer">
            <button className="confirm-button" onClick={onConfirm}>
              Confirm Order • {formatCurrency(subtotal)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartConfirmationModal;
