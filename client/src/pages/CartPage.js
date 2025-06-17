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
  
  // Payment state management (copied from PaymentPage)
  const [showTipModal, setShowTipModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [userPaymentAmount, setUserPaymentAmount] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [tipInCents, setTipInCents] = useState(0);
  const [baseAmountInCents, setBaseAmountInCents] = useState(null);



  // Generate or retrieve a consistent temporary order ID
  const generateTempOrderId = () => {
    // Check if we already have a temporary ID stored for this payment session
    const storedTempId = sessionStorage.getItem("temp_order_id");
    if (storedTempId) {
      return storedTempId;
    }
    
    // Generate a new random temporary ID with "temp" prefix
    const randomId = `temp-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString().slice(-6)}`;
    // Store it for future use in this session
    sessionStorage.setItem("temp_order_id", randomId);
    return randomId;
  };

  // Get order ID from URL params or use stored order ID or temp ID
  const getOrderId = () => {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdFromUrl = urlParams.get('order_id');
    
    if (orderIdFromUrl) {
      return orderIdFromUrl;
    }
    
    // Check sessionStorage for current order ID
    const storedOrderId = sessionStorage.getItem("current_order_id");
    if (storedOrderId) {
      return storedOrderId;
    }
    
    // Fall back to temp ID
    return generateTempOrderId();
  };

  // Get the order ID to use for payment
  const orderId = getOrderId();

  // Function to fetch order details from backend
  const fetchOrderDetails = async (orderId) => {
    setOrderLoading(true);
    setOrderError(null);
    
    try {
      const response = await axios.get(`https://tablemint.onrender.com/api/orders/${orderId}/`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = response.data;
      
      if (data.success) {
        setOrderDetails(data.order);
        console.log("Order details:", data.order);
      } else {
        setOrderError(data.error || "Failed to fetch order details");
        console.error("Error fetching order:", data.error);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      
      if (error.response) {
        setOrderError(`Server error: ${error.response.status} - ${error.response.data.error || 'Unknown error'}`);
      } else if (error.request) {
        setOrderError("No response from server. Is the backend running?");
      } else {
        setOrderError(`Request failed: ${error.message}`);
      }
    } finally {
      setOrderLoading(false);
    }
  };

  // Check if we have an order_id from URL and fetch order details
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdFromUrl = urlParams.get('order_id');
    
    if (orderIdFromUrl) {
      console.log("Found order_id in URL, fetching order details:", orderIdFromUrl);
      fetchOrderDetails(orderIdFromUrl);
    }
  }, []);

  // Calculate total from order details when showing order instead of cart
  const calculateOrderTotal = () => {
    if (!orderDetails || !orderDetails.line_items) return { total: 0, currency: 'GBP' };
    
    let total = 0;
    let currency = 'GBP';
    
    orderDetails.line_items.forEach(item => {
      if (item.total_money) {
        total += item.total_money.amount;
        currency = item.total_money.currency;
      }
    });
    
    return { total, currency };
  };

  // Calculate total in cents for payment
  const calculateCartTotalInCents = useCallback(() => {
    if (orderDetails) {
      return calculateOrderTotal().total;
    }
    return Math.round(total * 100);
  }, [total, orderDetails]);

  // Update payment amount whenever userPaymentAmount changes
  useEffect(() => {
    const totalInCents = userPaymentAmount || calculateCartTotalInCents();
    if (updatePaymentAmount) {
      updatePaymentAmount(totalInCents);
    }
  }, [userPaymentAmount, total, updatePaymentAmount, calculateCartTotalInCents]);

  // Payment handler functions (copied from PaymentPage)
  const handleTipConfirm = async (tipAmount) => {
    try {
      const baseAmount = userPaymentAmount || calculateCartTotalInCents();
      const tipInCents = tipAmount * 100;
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

  const toggleTipModal = () => {
    setShowTipModal(!showTipModal);
  };



  // Format currency for display
  const formatCurrency = (amount, currency = 'GBP') => {
    if (!amount && amount !== 0) return '£0.00';
    
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    });
    
    return formatter.format(amount / 100);
  };

  // Determine if we're showing order details or cart items
  const showingOrderDetails = orderDetails && orderDetails.line_items;
  const displayItems = showingOrderDetails ? orderDetails.line_items : cartItems;
  const displayTotal = showingOrderDetails ? calculateOrderTotal().total / 100 : total;

  if (cartItems.length === 0 && !showingOrderDetails) {
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
        {/* Loading state for order details */}
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
            {/* Cart Items - Receipt Style */}
            <div className="cart-items-container">
              <h2 className="cart-items-title">Order Summary</h2>
              <div className="cart-items-list">
                {showingOrderDetails ? (
                  // Display order details
                  orderDetails.line_items.map((item, index) => (
                    <div key={index} className="cart-item">
                      <div className="cart-item-content">
                        <div className="cart-item-quantity">
                          {item.quantity}
                        </div>
                        <div className="cart-item-details">
                          <h3 className="cart-item-name">{item.name}</h3>
                          <p className="cart-item-unit-price">
                            {formatCurrency(item.base_price_money?.amount, item.base_price_money?.currency)} each
                          </p>
                        </div>
                        <div className="cart-item-total">
                          <p className="cart-item-total-price">
                            {formatCurrency(item.total_money?.amount, item.total_money?.currency)}
                          </p>
                        </div>
                      </div>
                      {index < orderDetails.line_items.length - 1 && <div className="cart-item-divider"></div>}
                    </div>
                  ))
                ) : (
                  // Display cart items
                  cartItems.map((item, index) => (
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
                  ))
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="cart-totals">
              <div className="cart-totals-list">
                {showingOrderDetails ? (
                  // For order details, just show the total
                  <div className="cart-final-total">
                    <span>Total</span>
                    <span>{formatCurrency(calculateOrderTotal().total, calculateOrderTotal().currency)}</span>
                  </div>
                ) : (
                  // For cart items, show subtotal, tax, and total
                  <>
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
                  </>
                )}
              </div>
            </div>

            {/* Payment Section */}
            <div className="cart-payment-section">
              <button 
                className="pay-full-amount-btn"
                onClick={handlePayFullAmount}
                disabled={paymentProcessing || isCreatingPaymentIntent}
              >
                {paymentProcessing ? 'Processing...' : 'Pay the full amount'}
              </button>
            </div>
          </>
        )}

        {/* Tip Modal */}
        {showTipModal && (
          <TipModal
            isOpen={showTipModal}
            onClose={toggleTipModal}
            onConfirm={handleTipConfirm}
            baseAmount={(userPaymentAmount || calculateCartTotalInCents()) / 100}
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
                      colorPrimary: '#1a73e8',
                      colorBackground: '#ffffff',
                      colorText: '#30313d',
                      colorDanger: '#df1b41',
                      fontFamily: 'Ideal Sans, system-ui, sans-serif',
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
                  orderId={orderId}
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
