import React from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import './CartPage.css';

const CartPage = () => {
  const { items: cartItems, subtotal, tax, total } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        {/* Header */}
        <div className="cart-header">
          <div className="cart-header-content">
            <button className="cart-close-button">
              <X size={24} />
            </button>
            <h1 className="cart-title">Your Cart</h1>
            <div className="w-6"></div>
          </div>
        </div>

        {/* Empty Cart */}
        <div className="empty-cart-container">
          <div className="empty-cart-icon">
            <ShoppingCart size={32} />
          </div>
          <h2 className="empty-cart-title">Your cart is empty</h2>
          <p className="empty-cart-subtitle">Add some delicious items to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {/* Header */}
      <div className="cart-header">
        <div className="cart-header-content">
          <button className="cart-close-button">
            <X size={24} />
          </button>
          <h1 className="cart-title">Your Cart</h1>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="cart-content">
        {/* Cart Items - Receipt Style */}
        <div className="cart-items-container">
          <h2 className="cart-items-title">Order Summary</h2>
          <div className="cart-items-list">
            {cartItems.map((item, index) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-content">
                  <div className="cart-item-quantity">
                    {item.quantity}
                  </div>
                  <div className="cart-item-details">
                    <h3 className="cart-item-name">{item.name}</h3>
                    {item.options && (
                      <p className="cart-item-options">
                        Select Option: {item.options}
                      </p>
                    )}
                    {item.description && (
                      <p className="cart-item-description">
                        {item.description}
                      </p>
                    )}
                    <p className="cart-item-unit-price">
                      £{item.price.toFixed(2)} each
                    </p>
                  </div>
                  <div className="cart-item-total">
                    <p className="cart-item-total-price">
                      £{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
                {index < cartItems.length - 1 && <div className="cart-item-divider"></div>}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="cart-totals">
            <div className="cart-totals-list">
              <div className="cart-total-row subtotal">
                <span>Subtotal</span>
                <span>£{subtotal.toFixed(2)}</span>
              </div>
              <div className="cart-total-row tax">
                <span>Tax</span>
                <span>£{tax.toFixed(2)}</span>
              </div>
              <div className="cart-total-divider"></div>
              <div className="cart-final-total">
                <span>Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
