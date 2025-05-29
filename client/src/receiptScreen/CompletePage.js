import React, { useEffect, useState } from "react";
import { Elements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import "./CompletePage.css";

const stripePromise = loadStripe("pk_test_51MNLkFEACKuyUvsyQSMfwsU2oCp1tMz9B3EyvzrVqkrE3664tGDabLl94k7xxfrAMJiV8mnYw2Ri8WB2Y6UF0Mey00QS6yNYOj");

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
    
    // Set order ID from URL or use a default value
    const orderIdFromUrl = new URLSearchParams(window.location.search).get("order_id");
    setOrderId(orderIdFromUrl || "default-order-id");
    
    // Directly get base and tip amounts from URL if available
    const baseAmountFromUrl = new URLSearchParams(window.location.search).get("base_amount");
    const tipAmountFromUrl = new URLSearchParams(window.location.search).get("tip_amount");
    
    stripe.retrievePaymentIntent(clientSecret).then(({paymentIntent}) => {
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
          orderIdFromUrl || "default-order-id",
          base,
          tip
        );
      }
    });
  }, [stripe]);
  
  // Function to record successful payment to the backend
  const recordPaymentToPhillyCheesesteak = async (paymentId, amount, orderId, baseAmt, tipAmt) => {
    try {
      const response = await axios.post('https://tablemint.onrender.com/api/payments/record-philly-payment', {
        payment_id: paymentId,
        amount: amount,
        order_id: orderId,
        base_amount: baseAmt,
        tip_amount: tipAmt
      });
      
      if (response.data.success) {
        setPaymentRecorded(true);
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