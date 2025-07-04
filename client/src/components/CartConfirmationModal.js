import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { X, Trash2, Minus, Plus, Loader } from 'lucide-react';
import './CartConfirmationModal.css';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../receiptScreen/components/CheckoutForm';
import TipModal from '../receiptScreen/components/TipModal';
import { useNavigate } from 'react-router-dom';


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
  const [realOrderId, setRealOrderId] = useState(null);
  const navigate = useNavigate();

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

  const handleConfirmOrder = () => {
    setUserPaymentAmount(null);
    setShowTipModal(true);
  };

  const handleTipConfirm = async (tipAmount) => {
    console.log('handleTipConfirm called with tipAmount:', tipAmount);
    console.log('createPaymentIntent available:', typeof createPaymentIntent);
    
    if (typeof createPaymentIntent !== 'function') {
      console.error('createPaymentIntent is not a function:', createPaymentIntent);
      setPaymentError('Payment system is not properly initialized. Please try again.');
      return;
    }

    try {
      // Step 1: Retrieve cart from sessionStorage using the correct key
      const cartData = sessionStorage.getItem("tablemint_cart");
      
      // Step 2: Check if cart exists and is not empty
      if (!cartData) {
        alert("Your cart is empty. Please add items before confirming your order.");
        setShowTipModal(false);
        return;
      }

      // Step 3: Parse the cart data
      let parsedCart;
      try {
        parsedCart = JSON.parse(cartData);
      } catch (parseError) {
        console.error("Error parsing cart data:", parseError);
        alert("There was an error reading your cart. Please try again.");
        setShowTipModal(false);
        return;
      }

      // Step 4: Check if parsed cart has items
      if (!parsedCart || !parsedCart.items || parsedCart.items.length === 0) {
        alert("Your cart is empty. Please add items before confirming your order.");
        setShowTipModal(false);
        return;
      }

      // Step 5: Create line items for the order
      const lineItems = parsedCart.items.map(item => ({
        catalog_object_id: item.id,
        quantity: item.quantity.toString(),
        base_price_money: {
          amount: Math.round(item.price),
          currency: item.currency || 'GBP'
        }
      }));

      // Get restaurant context from session storage
      let restaurantId = null;
      let tableToken = null;
      let location_id = null;

      // Try to get restaurant context
      const storedRestaurantContext = sessionStorage.getItem('restaurant_context');
      if (storedRestaurantContext) {
        try {
          const restaurantData = JSON.parse(storedRestaurantContext);
          restaurantId = restaurantData.id;
          location_id = restaurantData.location_id;
        } catch (e) {
          console.error('Failed to parse restaurant context:', e);
        }
      }

      // Try to get table context
      const storedTableContext = sessionStorage.getItem('table_context');
      if (storedTableContext) {
        try {
          const tableData = JSON.parse(storedTableContext);
          tableToken = tableData.token;
          if (!restaurantId && tableData.restaurant_id) {
            restaurantId = tableData.restaurant_id;
          }
        } catch (e) {
          console.error('Failed to parse table context:', e);
        }
      }

      // Step 7: Prepare order data for creation
      const orderData = {
        line_items: lineItems,
        idempotency_key: `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        restaurant_id: restaurantId,
        table_token: tableToken,
        location_id: location_id,
      };
      
      // Step 8: Create the order via API call
      const response = await fetch('http://localhost:8000/api/orders/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        // Store the created order ID for later use in payment
        const orderId = responseData.order?.id;
        if (orderId) {
          sessionStorage.setItem("current_order_id", orderId);
          // Update URL with order_id without navigation
          const newUrl = window.location.pathname + `?order_id=${orderId}`;
          window.history.replaceState({}, '', newUrl);
          setRealOrderId(orderId);
        }

        // Also store order data for potential external payment creation later
        sessionStorage.setItem("pending_square_order", JSON.stringify(orderData));
        
        // Calculate final amount with tip
        const baseAmount = subtotal;
        const tipInCents = tipAmount;
        const finalAmount = baseAmount + tipInCents;
        
        setTipInCents(tipInCents);
        setBaseAmountInCents(baseAmount);
        setUserPaymentAmount(finalAmount);
        
        // Create payment intent
        setPaymentProcessing(true);
        await createPaymentIntent(finalAmount);
        setShowCheckout(true);
        setShowTipModal(false);
      } else {
        alert(`Failed to create order: ${responseData.error || 'Unknown error'}`);
        setShowTipModal(false);
      }
    } catch (error) {
      console.error("Error in handleTipConfirm:", error);
      setPaymentError('Failed to process your order. Please try again.');
      setShowTipModal(false);
    } finally {
      setPaymentProcessing(false);
    }
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
                  baseAmount={baseAmountInCents/100}
                  tipAmount={tipInCents/100}
                  currency="GBP"
                  orderId={realOrderId}
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
