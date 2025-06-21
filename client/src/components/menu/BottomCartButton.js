import React from 'react';
import { ShoppingCart } from 'lucide-react';

const BottomCartButton = ({ itemCount, onCartClick }) => {
  if (itemCount === 0) return null;

  return (
    <div className="bottom-cart-container">
      <button className="bottom-cart-button" onClick={onCartClick}>
        <ShoppingCart size={20} />
        <span className="cart-text">View cart • {itemCount}</span>
      </button>
      
      <style jsx>{`
        .bottom-cart-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px;
          z-index: 100;
        }

        .bottom-cart-button {
          width: 100%;
          background: #000000;
          color: #ffffff;
          border: none;
          border-radius: 25px;
          padding: 12px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          font-family: 'Satoshi', sans-serif;
        }

        .bottom-cart-button:hover {
          background: #333333;
        }
      `}</style>
    </div>
  );
};

export default BottomCartButton;