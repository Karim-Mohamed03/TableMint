import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import axios from "axios";
import CheckoutForm from "./components/CheckoutForm";
import SplitBillModal from "./components/SplitBillModal";
import TipModal from "./components/TipModal";
import ItemSelectionModal from "./components/ItemSelectionModal";
import "./PaymentPage.css";

// PaymentPage Component
export default function PaymentPage({ 
  stripePromise, 
  clientSecret, 
  updatePaymentAmount, 
  createPaymentIntent, 
  isCreatingPaymentIntent,
  restaurantBranding,
  isBrandingLoaded
}) {
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [userPaymentAmount, setUserPaymentAmount] = useState(null);
  const [splitDetails, setSplitDetails] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);
  // New state to track tip separately - moved to top level
  const [tipInCents, setTipInCents] = useState(0);
  const [baseAmountInCents, setBaseAmountInCents] = useState(null);
  // New state for selected items
  const [selectedItemsDetails, setSelectedItemsDetails] = useState(null);
  
  // Hardcoded order ID for testing
  const testOrderId = "NoLCNb59WpHHUGuinqUQFU7rqg4F";
  
  // Calculate total from order details
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
  
  // Calculate order total from line items
  const { total: orderTotal, currency } = calculateOrderTotal();
  
  // Update base amount when order total changes - moved to top level section
  useEffect(() => {
    setBaseAmountInCents(orderTotal);
  }, [orderTotal]);
  
  // Update payment amount in parent component when order total changes
  useEffect(() => {
    const { total } = calculateOrderTotal();
    if (userPaymentAmount) {
      updatePaymentAmount(userPaymentAmount);
    } else {
      updatePaymentAmount(total);
    }
  }, [orderDetails, userPaymentAmount, updatePaymentAmount]);
  
  // Fetch order details on page load
  useEffect(() => {
    fetchOrderDetails(testOrderId);
  }, []);
  
  // Function to fetch order details from backend
  const fetchOrderDetails = async (orderId) => {
    setOrderLoading(true);
    setOrderError(null);
    
    try {
      const response = await axios.get(`http://localhost:8000/api/orders/get/${orderId}/`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
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
  
  const toggleSplitModal = () => {
    setShowSplitModal(!showSplitModal);
  };
  
  const toggleTipModal = () => {
    setShowTipModal(!showTipModal);
  };
  
  const toggleItemsModal = () => {
    setShowItemsModal(!showItemsModal);
  };
  
  const handleSplitConfirm = (splitInfo) => {
    setUserPaymentAmount(splitInfo.amountToPay);
    setSplitDetails(splitInfo);
    setShowSplitModal(false);
    // Show tip modal after confirming split amount
    setShowTipModal(true);
  };
  
  // Handle selection of specific items
  const handleItemSelectionConfirm = (selection) => {
    setSelectedItemsDetails(selection);
    setUserPaymentAmount(selection.totalAmount);
    setBaseAmountInCents(selection.totalAmount);
    setShowItemsModal(false);
    // Show tip modal after confirming item selection
    setShowTipModal(true);
  };
  
  const handleTipConfirm = async (tipAmount) => {
    try {
      // Get base amount - either from split details, selected items, or total order
      const baseAmount = userPaymentAmount || calculateOrderTotal().total;
      
      // Convert tipAmount from dollars to cents (multiply by 100)
      const tipInCents = tipAmount * 100;
      const finalAmount = baseAmount + tipInCents;
      
      // Save the tip and base amounts for later use
      setTipInCents(tipInCents);
      setBaseAmountInCents(baseAmount);
      
      // Save the tipAmount for display
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
    setSplitDetails(null);
    setSelectedItemsDetails(null);
    setShowTipModal(true);
  };
  
  const handlePaySpecificAmount = async () => {
    setSelectedItemsDetails(null);
    toggleSplitModal();
  };
  
  const handlePayForMyItems = async () => {
    setSplitDetails(null);
    toggleItemsModal();
  };
  
  const options = clientSecret ? { clientSecret } : {};
  
  // Get container class name based on branding configuration
  const getContainerClassName = () => {
    const hasBackgroundImage = restaurantBranding.background_image_url && restaurantBranding.show_background_image;
    console.log("Has background image?", hasBackgroundImage);
    return `payment-container ${hasBackgroundImage ? 'payment-container-with-bg' : ''}`;
  };
  
  // Updated getContainerStyle to apply background image only to the top portion
  const getContainerStyle = () => {
    const hasBackgroundImage = restaurantBranding.background_image_url && restaurantBranding.show_background_image;
    console.log("Background image URL:", restaurantBranding.background_image_url);
    if (hasBackgroundImage) {
      return {
        '--bg-image': `url(${restaurantBranding.background_image_url})`,
      };
    }
    return {};
  };
  
  const renderRestaurantBranding = () => {
    if (!isBrandingLoaded) {
      console.log("Branding not loaded yet");
      return null;
    }
    
    const { logo_url, name, show_logo_on_receipt } = restaurantBranding;
    console.log("Restaurant branding in render:", { logo_url, name, show_logo_on_receipt });
    
    return (
      <div className="restaurant-branding">
        {logo_url && show_logo_on_receipt ? (
          <div className="logo-container">
            <img 
              src={logo_url} 
              alt={`${name} logo`}
              className="restaurant-logo"
              onLoad={() => console.log("Logo image loaded successfully")}
              onError={(e) => {
                console.error("Failed to load logo image:", logo_url, e);
                // Don't hide the image, try to display a fallback or retry
                // Just in case it's a CORS issue, attempt with crossOrigin attribute
                e.target.crossOrigin = "anonymous";
                // If it's a relative path issue, try adding the full domain
                if (!logo_url.startsWith('http')) {
                  e.target.src = `http://localhost:8000${logo_url.startsWith('/') ? '' : '/'}${logo_url}`;
                }
              }}
            />
          </div>
        ) : (
          <div className="restaurant-name-only">
            <h2>{name}</h2>
          </div>
        )}
        
        <p className="table-number">Table 12</p>
        
        {/* View menu button commented out
        <div className="view-menu-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          View the menu
        </div>
        */}
      </div>
    );
  };
  
  // Format currency for display - updated to remove division by 100
  const formatCurrency = (amount, currency = 'GBP') => {
    if (!amount && amount !== 0) return '£0';
    
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    });
    
    // No longer dividing by 100 since the amount is already in the correct format
    return formatter.format(amount / 100);
  };
  
  // Add a direct image loading test
  useEffect(() => {
    if (restaurantBranding.logo_url) {
      console.log("Testing direct image loading for:", restaurantBranding.logo_url);
      
      // Create a test image element
      const testImage = new Image();
      testImage.crossOrigin = "anonymous"; // Try with CORS enabled
      testImage.onload = () => {
        console.log("Image loaded successfully in test:", restaurantBranding.logo_url);
      };
      testImage.onerror = (e) => {
        console.error("Failed to load image in test:", restaurantBranding.logo_url, e);
        // Try with full URL if it's a relative path
        if (!restaurantBranding.logo_url.startsWith('http')) {
          const fullUrl = `http://localhost:8000${restaurantBranding.logo_url.startsWith('/') ? '' : '/'}${restaurantBranding.logo_url}`;
          console.log("Retrying with full URL:", fullUrl);
          testImage.src = fullUrl;
        }
      };
      testImage.src = restaurantBranding.logo_url;
    }
    
    if (restaurantBranding.background_image_url) {
      console.log("Testing direct background image loading for:", restaurantBranding.background_image_url);
      
      // Create a test image element
      const testImage = new Image();
      testImage.crossOrigin = "anonymous"; // Try with CORS enabled
      testImage.onload = () => {
        console.log("Background image loaded successfully in test:", restaurantBranding.background_image_url);
      };
      testImage.onerror = (e) => {
        console.error("Failed to load background image in test:", restaurantBranding.background_image_url, e);
        // Try with full URL if it's a relative path
        if (!restaurantBranding.background_image_url.startsWith('http')) {
          const fullUrl = `http://localhost:8000${restaurantBranding.background_image_url.startsWith('/') ? '' : '/'}${restaurantBranding.background_image_url}`;
          console.log("Retrying with full URL:", fullUrl);
          testImage.src = fullUrl;
        }
      };
      testImage.src = restaurantBranding.background_image_url;
    }
  }, [restaurantBranding.logo_url, restaurantBranding.background_image_url]);
  
  // Render a loading spinner when payment intent is being created or order is loading
  if (paymentProcessing || isCreatingPaymentIntent) {
    return (
      <div className="payment-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Preparing payment...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={getContainerClassName()} style={getContainerStyle()}>
      {/* Restaurant Branding Section */}
      {renderRestaurantBranding()}
      
      <div className="payment-header">
        <h1>Pay your bill</h1>
        <p className="subtitle">{formatCurrency(orderTotal, currency)}</p>
      </div>
      
      {orderLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading order details...</p>
        </div>
      ) : orderError ? (
        <div className="error-message">
          <p>Error loading order: {orderError}</p>
        </div>
      ) : orderDetails ? (
        <div className="order-summary">
          <div className="order-items">
            <h2>Order Items</h2>
            {orderDetails.line_items?.map((item, index) => (
              <div className="order-item" key={index}>
                <div className="quantity-badge">×{item.quantity}</div>
                <div className="item-name">{item.name}</div>
                <div className="item-price">
                  {formatCurrency(
                    parseInt(item.quantity, 10) * item.base_price_money?.amount,
                    item.base_price_money?.currency
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="order-total">
            <div className="total-row">
              <span>Subtotal</span>
              <span className="total-amount">
                {orderTotal ? formatCurrency(orderTotal, currency) : '0.00'}
              </span>
            </div>
            
            {userPaymentAmount && userPaymentAmount !== orderTotal && (
              <>
                <div className="total-row tip-row">
                  <span>Tip</span>
                  <span className="tip-amount">
                    {formatCurrency(userPaymentAmount - baseAmountInCents, currency)}
                  </span>
                </div>
                
                <div className="total-row final-row">
                  <span>Final Total</span>
                  <span className="final-amount">
                    {formatCurrency(userPaymentAmount, currency)}
                  </span>
                </div>
              </>
            )}
            
            <div className="tax-disclaimer">
              <small>Inclusive of all taxes and charges</small>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-order">
          <p>No order details available</p>
        </div>
      )}
      
      {!showCheckout ? (
        <div className="payment-options">
          <button className="payment-option full-amount" onClick={handlePayFullAmount}>
            <div className="option-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="option-text">
              <h3>Pay full amount</h3>
              <p>Pay the entire bill yourself</p>
            </div>
            <div className="option-amount">
              {formatCurrency(orderTotal, currency)}
            </div>
          </button>
          
          <button className="payment-option specific-amount" onClick={handlePaySpecificAmount}>
            <div className="option-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 5H19V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 19H5V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="option-text">
              <h3>Let's split the bill!</h3>
              <p>Split the bill with others</p>
            </div>
            <div className="option-amount">
              {splitDetails ? formatCurrency(userPaymentAmount, currency) : 'Custom'}
            </div>
          </button>
          
          <button className="payment-option items-amount" onClick={handlePayForMyItems}>
            <div className="option-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="option-text">
              <h3>Pay for my items</h3>
              <p>Only pay for what you ordered</p>
            </div>
            <div className="option-amount">
              {selectedItemsDetails ? formatCurrency(selectedItemsDetails.totalAmount, currency) : 'Select items'}
            </div>
          </button>
        </div>
      ) : (
        <div className="payment-section">
          {clientSecret ? (
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm 
                baseAmount={baseAmountInCents} 
                tipAmount={tipInCents}
                orderId={orderDetails?.id || testOrderId}
              />
            </Elements>
          ) : (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Preparing payment form...</p>
            </div>
          )}
        </div>
      )}
      
      <SplitBillModal 
        isOpen={showSplitModal} 
        onClose={toggleSplitModal} 
        baseAmount={orderTotal} 
        tip={0} 
        totalAmount={orderTotal}
        onConfirm={handleSplitConfirm}
      />
      
      <TipModal
        isOpen={showTipModal}
        onClose={toggleTipModal}
        currentTip={0}
        baseAmount={userPaymentAmount || orderTotal}
        onConfirm={handleTipConfirm}
      />
      
      {/* Items selection modal - updated to use ItemSelectionModal component */}
      <div className={`items-modal-overlay ${showItemsModal ? 'active' : ''}`} onClick={toggleItemsModal}>
        <div className="items-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-drag-handle"></div>
          </div>
          
          <ItemSelectionModal
            isOpen={showItemsModal}
            onClose={toggleItemsModal}
            items={orderDetails?.line_items}
            onConfirm={handleItemSelectionConfirm}
          />
        </div>
      </div>
      
      <style jsx>{`
        .payment-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 24px;
        }
        
        .payment-option {
          display: flex;
          align-items: center;
          background-color: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 16px;
          transition: all 0.2s ease;
          cursor: pointer;
          text-align: left;
        }
        
        .payment-option:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border-color: var(--primary-color);
        }
        
        .option-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background-color: #f5f5f7;
          border-radius: 50%;
          margin-right: 16px;
          color: var(--primary-color);
        }
        
        .option-text {
          flex: 1;
        }
        
        .option-text h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1d1d1f;
        }
        
        .option-text p {
          margin: 4px 0 0;
          font-size: 14px;
          color: #86868b;
        }
        
        .option-amount {
          font-size: 18px;
          font-weight: 600;
          color: var(--primary-color);
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
        }
        
        /* Items Modal Styles */
        .items-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        
        .items-modal-overlay.active {
          opacity: 1;
          pointer-events: auto;
        }
        
        .items-modal {
          background: white;
          width: 100%;
          max-width: 500px;
          border-radius: 20px 20px 0 0;
          padding: 16px 0 0;
          transform: translateY(100%);
          transition: transform 0.3s ease;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .items-modal-overlay.active .items-modal {
          transform: translateY(0);
        }
        
        .modal-header {
          display: flex;
          justify-content: center;
          padding-bottom: 8px;
        }
        
        .modal-drag-handle {
          width: 40px;
          height: 5px;
          background-color: #e0e0e0;
          border-radius: 3px;
        }
        /* Updated Order summary styles */
        .order-summary {
          background: #ffffff;
          border-radius: 12px;
          padding: 20px;
          margin-top: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .order-items {
          margin-bottom: 24px;
        }
        
        .order-items h2 {
          font-size: 18px;
          margin-bottom: 16px;
          color: #1d1d1f;
        }
        
        .order-item {
          display: flex;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f5f5f7;
        }
        
        .quantity-badge {
          background-color: #f5f5f7;
          color: #333;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 500;
          margin-right: 12px;
        }
        
        .item-name {
          flex: 1;
          font-size: 16px;
          font-weight: 500;
          margin-left: 0;
        }
        
        .item-price {
          font-weight: 600;
          color: #1d1d1f;
          text-align: right;
        }
        
        .order-total {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 2px solid #f5f5f7;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .total-row.tip-row {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed #e0e0e0;
        }
        
        .total-row.final-row {
          margin-top: 8px;
          padding-top: 12px;
          border-top: 1px solid #e0e0e0;
          font-size: 20px;
        }
        
        .tip-amount {
          color: #34a853;
        }
        
        .final-amount {
          color: #0071e3;
          font-weight: 700;
        }
        
        .total-amount {
          color: var(--primary-color);
        }
        
        .currency-symbol {
          font-weight: 700;
          margin-right: 2px;
        }
        
        .tax-disclaimer {
          text-align: right;
          color: #86868b;
          font-size: 12px;
          margin-top: 4px;
        }
        
        .error-message {
          background-color: #ffebee;
          color: #d32f2f;
          padding: 16px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
        }
        
        .empty-order {
          background-color: #f5f5f7;
          padding: 40px 16px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
          color: #86868b;
        }
        
        .payment-header {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .payment-header h1 {
          margin-bottom: 4px;
        }
        
        .subtitle {
          color: #000000; 
          margin: 0;
          font-size: 22px; 
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
