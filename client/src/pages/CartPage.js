import React, { useState } from 'react';
import { X, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const CartPage = () => {
  const {
    items: cartItems,
    subtotal,
    deliveryFee,
    tax,
    total,
    updateQuantity,
    applyPromo,
    removePromo,
    promoCode: appliedPromoCode,
    promoDiscountAmount
  } = useCart();

  const [promoCode, setPromoCode] = useState('');

  // Apply promo code (placeholder functionality)
  const applyPromoCode = () => {
    if (promoCode.trim()) {
      // For demo purposes, apply a 10% discount for code "SAVE10"
      if (promoCode.toUpperCase() === 'SAVE10') {
        applyPromo(promoCode, 10);
        alert('Promo code applied!');
        setPromoCode('');
      } else {
        alert('Invalid promo code. Try SAVE10.');
      }
    }
  };

  const handleCheckout = () => {
    // Add your checkout logic here
    alert('Proceeding to checkout...');
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <button className="p-1">
            <X size={24} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold">Cart</h1>
          <div className="w-6"></div>
        </div>

        {/* Empty Cart */}
        <div className="flex flex-col items-center justify-center h-96 px-6">
          <ShoppingCart size={64} className="text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 text-center">Add some delicious items to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button className="p-1">
          <X size={24} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold">Cart</h1>
        <div className="w-6"></div>
      </div>

      {/* Cart Items */}
      <div className="px-4 py-2">
        {cartItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-4 border-b border-gray-100">
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">{item.name}</h3>
              <p className="text-gray-600 mt-1">${item.price.toFixed(2)}</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Quantity Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Promo Code Section */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Promo Code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            onClick={applyPromoCode}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="px-4 py-4 space-y-3">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Delivery</span>
          <span>${deliveryFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold text-gray-800 pt-2 border-t">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="px-4 pb-6">
        <button
          onClick={handleCheckout}
          className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors"
        >
          CHECK OUT
        </button>
      </div>
    </div>
  );
};

export default CartPage;