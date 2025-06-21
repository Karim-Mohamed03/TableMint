import React, { useState, useEffect, useCallback } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from '../contexts/CartContext';
import TipModal from '../receiptScreen/components/TipModal';
import CheckoutForm from '../receiptScreen/components/CheckoutForm';
import axios from 'axios';

import './CartPage.css';

const CartPage = ({
  stripePromise, 
  clientSecret, 
  updatePaymentAmount, 
  createPaymentIntent, 
  isCreatingPaymentIntent,
  restaurantBranding,
  isBrandingLoaded
}) => {
  const { items: cartItems, subtotal, tax, total } = useCart();
  
  // Order details state for when order_id is provided
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);
  
  // Payment state management
  const [showTipModal, setShowTipModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [userPaymentAmount, setUserPaymentAmount] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [tipInCents, setTipInCents] = useState(0);
  const [baseAmountInCents, setBaseAmountInCents] = useState(null);

  // Format currency for display
  const formatCurrency = (amount, currency = 'GBP') => {
    if (!amount && amount !== 0) return '£0.00';
    
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    });
    
    return formatter.format(amount);
  };

  // Calculate tip percentage
  const calculateTipPercentage = () => {
    if (!tipInCents || !baseAmountInCents) return 0;
    return ((tipInCents / baseAmountInCents) * 100).toFixed(1);
  };

  // Payment handler functions
  const handleTipConfirm = async (tipAmount) => {
    try {
      const baseAmount = userPaymentAmount || Math.round(total * 100);
      const tipInCents = Math.round(tipAmount * 100);
      const finalAmount = baseAmount + tipInCents;
      
      setTipInCents(tipInCents);
      setBaseAmountInCents(baseAmount);
      setUserPaymentAmount(finalAmount);
      
      setPaymentProcessing(true);
      await createPaymentIntent(finalAmount);
      setShowCheckout(true);
      setShowTipModal(false);
    } catch (error) {
      console.error("Error creating payment intent:", error);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePayFullAmount = () => {
    setUserPaymentAmount(null);
    setShowTipModal(true);
  };

  if (cartItems.length === 0 && !orderDetails) {
    return (
      <div className="cart-page">
        <div className="cart-header">
          <div className="cart-header-content">
            <button className="cart-close-button">
              <X size={24} />
            </button>
            <h1 className="cart-title">Your Cart</h1>
            <div className="w-6"></div>
          </div>
        </div>

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
      <div className="cart-header">
        <div className="cart-header-content">
          <button className="cart-close-button">
            <X size={24} />
          </button>
          <h1 className="cart-title">Order Summary</h1>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="cart-content">
        {orderLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading order details...</p>
          </div>
        ) : orderError ? (
          <div className="error-message">
            <p>Error loading order: {orderError}</p>
          </div>
        ) : (
          <>
            <div className="cart-totals">
              <div className="cart-totals-list">
                <div className="cart-total-row subtotal">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="cart-total-row tax">
                  <span>Tax</span>
                  <span>{formatCurrency(tax)}</span>
                </div>

                {tipInCents > 0 && (
                  <>
                    <div className="cart-total-row tip">
                      <span>Tip</span>
                      <span>{formatCurrency(tipInCents / 100)}</span>
                    </div>
                    <div className="cart-total-row tip-percentage">
                      <span>Tip Percentage</span>
                      <span>{calculateTipPercentage()}%</span>
                    </div>
                  </>
                )}
                
                <div className="cart-total-divider"></div>
                
                <div className="cart-final-total">
                  <span>Total</span>
                  <span>{formatCurrency(total + (tipInCents / 100))}</span>
                </div>
              </div>
            </div>

            <div className="cart-payment-section">
              <button 
                className="pay-full-amount-btn"
                onClick={handlePayFullAmount}
                disabled={paymentProcessing || isCreatingPaymentIntent}
              >
                {paymentProcessing ? 'Processing...' : `Pay ${formatCurrency(total + (tipInCents / 100))}`}
              </button>
            </div>
          </>
        )}

        {/* Tip Modal */}
        {showTipModal && (
          <TipModal
            isOpen={showTipModal}
            onClose={() => setShowTipModal(false)}
            onConfirm={handleTipConfirm}
            baseAmount={total}
            currency="GBP"
          />
        )}

        {/* Stripe Checkout */}
        {showCheckout && clientSecret && stripePromise && (
          <div className="checkout-overlay">
            <div className="checkout-container">
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#2ecc71',
                      colorBackground: '#ffffff',
                      colorText: '#1d1d1f',
                      colorDanger: '#ff3b30',
                      fontFamily: 'Satoshi, system-ui, sans-serif',
                      spacingUnit: '2px',
                      borderRadius: '4px',
                    }
                  }
                }}
              >
                <CheckoutForm 
                  baseAmount={baseAmountInCents}
                  tipAmount={tipInCents}
                  currency="GBP"
                  orderId={orderDetails?.id}
                  restaurantBranding={restaurantBranding}
                  isBrandingLoaded={isBrandingLoaded}
                />
              </Elements>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
