import React from 'react';
import { useCart } from '../contexts/CartContext';
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
          <h2>Your Order</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {items.length === 0 ? (
            <p className="empty-cart">Your cart is empty</p>
          ) : (
            <>
              <div className="cart-items">
                {items.map((item) => (
                  <div key={item.id} className="cart-item">
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
