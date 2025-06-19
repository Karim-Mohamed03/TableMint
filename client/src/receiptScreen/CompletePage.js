import React, { useEffect, useState } from "react";
import { Elements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import "./CompletePage.css";

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

    // Get order ID from URL parameters - this should be the real Square order ID
    const orderIdFromUrl = new URLSearchParams(window.location.search).get("order_id");

    if (!orderIdFromUrl) {
      console.error("No order_id found in URL parameters");
      setStatus("error");
      return;
    }

    setOrderId(orderIdFromUrl);
    console.log("Using Square order ID from URL:", orderIdFromUrl);

    // Directly get base and tip amounts from URL if available
    const baseAmountFromUrl = new URLSearchParams(window.location.search).get("base_amount");
    const tipAmountFromUrl = new URLSearchParams(window.location.search).get("tip_amount");

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) {
        return;
      }

      setStatus(paymentIntent.status);
      setIntentId(paymentIntent.id);
      setPaymentAmount(paymentIntent.amount);

      // Calculate base and tip amounts correctly
      let total = paymentIntent.amount;
      let base = null;
      let tip = null;

      // Check if we have the tip amount from URL parameters
      if (tipAmountFromUrl) {
        // Convert the string to an integer tip amount
        tip = parseInt(tipAmountFromUrl, 10);
        base = total - tip;
      } else if (baseAmountFromUrl) {
        // If we have base amount but not tip
        base = parseInt(baseAmountFromUrl, 10);
        tip = total - base;
      } else {
        // Get the metadata from the payment intent if available
        const metadata = paymentIntent.metadata || {};
        if (metadata.base_amount && metadata.tip_amount) {
          base = parseInt(metadata.base_amount, 10);
          tip = parseInt(metadata.tip_amount, 10);
        } else {
          // Fallback: assume no tip
          base = total;
          tip = 0;
        }
      }

      setBaseAmount(base);
      setTipAmount(tip);

      // If payment succeeded, record it to our backend
      if (paymentIntent.status === 'succeeded') {
        recordPaymentToPhillyCheesesteak(
          paymentIntent.id,
          total,
          orderIdFromUrl,
          base,
          tip
        );
      }
    });
  }, [stripe]);

  // Orders are now created only in the confirm modal, not after payment

  // Function to record successful payment to the backend and create Square external payment
  const recordPaymentToPhillyCheesesteak = async (paymentId, amount, orderId, baseAmt, tipAmt) => {
    try {
      // Orders are now created only in confirm modal, so we just record the payment
      console.log("Recording payment for existing order:", orderId);

      // Record the payment in our database
      const response = await axios.post('https://tablemint.onrender.com/api/payments/record-philly-payment', {
        payment_id: paymentId,
        amount: amount,
        order_id: orderId,
        base_amount: baseAmt,
        tip_amount: tipAmt
      });

      if (response.data.success) {
        setPaymentRecorded(true);
        // Show star rating modal when payment is successfully recorded

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

        // Validate that we have restaurant context
        if (!restaurantId && !tableToken) {
          console.error("No restaurant context found in session storage");
          alert("Restaurant context is missing. Please scan the QR code again or refresh the page.");
          setIsModalOpen(false);
          return;
        }

        const create_payment_response = await axios.post('https://tablemint.onrender.com/api/payments/create_payment', {
          amount: amount,
          tip_money: tipAmount,
          order_id: orderId,
          source_id: 'EXTERNAL',
          restaurant_id: restaurantId,
          table_token: tableToken,
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

  const statusContent = STATUS_CONTENT_MAP[status] || STATUS_CONTENT_MAP.default;

  // Format currency display
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount / 100);
  };

  return (
    <div className="complete-container">
      <div className="status-card">
        <div className="status-icon">
          {statusContent.icon}
        </div>

        <h1 className="status-title">{statusContent.title}</h1>
        <p className="status-message">{statusContent.message}</p>

        {intentId && (
          <div className="payment-details">

            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span className="detail-value status-badge">{status}</span>
            </div>
            {status === 'succeeded' && (
              <>
                <div className="detail-row">
                  <span className="detail-label">Total Amount</span>
                  <span className="detail-value">{formatCurrency(paymentAmount)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Base Amount</span>
                  <span className="detail-value">{formatCurrency(baseAmount)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tip Amount</span>
                  <span className="detail-value">{formatCurrency(tipAmount)}</span>
                </div>

              </>
            )}
          </div>
        )}

        <div className="action-buttons">
          {intentId && status === 'succeeded' && (
            <button
              className="secondary-button"
              onClick={handleEmailReceipt}
              disabled={emailSent}
            >
              {emailSent ? 'Receipt Sent' : 'Email Receipt'}
            </button>
          )}

          <a href="/" className="primary-button">
            Return to Home
          </a>
        </div>

        {showEmailInput && (
          <div className="email-input-section">
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={emailSending}
              className="email-input"
            />
            <div className="email-buttons">
              <button
                onClick={() => setShowEmailInput(false)}
                className="cancel-button"
                disabled={emailSending}
              >
                Cancel
              </button>
              <button
                onClick={sendEmailReceipt}
                disabled={emailSending || !email}
                className="send-button"
              >
                {emailSending ? 'Sending...' : 'Send Receipt'}
              </button>
            </div>
            {emailError && <p className="email-error">{emailError}</p>}
          </div>
        )}
      </div>
      <StarRatingModal isOpen={isRatingModalOpen} onClose={() => setIsRatingModalOpen(false)} />
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