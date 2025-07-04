import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react';
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from '../contexts/CartContext';
import TipModal from '../receiptScreen/components/TipModal';
import CheckoutForm from '../receiptScreen/components/CheckoutForm';
import './SharedCartPage.css';

const SharedCartPage = ({
  stripePromise, 
  clientSecret, 
  updatePaymentAmount, 
  createPaymentIntent, 
  isCreatingPaymentIntent,
  restaurantBranding,
  isBrandingLoaded
}) => {
  const navigate = useNavigate();
  const { shareToken } = useParams(); // Get the share token from URL params
  const { addToCart, subtotal, tax, total } = useCart();
  
  // Shared cart state
  const [sharedItems, setSharedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Payment state management
  const [showTipModal, setShowTipModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [userPaymentAmount, setUserPaymentAmount] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [tipInCents, setTipInCents] = useState(0);
  const [baseAmountInCents, setBaseAmountInCents] = useState(null);
  const [sharedOrderId, setSharedOrderId] = useState(null);

  // Parse shared cart data from secure token
  useEffect(() => {
    const fetchSecureShareData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!shareToken) {
          setError('Invalid share link - no token provided');
          return;
        }

        // Call the secure backend API to get share session data
        const response = await fetch(`http://localhost:8000/api/orders/share/${shareToken}/`);
        const result = await response.json();
        
        if (!response.ok || !result.success) {
          if (response.status === 404) {
            setError('Share link not found or has been removed');
          } else if (response.status === 410) {
            setError('Share link has expired');
          } else {
            setError(result.error || 'Failed to load shared cart');
          }
          return;
        }

        const shareData = result.data;
        
        // Set the shared order ID if available
        if (result.order_id) {
          setSharedOrderId(result.order_id);
          sessionStorage.setItem("temp_order_id", result.order_id);
        }

        // Handle different share types
        if (shareData.type === 'cart_split' && shareData.remaining_items) {
          setSharedItems(shareData.remaining_items);
          
          // Initialize selected items state
          const initialSelection = {};
          shareData.remaining_items.forEach(item => {
            initialSelection[item.id] = {
              selected: false,
              quantity: 0,
              maxQuantity: item.quantity
            };
          });
          setSelectedItems(initialSelection);
        } else if (shareData.type === 'bill_split' && shareData.remaining_items) {
          // Handle simple bill split - redirect to split payment page
          const splitItem = shareData.remaining_items[0];
          if (splitItem && shareData.metadata) {
            navigate(`/split-payment?amount=${Math.round(splitItem.price * 100)}&total=${shareData.metadata.total_amount}&order_id=${result.order_id}`);
            return;
          }
        } else {
          setError('Invalid share data format');
          return;
        }
        
      } catch (err) {
        console.error('Error fetching secure share data:', err);
        setError('Failed to load shared cart - please check your connection');
      } finally {
        setLoading(false);
      }
    };

    fetchSecureShareData();
  }, [shareToken, navigate]);

  // Calculate selected items total
  const calculateSelectedTotal = useCallback(() => {
    return Object.entries(selectedItems).reduce((total, [itemId, selection]) => {
      if (selection.selected && selection.quantity > 0) {
        const item = sharedItems.find(item => item.id === itemId);
        if (item) {
          return total + (item.price * selection.quantity);
        }
      }
      return total;
    }, 0);
  }, [selectedItems, sharedItems]);

  // Handle item selection
  const handleItemSelect = (itemId, isSelected) => {
    setSelectedItems(current => ({
      ...current,
      [itemId]: {
        ...current[itemId],
        selected: isSelected,
        quantity: isSelected ? 1 : 0
      }
    }));
  };

  // Handle quantity change
  const handleQuantityChange = (itemId, newQuantity) => {
    setSelectedItems(current => {
      const currentSelection = current[itemId];
      const maxQuantity = currentSelection?.maxQuantity || 1;
      
      // Ensure quantity is within bounds
      const clampedQuantity = Math.max(0, Math.min(newQuantity, maxQuantity));
      
      return {
        ...current,
        [itemId]: {
          ...current[itemId],
          quantity: clampedQuantity,
          selected: clampedQuantity > 0
        }
      };
    });
  };

  // Add selected items to cart and proceed to payment
  const handleAddToCartAndPay = () => {
    const itemsToAdd = [];
    
    Object.entries(selectedItems).forEach(([itemId, selection]) => {
      if (selection.selected && selection.quantity > 0) {
        const item = sharedItems.find(item => item.id === itemId);
        if (item) {
          itemsToAdd.push({
            ...item,
            quantity: selection.quantity
          });
        }
      }
    });

    if (itemsToAdd.length === 0) {
      alert('Please select at least one item to continue');
      return;
    }

    // Add items to cart
    itemsToAdd.forEach(item => {
      addToCart(item);
    });

    // Navigate to cart page
    navigate('/cart');
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/QROrderPay');
  };

  // Payment handler functions
  const handleTipConfirm = async (tipAmount) => {
    try {
      const baseAmount = userPaymentAmount || Math.round(calculateSelectedTotal() * 100);
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

  const handlePayNow = () => {
    const totalInCents = Math.round(calculateSelectedTotal() * 100);
    setUserPaymentAmount(totalInCents);
    setShowTipModal(true);
  };

  // Update payment amount whenever selection changes
  useEffect(() => {
    const total = calculateSelectedTotal();
    if (total > 0) {
      const totalInCents = Math.round(total * 100);
      updatePaymentAmount && updatePaymentAmount(totalInCents);
    }
  }, [selectedItems, calculateSelectedTotal, updatePaymentAmount]);

  const selectedTotal = calculateSelectedTotal();

  // Loading state
  if (loading) {
    return (
      <div className="shared-cart-page">
        <div className="shared-cart-header">
          <div className="header-content">
            <button className="back-button" onClick={handleBack}>
              <ArrowLeft size={24} />
            </button>
            <div className="header-text">
              <h1>Loading Shared Cart</h1>
            </div>
            <div className="w-6"></div>
          </div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading shared items...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="shared-cart-page">
        <div className="shared-cart-header">
          <div className="header-content">
            <button className="back-button" onClick={handleBack}>
              <ArrowLeft size={24} />
            </button>
            <div className="header-text">
              <h1>Shared Cart</h1>
            </div>
            <div className="w-6"></div>
          </div>
        </div>
        <div className="error-container">
          <div className="error-message">
            <h3>Unable to Load Shared Cart</h3>
            <p>{error}</p>
            <button onClick={() => navigate('/QROrderPay')} className="back-to-menu-btn">
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasSelectedItems = Object.values(selectedItems).some(item => item.selected && item.quantity > 0);

  return (
    <div className="shared-cart-page">
      {/* Header */}
      <div className="shared-cart-header">
        <div className="header-content">
          <button className="back-button" onClick={handleBack}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-text">
            <h1>Shared Cart</h1>
            <p>Select items to pay for</p>
          </div>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="shared-cart-content">
        {/* Items List */}
        <div className="shared-items-container">
          <h2 className="shared-items-title">Available Items</h2>
          <div className="shared-items-list">
            {sharedItems.map((item, index) => {
              const selection = selectedItems[item.id] || { selected: false, quantity: 0, maxQuantity: item.quantity };
              
              return (
                <div key={item.id} className={`shared-item ${selection.selected ? 'selected' : ''}`}>
                  <div className="shared-item-content">
                    <div className="shared-item-checkbox">
                      <input
                        type="checkbox"
                        checked={selection.selected}
                        onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                        className="item-checkbox"
                      />
                    </div>
                    
                    <div className="shared-item-details">
                      <h3 className="shared-item-name">{item.name}</h3>
                      {item.options && (
                        <p className="shared-item-options">
                          Select Option: {item.options}
                        </p>
                      )}
                      {item.description && (
                        <p className="shared-item-description">
                          {item.description}
                        </p>
                      )}
                      <p className="shared-item-price">
                        £{item.price.toFixed(2)} each
                      </p>
                      <p className="shared-item-available">
                        {item.quantity} available
                      </p>
                    </div>

                    <div className="shared-item-controls">
                      {selection.selected && (
                        <div className="quantity-controls">
                          <button
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.id, selection.quantity - 1)}
                            disabled={selection.quantity <= 1}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="quantity-display">{selection.quantity}</span>
                          <button
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.id, selection.quantity + 1)}
                            disabled={selection.quantity >= selection.maxQuantity}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selection Summary */}
        {hasSelectedItems && (
          <div className="selection-summary">
            <div className="selected-summary-header">
              <h3>Selected Items</h3>
              <p className="selected-total">Total: £{selectedTotal.toFixed(2)}</p>
            </div>
            
            <button 
              className="add-to-cart-btn"
              onClick={handleAddToCartAndPay}
              disabled={!hasSelectedItems}
            >
              Add to Cart & Continue
            </button>
          </div>
        )}

        {/* No Selection State */}
        {!hasSelectedItems && (
          <div className="no-selection-message">
            <p>Select items above to continue with payment</p>
          </div>
        )}

        {/* Tip Modal */}
        {showTipModal && (
          <TipModal
            isOpen={showTipModal}
            onClose={() => setShowTipModal(false)}
            onConfirm={handleTipConfirm}
            baseAmount={selectedTotal}
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
                  orderId={sharedOrderId}
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

export default SharedCartPage;
