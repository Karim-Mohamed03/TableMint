import React from 'react';
import { useCart } from '../contexts/CartContext';
import { X } from 'lucide-react';
import './CartConfirmationModal.css';

const CartConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  const { items, subtotal, deliveryFee, tax, total, getItemCount } = useCart();

  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount / 100);
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
                    {item.item_data?.primaryImage && (
                      <div className="item-image-container">
                        <img 
                          src={item.item_data.primaryImage.url} 
                          alt={item.name}
                          className="item-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="item-info">
                      <h4>{item.name}</h4>
                      {item.description && (
                        <p className="item-description">{item.description}</p>
                      )}
                    </div>
                    <div className="item-quantity-price">
                      <span className="quantity">×{item.quantity}</span>
                      <span className="price">{formatCurrency(item.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="order-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(deliveryFee * 100)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax</span>
                  <span>{formatCurrency(tax * 100)}</span>
                </div>
                <div className="summary-row total-row">
                  <span>Total</span>
                  <span>{formatCurrency(total * 100)}</span>
                </div>
              </div>
            </>
          )}
        </div>
        
        {items.length > 0 && (
          <div className="modal-footer">
            <button className="confirm-button" onClick={onConfirm}>
              Confirm Order • {formatCurrency(total * 100)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartConfirmationModal;
