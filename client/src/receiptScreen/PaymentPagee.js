import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CheckoutForm from "./components/CheckoutForm";
import TipModal from "./components/TipModal";
import SplitBillModal from "./components/SplitBillModal";
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
  const [showTipModal, setShowTipModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [userPaymentAmount, setUserPaymentAmount] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [tipInCents, setTipInCents] = useState(0);
  const [baseAmountInCents, setBaseAmountInCents] = useState(null);
  
  // Split bill and item selection state
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [splitDetails, setSplitDetails] = useState(null);
  const [selectedItemsDetails, setSelectedItemsDetails] = useState(null);
  
  // React Router navigation hook
  const navigate = useNavigate();
  
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
  
  // Get temporary order ID instead of hardcoded test ID
  const tempOrderId = generateTempOrderId();
  
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
  
  // Update base amount when order total changes
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
    // Use URL order ID if available, otherwise use temp ID
    const orderIdFromUrl = new URLSearchParams(window.location.search).get("order_id");
    const orderIdToUse = orderIdFromUrl || tempOrderId;
    fetchOrderDetails(orderIdToUse);
  }, [tempOrderId]);
  
  // Function to fetch order details from backend
  const fetchOrderDetails = async (orderId) => {
    setOrderLoading(true);
    setOrderError(null);
    
    try {
      // Get restaurant context from session storage
      let restaurantId = null;
      let tableToken = null;

      // Try to get restaurant context
      const storedRestaurantContext = sessionStorage.getItem('restaurant_context');
      if (storedRestaurantContext) {
        try {
          const restaurantData = JSON.parse(storedRestaurantContext);
          restaurantId = restaurantData.id;
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
          // If we don't have restaurant_id from restaurant context, try to get it from table context
          if (!restaurantId && tableData.restaurant_id) {
            restaurantId = tableData.restaurant_id;
          }
        } catch (e) {
          console.error('Failed to parse table context:', e);
        }
      }

      // Build URL with restaurant context parameters
      const url = new URL(`http://localhost:8000/api/orders/${orderId}/`);
      if (restaurantId) {
        url.searchParams.append('restaurant_id', restaurantId);
      }
      if (tableToken) {
        url.searchParams.append('table_token', tableToken);
      }

      console.log('Fetching order details with restaurant context:', { restaurantId, tableToken });

      const response = await axios.get(url.toString(), {
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
  
  const toggleTipModal = () => {
    setShowTipModal(!showTipModal);
  };
  
  const handleTipConfirm = async (tipAmount) => {
    try {
      const baseAmount = userPaymentAmount || calculateOrderTotal().total;
      const tipInCents = tipAmount;
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

  const handleViewMenu = () => {
    navigate('/menu');
  };

  // Split bill handler functions
  const toggleSplitModal = () => {
    setShowSplitModal(!showSplitModal);
  };

  const handleSplitConfirm = (splitData) => {
    setSplitDetails(splitData);
    setUserPaymentAmount(splitData.amountToPay);
    setShowSplitModal(false);
    setShowTipModal(true);
  };

  // Item selection handler functions  
  const toggleItemsModal = () => {
    setShowItemsModal(!showItemsModal);
  };

  const handleItemSelectionConfirm = (itemData) => {
    setSelectedItemsDetails(itemData);
    setUserPaymentAmount(itemData.totalAmount);
    setShowItemsModal(false);
    setShowTipModal(true);
  };

  const handlePaySpecificAmount = () => {
    setShowSplitModal(true);
  };

  const handlePayForMyItems = () => {
    setShowItemsModal(true);
  };
  
  const options = clientSecret ? { clientSecret } : {};
  
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
    <div className="payment-page">
      {/* Hero Section with Background Image */}
      <div 
        className="hero-section"
        style={{
          backgroundImage: restaurantBranding?.background_image_url && restaurantBranding?.show_background_image 
            ? `url(${restaurantBranding.background_image_url})` 
            : 'none'
        }}
      >
        {/* Restaurant Branding */}
        <div className="restaurant-branding">
          {isBrandingLoaded && restaurantBranding?.logo_url && restaurantBranding?.show_logo_on_receipt ? (
            <div className="logo-container">
              <img 
                src={restaurantBranding.logo_url} 
                alt={`${restaurantBranding.name} logo`}
                className="restaurant-logo"
              />
            </div>
          ) : isBrandingLoaded && restaurantBranding?.name ? (
            <div className="restaurant-name">
              <h1>{restaurantBranding.name}</h1>
            </div>
          ) : null}
          
          <div className="table-info">
            <span className="table-number">Table 12</span>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        {/* Payment Header */}
        <div className="payment-header">
          <h2>Pay your bill</h2>
          <div className="total-amount">
            {formatCurrency(orderTotal, currency)}
          </div>
        </div>
        
        {/* Order Items */}
        {orderLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading order details...</p>
          </div>
        ) : orderError ? (
          <div className="error-message">
            <p>Error loading order: {orderError}</p>
          </div>
        ) : orderDetails?.line_items ? (
          <div className="order-items">
            {orderDetails.line_items.map((item, index) => (
              <div className="order-item" key={index}>
                <div className="item-info">
                  <span className="quantity">{item.quantity}</span>
                  <span className="item-name">{item.name}</span>
                </div>
                <div className="item-price">
                  {formatCurrency(
                    parseInt(item.quantity, 10) * item.base_price_money?.amount,
                    item.base_price_money?.currency
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        
        {/* Payment Options */}
        {!showCheckout ? (
          <div className="payment-options">
            <button className="payment-option primary" onClick={handlePayFullAmount}>
              <div className="option-content">
                <span className="option-title">Pay the full amount</span>
                <span className="option-subtitle">Pay for everyone's receipt</span>
              </div>
              <div className="option-amount">
                {formatCurrency(orderTotal, currency)}
              </div>
            </button>
            
            <button className="payment-option" onClick={handlePaySpecificAmount}>
              <div className="option-content">
                <span className="option-title">Split the bill</span>
                <span className="option-subtitle">Pay only your share</span>
              </div>
            </button>

            <button className="payment-option" onClick={handlePayForMyItems}>
              <div className="option-content">
                <span className="option-title">Select items</span>
                <span className="option-subtitle">Choose what you're paying for</span>
              </div>
            </button>
            
            <button className="payment-option view-menu-option" onClick={handleViewMenu}>
              <div className="option-content">
                <span className="option-title">View Menu</span>
                <span className="option-subtitle">Browse our full menu</span>
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
                  orderId={orderDetails?.id || tempOrderId}
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
      </div>
      
      {/* Modals */}
      <TipModal
        isOpen={showTipModal}
        onClose={toggleTipModal}
        currentTip={0}
        baseAmount={userPaymentAmount || orderTotal}
        onConfirm={handleTipConfirm}
      />

      {/* Split Bill Modal */}
      <SplitBillModal
        isOpen={showSplitModal}
        onClose={toggleSplitModal}
        totalAmount={orderTotal}
        onConfirm={handleSplitConfirm}
      />

      {/* Item Selection Modal */}
      <ItemSelectionModal
        isOpen={showItemsModal}
        onClose={toggleItemsModal}
        items={orderDetails?.line_items || []}
        onConfirm={handleItemSelectionConfirm}
      />
      
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Satoshi:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        .payment-page {
          width: 100%;
          max-width: 100%;
          min-height: 100vh;
          height: 100%;
          background-color: white;
          position: relative;
          overflow-x: hidden;
        }
        
        .hero-section {
          height: 25vh;
          max-height: 220px;
          width: 100%;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #2c3e50;
        }
        
        .hero-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.65);
          z-index: 1;
        }
        
        .restaurant-branding {
          position: absolute;
          bottom: -50px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          text-align: center;
          color: white;
        }
        
        .logo-container {
          margin-bottom: 8px;
        }
        
        .restaurant-logo {
          width: 100px;
          height: 100px;
          border-radius: 16px;
          object-fit: cover;
          background: white;
          padding: 8px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
          border: 3px solid white;
        }
        
        .restaurant-name h1 {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          background: white;
          color: #1a1a1a;
          padding: 8px;
          border-radius: 12px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
          border: 3px solid white;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          line-height: 1.2;
        }
        
        .table-info {
          background: transparent;
          border-radius: 16px;
          padding: 4px 10px;
          display: inline-block;
          margin-top: 10px;
          color: #666;
        }
        
        .table-number {
          font-size: 14px;
        }
        
        .main-content {
          padding: 70px 16px 24px;
          width: 100%;
          margin: 0 auto;
        }
        
        .payment-header {
          text-align: center;
          margin-bottom: 24px;
          padding-top: 10px;
        }
        
        .payment-header h2 {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 6px 0;
        }
        
        .total-amount {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
        }
        
        .order-items {
          background: white;
          border-radius: 16px;
          padding: 5px;
          margin-bottom: 20px;
          
        }
        
        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
        }
        
        .order-item:last-child {
          border-bottom: none;
        }
        
        .item-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0; /* For text truncation */
        }
        
        .quantity {
          background: #f8f9fa;
          color: #666;
          border-radius: 6px;
          padding: 3px 6px;
          font-size: 14px;
          font-weight: 600;
          min-width: 22px;
          text-align: center;
          flex-shrink: 0;
        }
        
        .item-name {
          font-size: 15px;
          color: #1a1a1a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .item-price {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
          padding-left: 8px;
          flex-shrink: 0;
        }
        
        .payment-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .payment-option {
          background: black;
          border: 2px solid #e9ecef;
          border-radius: 16px;
          padding: 16px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          width: 100%;
        }
        
        .payment-option:hover, .payment-option:active {
          border-color: #2ecc71;
        }
        
        .payment-option.primary {
          background: black;
          color: white;
          border-color: #1a1a1a;
        }
        
        .payment-option.primary:hover, .payment-option.primary:active {
          border-color: #2ecc71;
        }
        
        .option-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .option-title {
          font-size: 16px;
          font-weight: 600;
        }
        
        .option-subtitle {
          font-size: 13px;
          opacity: 0.7;
        }
        
        .option-amount {
          font-size: 16px;
          font-weight: 700;
          color: #2ecc71;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          height: 50vh;
        }
        
        .loading-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-message {
          background: #ffebee;
          color: #c62828;
          padding: 16px;
          border-radius: 12px;
          margin: 20px 0;
          text-align: center;
          font-size: 14px;
        }
        
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
        
        /* Mobile-specific media queries */
        @media (max-width: 480px) {
          .main-content {
            padding: 70px 12px 16px;
          }
          
          .payment-header h2 {
            font-size: 18px;
          }
          
          .total-amount {
            font-size: 18px;
          }
          
          .item-name {
            max-width: 180px;
          }
          
          .payment-option {
            padding: 14px;
          }
          
          .option-title {
            font-size: 15px;
          }
          
          .option-subtitle {
            font-size: 12px;
          }
        }
        
        /* For extremely small screens */
        @media (max-width: 320px) {
          .hero-section {
            height: 20vh;
          }
          
          .restaurant-logo, .restaurant-name h1 {
            width: 80px;
            height: 80px;
          }
          
          .main-content {
            padding-top: 50px;
          }
          
          .item-name {
            max-width: 140px;
          }
          
          .payment-option {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}