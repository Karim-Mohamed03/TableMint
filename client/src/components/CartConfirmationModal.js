import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { X, Trash2, Minus, Plus, Loader } from 'lucide-react';
import './CartConfirmationModal.css';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../receiptScreen/components/CheckoutForm';
import TipModal from '../receiptScreen/components/TipModal';


const CartConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  menuItems = [], 
  stripePromise,
  clientSecret,
  updatePaymentAmount,
  createPaymentIntent = () => {
    console.error('createPaymentIntent function not provided');
    return Promise.reject(new Error('Payment system not initialized'));
  },
  isCreatingPaymentIntent,
  restaurantBranding,
  isBrandingLoaded
}) => {
  console.log('CartConfirmationModal props:', {
    createPaymentIntent: typeof createPaymentIntent,
    isCreatingPaymentIntent,
    clientSecret: !!clientSecret
  });

  const { items, subtotal, getItemCount, updateQuantity, removeItem, addItem } = useCart();
  const [showTipModal, setShowTipModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [userPaymentAmount, setUserPaymentAmount] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [tipInCents, setTipInCents] = useState(0);
  const [baseAmountInCents, setBaseAmountInCents] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [isProcessingTip, setIsProcessingTip] = useState(false);

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

  // Filter for potential side items based on characteristics
  const sideItems = menuItems
    .filter(item => {
      const itemName = item.item_data?.name?.toLowerCase() || '';
      const description = item.item_data?.description_plaintext?.toLowerCase() || '';
      const variation = item.item_data?.variations?.[0];
      const price = variation?.item_variation_data?.price_money?.amount || 0;

      // Common side item keywords - expanded list
      const sideKeywords = [
        'fries', 'chips', 'sauce', 'dip', 'side', 'salad', 'slaw', 'rice',
        'veg', 'onion', 'rings', 'mash', 'potato', 'wedges', 'corn', 'bread',
        'garlic', 'extra', 'add', 'cheese', 'bacon', 'jalapeno', 'mayo',
        'wings', 'bites', 'small', 'dressing'
      ];

      // Check if the item name or description contains side keywords
      const hasSideKeyword = sideKeywords.some(keyword => 
        itemName.includes(keyword) || description.includes(keyword)
      );

      // Side items typically have a lower price point
      const isReasonablyPriced = price > 0 && price <= 1000; // £10.00 or less

      return hasSideKeyword && isReasonablyPriced;
    });

  // Randomly select 4 items from the filtered list
  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const popularSides = shuffleArray([...sideItems]).slice(0, 4);

  // Always show section if we have menu items and found some sides
  const showPopularSection = menuItems && menuItems.length > 0 && popularSides.length > 0;

  // Generate or retrieve a consistent temporary order ID
  const generateTempOrderId = () => {
    const storedTempId = sessionStorage.getItem("temp_order_id");
    if (storedTempId) {
      return storedTempId;
    }
    const randomId = `temp-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString().slice(-6)}`;
    sessionStorage.setItem("temp_order_id", randomId);
    return randomId;
  };

  const orderId = generateTempOrderId();

  const handleTipConfirm = async (tipAmount) => {
    console.log('handleTipConfirm called with tipAmount:', tipAmount);
    console.log('createPaymentIntent available:', typeof createPaymentIntent);
    
    if (typeof createPaymentIntent !== 'function') {
      console.error('createPaymentIntent is not a function:', createPaymentIntent);
      setPaymentError('Payment system is not properly initialized. Please try again.');
      return;
    }

    try {
      const baseAmount = userPaymentAmount || Math.round(subtotal * 100);
      console.log('baseAmount:', baseAmount);
      const tipInCents = tipAmount * 100;
      console.log('tipInCents:', tipInCents);
      const finalAmount = baseAmount + tipInCents;
      console.log('finalAmount:', finalAmount);
      
      setTipInCents(tipInCents);
      setBaseAmountInCents(baseAmount);
      setUserPaymentAmount(finalAmount);
      
      setPaymentProcessing(true);
      await createPaymentIntent(finalAmount);
      setShowCheckout(true);
      setShowTipModal(false);
    } catch (error) {
      console.error("Error creating payment intent:", error);
      setPaymentError('Failed to create payment. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleConfirmOrder = () => {
    setPaymentError(null);
    setUserPaymentAmount(null);
    setShowTipModal(true);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
          <h1 className="modal-title">Your Order</h1>
          <div className="header-spacer"></div>
        </div>
        
        <div className="modal-body">
          {paymentError && (
            <div className="payment-error-message">
              <p>{paymentError}</p>
              <button onClick={() => setPaymentError(null)}>Dismiss</button>
            </div>
          )}

          {(paymentProcessing || isCreatingPaymentIntent || isProcessingTip) && (
            <div className="payment-processing-overlay">
              <Loader className="spinner" size={24} />
              <p>Processing your payment...</p>
            </div>
          )}

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

              <button className="add-more-button" onClick={onClose}>
                  <Plus className='plus-button' size={16} />
                  Add More Items
                </button>
              
              <div className="add-more-container">
                
              </div>

              {/* Always show the section, we'll debug what's inside */}
              {showPopularSection && (
                <div className="popular-items-section">
                  <h2 className="popular-items-title">Popular Sides</h2>
                  <p className="popular-items-sub-title">Add these crowd favorites to your order</p>
                  
                  <div className="popular-items-slider">
                    {popularSides.map((item) => {
                      console.log('Rendering side item:', item);
                      const variation = item.item_data?.variations?.[0];
                      const price = variation?.item_variation_data?.price_money?.amount;
                      
                      return (
                        <div key={item.id} className="popular-item-card">
                          <div className="popular-item-image">
                            {item.item_data?.primaryImage ? (
                              <img 
                                src={item.item_data.primaryImage.url} 
                                alt={item.item_data?.name}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="no-image">
                                <span>No Image</span>
                              </div>
                            )}
                            <button 
                              className="add-popular-button"
                              onClick={() => {
                                const cartItem = {
                                  id: variation?.id || item.id,
                                  name: item.item_data?.name,
                                  description: item.item_data?.description,
                                  price: price,
                                  currency: variation?.item_variation_data?.price_money?.currency || 'GBP',
                                  item_data: {
                                    ...item.item_data,
                                    primaryImage: item.item_data.primaryImage
                                  },
                                  quantity: 1
                                };
                                addItem(cartItem);
                              }}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <div className="popular-item-info">
                            <h3>{item.item_data?.name}</h3>
                            <span className="popular-item-price">
                              {formatCurrency(price)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {items.length > 0 && (
          <div className="modal-footer">
            <button 
              className="confirm-button" 
              onClick={handleConfirmOrder}
              disabled={paymentProcessing || isCreatingPaymentIntent}
            >
              {paymentProcessing ? 'Processing...' : `Confirm Order • ${formatCurrency(subtotal)}`}
            </button>
          </div>
        )}

        {showTipModal && (
          <TipModal
            isOpen={showTipModal}
            onClose={() => setShowTipModal(false)}
            onConfirm={handleTipConfirm}
            currentTip={tipInCents / 100}
            baseAmount={(userPaymentAmount || Math.round(subtotal * 100)) / 100}
            currency="GBP"
            isProcessing={isProcessingTip}
          />
        )}

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
                  onError={(error) => setPaymentError(error)}
                />
              </Elements>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartConfirmationModal;
