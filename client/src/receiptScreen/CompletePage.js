import React, { useEffect, useState } from "react";
import { Elements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import "./CompletePage.css";
import { formatCurrency } from '../utils/formatters';

const stripePromise = loadStripe("pk_test_51RaEPK4cqToPgSHS8ngSIwFZBod0famsu6BB0erJlCgBFVcYlO2pq2YFxFX2Ux0qp5IENkciYVzsGk7KxjaWb9xN00KTY0Xift", {
  stripeAccount: 'acct_1Rab3QQBvc6fFqZ8'  // Connected account ID
});

// Star Rating Modal Component
const StarRatingModal = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleStarClick = (starNumber) => {
    setRating(starNumber);
    // Redirect to Google review page with the specific place_id
    window.location.href = 'https://search.google.com/local/writereview?placeid=ChIJxZXYx7cEdkgRdgAOZ6OHOJw';
  };

  const handleStarHover = (starNumber) => {
    setHoveredStar(starNumber);
  };

  const handleStarLeave = () => {
    setHoveredStar(0);
  };

  if (!isOpen) return null;

  return (
    <div className="star-rating-modal">
      <div className="star-rating-content">
        <div className="modal-header">
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="rating-content">
          <h2>How was your experience?</h2>
          <p>We'd love to hear your feedback</p>

          <div className="stars-container">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`star ${(hoveredStar >= star || rating >= star) ? 'filled' : 'hollow'}`}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarHover(star)}
                onMouseLeave={handleStarLeave}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    stroke="#FFD700"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    fill={(hoveredStar >= star || rating >= star) ? "#FFD700" : "transparent"}
                  />
                </svg>
              </button>
            ))}
          </div>

          <div className="rating-labels">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .star-rating-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 10000;
          animation: modalFadeIn 0.3s ease-out;
        }
        
        @keyframes modalFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .star-rating-content {
          background: white;
          width: 100%;
          height: 100vh;
          border-radius: 0;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease-out;
          position: relative;
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .modal-header {
          padding: 20px 24px;
          display: flex;
          justify-content: flex-end;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .close-button {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          transition: all 0.2s ease;
        }
        
        .close-button:hover {
          background-color: #f5f5f5;
          color: #333;
        }
        
        .rating-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          text-align: center;
        }
        
        .rating-content h2 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 12px 0;
          color: #1d1d1f;
        }
        
        .rating-content p {
          font-size: 16px;
          color: #86868b;
          margin: 0 0 48px 0;
        }
        
        .stars-container {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .star {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .star:hover {
          transform: scale(1.1);
        }
        
        .star:active {
          transform: scale(0.95);
        }
        
        .rating-labels {
          display: flex;
          justify-content: space-between;
          width: 100%;
          max-width: 300px;
          font-size: 14px;
          color: #86868b;
          font-weight: 500;
        }
        
        @media (max-width: 768px) {
          .rating-content h2 {
            font-size: 24px;
          }
          
          .stars-container {
            gap: 12px;
          }
          
          .star svg {
            width: 40px;
            height: 40px;
          }
        }
        
        @media (max-width: 480px) {
          .rating-content {
            padding: 32px 20px;
          }
          
          .rating-content h2 {
            font-size: 22px;
          }
          
          .stars-container {
            gap: 8px;
          }
          
          .star svg {
            width: 36px;
            height: 36px;
          }
        }
      `}</style>
    </div>
  );
};

// Status icons
const SuccessIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#34C759" />
    <path d="M16.5 8.5L10.5 14.5L7.5 11.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#FF3B30" />
    <path d="M15 9L9 15M9 9L15 15" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ProcessingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#86868B" />
    <path d="M12 16V12M12 8H12.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 8.66667V12.6667C12 13.0203 11.8595 13.3594 11.6095 13.6095C11.3594 13.8595 11.0203 14 10.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V5.33333C2 4.97971 2.14048 4.64057 2.39052 4.39052C2.64057 4.14048 2.97971 4 3.33333 4H7.33333" stroke="#0071E3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 2H14V6" stroke="#0071E3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.66669 9.33333L14 2" stroke="#0071E3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const STATUS_CONTENT_MAP = {
  succeeded: {
    title: "Payment Successful",
    message: "Your payment was processed successfully.",
    icon: <SuccessIcon />,
  },
  processing: {
    title: "Processing Payment",
    message: "Your payment is being processed. This may take a moment.",
    icon: <ProcessingIcon />,
  },
  requires_payment_method: {
    title: "Payment Failed",
    message: "Your payment was not successful. Please try again.",
    icon: <ErrorIcon />,
  },
  default: {
    title: "Payment Issue",
    message: "Something went wrong with your payment. Please try again.",
    icon: <ErrorIcon />,
  }
};

// Right Arrow Icon Component
const RightArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Order Details Component
const OrderDetails = ({ items, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="order-details-container">
      {items.map((item, index) => (
        <div key={index} className="order-item">
          {item.image && (
            <div className="item-image">
              <img src={item.image} alt={item.name || item.item_name} />
            </div>
          )}
          <div className="item-info">
            <h3 className="item-name">{item.name || item.item_name}</h3>
            <p className="item-description">{item.description || item.item_description}</p>
            <p className="item-quantity">Quantity: {item.quantity}</p>
          </div>
          <div className="item-price">
            {formatCurrency(item.price || item.unit_price)}
          </div>
        </div>
      ))}
    </div>
  );
};

// Create a component that will be wrapped by Elements
const CompletePageContent = () => {
  const stripe = useStripe();
  const [status, setStatus] = useState("default");
  const [intentId, setIntentId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [paymentRecorded, setPaymentRecorded] = useState(false);
  const [recordError, setRecordError] = useState(null);
  const [baseAmount, setBaseAmount] = useState(null);
  const [tipAmount, setTipAmount] = useState(null);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('processing');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [orderItems, setOrderItems] = useState([]);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    // Get order ID from URL parameters and log the search string for debugging
    console.log("URL search string:", window.location.search);
    const params = new URLSearchParams(window.location.search);
    const orderIdFromUrl = params.get("order_id");
    const baseAmountFromUrl = params.get("base_amount");
    const tipAmountFromUrl = params.get("tip_amount");

    console.log("URL Parameters:", {
      orderIdFromUrl,
      baseAmountFromUrl,
      tipAmountFromUrl
    });

    // Get order ID and cart items from session storage
    const storedOrderId = sessionStorage.getItem("current_order_id");
    const storedCartItems = sessionStorage.getItem("cart_items");
    console.log("Stored order ID from session:", storedOrderId);
    console.log("Stored cart items from session:", storedCartItems);

    // Try to get cart items from session storage first
    try {
      if (storedCartItems) {
        const parsedCartItems = JSON.parse(storedCartItems);
        console.log("Parsed cart items:", parsedCartItems);
        if (Array.isArray(parsedCartItems) && parsedCartItems.length > 0) {
          setOrderItems(parsedCartItems);
        }
      }
    } catch (error) {
      console.error("Error parsing stored cart items:", error);
    }

    // If no items in session storage, try to fetch from API
    const finalOrderId = orderIdFromUrl || storedOrderId;
    if (finalOrderId && (!storedCartItems || !JSON.parse(storedCartItems)?.length)) {
      console.log("Fetching order items for order ID:", finalOrderId);
      axios.get(`https://tablemint.onrender.com/api/orders/${finalOrderId}`)
        .then(response => {
          console.log("Order items response:", response.data);
          if (response.data && response.data.items) {
            setOrderItems(response.data.items);
          } else if (response.data && response.data.order_items) {
            // Try alternative property name
            setOrderItems(response.data.order_items);
          } else {
            console.error("No items found in response:", response.data);
          }
        })
        .catch(error => {
          console.error("Error fetching order items:", error);
        });
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) {
        return;
      }

      console.log("Payment Intent:", {
        status: paymentIntent.status,
        metadata: paymentIntent.metadata,
        amount: paymentIntent.amount
      });

      setStatus(paymentIntent.status);
      setIntentId(paymentIntent.id);
      setPaymentAmount(paymentIntent.amount);

      // Update paymentStatus based on payment intent status
      if (paymentIntent.status === 'succeeded') {
        setPaymentStatus('success');
        // Set payment details for display
        setPaymentDetails({
          orderId: orderIdFromUrl || 
                 paymentIntent.metadata?.order_id ||
                 storedOrderId,
          amount: baseAmountFromUrl / 100,
          tipAmount: tipAmountFromUrl / 100,
          totalAmount: paymentIntent.amount
        });
      } else if (paymentIntent.status === 'processing') {
        setPaymentStatus('processing');
      } else if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'requires_action') {
        setPaymentStatus('error');
      }

      // Try to get order_id from multiple sources in order of preference
      const finalOrderId = orderIdFromUrl || 
                         paymentIntent.metadata?.order_id ||
                         storedOrderId;
      
      if (finalOrderId) {
        console.log("Using order ID:", finalOrderId, "Source:", 
          orderIdFromUrl ? "URL" : 
          paymentIntent.metadata?.order_id ? "Payment Intent Metadata" : 
          "Session Storage"
        );
        setOrderId(finalOrderId);
      } else {
        console.error("Could not find order_id in any source");
        setStatus("error");
        return;
      }

      // Calculate base and tip amounts correctly
      let total = paymentIntent.amount;
      let base = baseAmountFromUrl / 100;
      let tip = tipAmountFromUrl / 100;

      // Try to get amounts from URL first, then payment intent metadata
      if (baseAmountFromUrl && tipAmountFromUrl) {
        base = parseInt(baseAmountFromUrl, 10);
        // tip = parseInt(tipAmountFromUrl, 10);
      } else if (paymentIntent.metadata?.base_amount && paymentIntent.metadata?.tip_amount) {
        base = parseInt(paymentIntent.metadata.base_amount, 10);
        // tip = parseInt(paymentIntent.metadata.tip_amount, 10);
      } else {
        // Fallback: assume no tip
        base = total;
        tip = 0;
      }

      setBaseAmount(base);
      setTipAmount(tip);

      // If payment succeeded, record it to our backend
      if (paymentIntent.status === 'succeeded') {
        recordPaymentToPhillyCheesesteak(
          paymentIntent.id,
          total,
          finalOrderId,
          base,
          tip
        );
      }
    }).catch(error => {
      console.error("Error retrieving payment intent:", error);
      setStatus("error");
    });
  }, [stripe]);

  // Add a debug log when orderItems changes
  useEffect(() => {
    console.log("Current order items:", orderItems);
  }, [orderItems]);

  // Orders are now created only in the confirm modal, not after payment

  // Function to record successful payment to the backend and create Square external payment
  const recordPaymentToPhillyCheesesteak = async (paymentId, amount, orderId, baseAmt, tipAmt) => {
    try {
      // Orders are now created only in confirm modal, so we just record the payment
      console.log("Recording payment for existing order:", orderId);

      let restaurantId = null;
        let tableToken = null;
        let location_id = null;
        

        // Try to get restaurant context
        const storedRestaurantContext = sessionStorage.getItem('restaurant_context');
        if (storedRestaurantContext) {
          try {
            const restaurantData = JSON.parse(storedRestaurantContext);
            restaurantId = restaurantData.id;
            location_id = restaurantData.location_id; // Get location_id if available
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

        // Validate that we have restaurant context
        if (!restaurantId && !tableToken) {
          console.error("No restaurant context found in session storage");
          alert("Restaurant context is missing. Please scan the QR code again or refresh the page.");
          // setIsModalOpen(false);
          return;
        }

        console.log("Creating Square payment with context:", {
          restaurantId,
          tableToken,
          orderId,
          amount,
          tipAmount
        });
      

      // Record the payment in our database
      const response = await axios.post('https://tablemint.onrender.com/api/payments/record-philly-payment', {
        payment_id: paymentId,
        amount: amount,
        order_id: orderId,
        base_amount: baseAmt,
        tip_amount: tipAmt,
        location_id: location_id
      });

      if (response.data.success) {
        setPaymentRecorded(true);
        // Show star rating modal when payment is successfully recorded

        const create_payment_response = await axios.post('https://tablemint.onrender.com/api/payments/create_payment', {
          amount: baseAmt,  // Send only the base amount (order total) to Square
          tip_money: tipAmt * 100,  // Send tip separately
          order_id: orderId,
          source_id: 'EXTERNAL',
          restaurant_id: restaurantId,
          table_token: tableToken,
          location_id: location_id 
        });

        if (create_payment_response.data.success) {
          console.log("Square external payment created successfully:", create_payment_response.data);
          setIsRatingModalOpen(true);
        } else {
          console.warn("Failed to create Square external payment:", create_payment_response.data.error);
        }
        // setIsRatingModalOpen(true);
        console.log("Payment recorded successfully in database and paid for");

        // Check if Square external payment was created
        const squareResult = response.data.square_external_payment;
        if (squareResult && squareResult.success) {
          console.log("External payment recorded successfully in Square:", squareResult);
        } else {
          console.warn("Failed to record external payment in Square:", squareResult?.error);
          // Don't set error state as the main payment was still recorded
        }

      } else {
        setRecordError("Failed to record payment details");
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      setRecordError("Error connecting to payment service");
    }
  };

  // Function to send email receipt
  const sendEmailReceipt = async () => {
    if (!email || !email.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailSending(true);
    setEmailError(null);

    try {
      const response = await axios.post('https://tablemint.onrender.com/api/payments/send-email-receipt', {
        email: email,
        payment_id: intentId,
        order_id: orderId,
        total_amount: paymentAmount,
        base_amount: baseAmount,
        tip_amount: tipAmount,
        status: status
      });

      if (response.data.success) {
        setEmailSent(true);
        setShowEmailInput(false);
      } else {
        setEmailError(response.data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setEmailError('Error sending email. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  const handleEmailReceipt = () => {
    if (emailSent) return;
    setShowEmailInput(true);
  };

  const handleRetry = () => {
    // Reset the payment status and try the payment again
    setPaymentStatus('processing');
    setError(null);
    // You would typically call your payment processing function here
  };

  const statusContent = STATUS_CONTENT_MAP[status] || STATUS_CONTENT_MAP.default;

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Processing your payment...</p>
      </div>
    );
  }

  return (
    <div className="complete-page">
      <div className="complete-header">
      </div>

      <div className="complete-container">
        <div className="status-icon">
          {paymentStatus === 'success' && <SuccessIcon />}
          {paymentStatus === 'error' && <ErrorIcon />}
          {paymentStatus === 'processing' && <ProcessingIcon />}
        </div>

        <h2 className="status-title">
          {paymentStatus === 'success' && 'Payment successful'}
          {paymentStatus === 'error' && 'Payment failed'}
          {paymentStatus === 'processing' && 'Processing payment'}
        </h2>
        
        <p className="status-message">
          {paymentStatus === 'success' && 'Your payment has been processed successfully.'}
          {paymentStatus === 'error' && 'There was an error processing your payment. Please try again.'}
          {paymentStatus === 'processing' && 'Please wait while we process your payment.'}
        </p>

        {paymentDetails && (
          <div className="payment-details">
            <div className="detail-row">
              <span className="detail-label">Order ID</span>
              <span className="detail-value">{paymentDetails.orderId}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Amount</span>
              <span className="detail-value">{formatCurrency(paymentDetails.amount * 100)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Tips</span>
              <span className="detail-value">{formatCurrency(paymentDetails.tipAmount * 100)}</span>
            </div>
            <div className="detail-row total">
              <span className="detail-label">Total</span>
              <span className="detail-value">{formatCurrency(paymentDetails.totalAmount)}</span>
            </div>
            <button 
              className={`order-details-button ${showOrderDetails ? 'active' : ''}`}
              onClick={() => {
                console.log("Order details button clicked");
                console.log("Current order items:", orderItems);
                setShowOrderDetails(!showOrderDetails);
              }}
            >
              <span>Order Details {orderItems.length > 0 ? `(${orderItems.length})` : ''}</span>
              <RightArrowIcon />
            </button>
            {showOrderDetails && orderItems.length > 0 ? (
              <OrderDetails items={orderItems} isOpen={true} />
            ) : showOrderDetails && (
              <div className="order-details-container">
                <div className="order-item">
                  <p>No items found in this order.</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="action-buttons">
          {paymentStatus === 'success' && (
            <>
              <button 
                className="primary-button"
                onClick={() => setShowRatingModal(true)}
              >
                Rate your experience
              </button>
              <button
                className="secondary-button"
                onClick={() => setShowEmailInput(true)}
              >
                <span>Get email receipt</span>
                <ExternalLinkIcon />
              </button>
            </>
          )}
          
          {paymentStatus === 'error' && (
            <button 
              className="primary-button"
              onClick={handleRetry}
            >
              Try again
            </button>
          )}
        </div>

        {showEmailInput && (
          <div className="email-input-section">
            <input
              type="email"
              className="email-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="action-buttons">
              <button 
                className="primary-button"
                onClick={handleEmailReceipt}
                disabled={!email || isLoading}
              >
                Send receipt
              </button>
              <button
                className="secondary-button"
                onClick={() => setShowEmailInput(false)}
              >
                Cancel
              </button>
            </div>
            {error && <div className="email-error">{error}</div>}
          </div>
        )}
      </div>

      <StarRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
      />
    </div>
  );
};

// Main component that wraps the content with Elements provider
export default function CompletePage() {
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    // Get the client secret from the URL
    const secret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );
    if (secret) {
      setClientSecret(secret);
    }
  }, []);

  return (
    clientSecret ? (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CompletePageContent />
      </Elements>
    ) : (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading payment status...</p>
      </div>
    )
  );
}