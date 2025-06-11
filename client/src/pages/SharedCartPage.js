import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
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

  // Parse shared cart data from URL
  useEffect(() => {
    const parseSharedData = () => {
      try {
        setLoading(true);
        const encodedData = searchParams.get('data');
        
        if (!encodedData) {
          setError('No shared cart data found');
          return;
        }

        // Decode the shared data
        const decodedData = JSON.parse(decodeURIComponent(encodedData));
        
        if (!decodedData.remainingItems || decodedData.remainingItems.length === 0) {
          setError('No items found in shared cart');
          return;
        }

        setSharedItems(decodedData.remainingItems);
        
        // Initialize selected items state
        const initialSelection = {};
        decodedData.remainingItems.forEach(item => {
          initialSelection[item.id] = {
            selected: false,
            quantity: 0,
            maxQuantity: item.quantity
          };
        });
        setSelectedItems(initialSelection);
        
      } catch (err) {
        console.error('Error parsing shared cart data:', err);
        setError('Invalid shared cart link');
      } finally {
        setLoading(false);
      }
    };

    parseSharedData();
  }, [searchParams]);

  // Calculate selected items total
  const calculateSelectedTotal = useCallback(() => {
    let total = 0;
    Object.entries(selectedItems).forEach(([itemId, selection]) => {
      if (selection.selected && selection.quantity > 0) {
        const item = sharedItems.find(item => item.id === itemId);
        if (item) {
          total += item.price * selection.quantity;
        }
      }
    });
    return total;
  }, [selectedItems, sharedItems]);

  // Handle item selection
  const handleItemSelect = (itemId, selected) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected,
        quantity: selected ? Math.min(1, prev[itemId].maxQuantity) : 0
      }
    }));
  };

  // Handle quantity change
  const handleQuantityChange = (itemId, change) => {
    setSelectedItems(prev => {
      const current = prev[itemId];
      const newQuantity = Math.max(0, Math.min(current.maxQuantity, current.quantity + change));
      
      return {
        ...prev,
        [itemId]: {
          ...current,
          quantity: newQuantity,
          selected: newQuantity > 0
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
    const totalInCents = Math.round(calculateSelectedTotal() * 100);
    if (updatePaymentAmount) {
      updatePaymentAmount(totalInCents);
    }
  }, [selectedItems, updatePaymentAmount, calculateSelectedTotal]);

  if (loading) {
    return (
      <div className="shared-cart-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading shared cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-cart-page">
        <div className="error-container">
          <div className="error-icon">
            <ShoppingCart size={48} />
          </div>
          <h2 className="error-title">Oops!</h2>
          <p className="error-message">{error}</p>
          <button className="error-button" onClick={handleBack}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const selectedTotal = calculateSelectedTotal();
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
                            onClick={() => handleQuantityChange(item.id, -1)}
                            disabled={selection.quantity <= 0}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="quantity-display">{selection.quantity}</span>
                          <button
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.id, 1)}
                            disabled={selection.quantity >= selection.maxQuantity}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      )}
                      
                      <div className="shared-item-total">
                        {selection.selected && selection.quantity > 0 && (
                          <p className="item-total-price">
                            £{(item.price * selection.quantity).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < sharedItems.length - 1 && <div className="shared-item-divider"></div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Items Summary */}
        {hasSelectedItems && (
          <div className="selected-summary">
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
                  baseAmountInCents={baseAmountInCents}
                  tipInCents={tipInCents}
                  currency="GBP"
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
