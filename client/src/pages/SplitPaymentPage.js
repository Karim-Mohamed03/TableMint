import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { Elements } from "@stripe/react-stripe-js";
import TipModal from '../receiptScreen/components/TipModal';
import CheckoutForm from '../receiptScreen/components/CheckoutForm';
import './SplitPaymentPage.css';

const SplitPaymentPage = ({
  stripePromise, 
  clientSecret, 
  updatePaymentAmount, 
  createPaymentIntent, 
  isCreatingPaymentIntent,
  restaurantBranding,
  isBrandingLoaded
}) => {
  const navigate = useNavigate();
  const { shareToken } = useParams(); // Get share token from URL params
  const [searchParams] = useSearchParams();
  
  // Payment state
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
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

  // Parse the payment information from either secure token or URL params (fallback)
  useEffect(() => {
    const parsePaymentInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        // First try to use secure token if available
        if (shareToken) {
          // Call the secure backend API to get share session data
          const response = await fetch(`http://localhost:8000/api/orders/share/${shareToken}/`);
          const result = await response.json();
          
          if (!response.ok || !result.success) {
            if (response.status === 404) {
              setError('Payment link not found or has been removed');
            } else if (response.status === 410) {
              setError('Payment link has expired');
            } else {
              setError(result.error || 'Failed to load payment information');
            }
            return;
          }

          const shareData = result.data;
          
          // Set the shared order ID if available
          if (result.order_id) {
            setSharedOrderId(result.order_id);
            sessionStorage.setItem("temp_order_id", result.order_id);
          }

          // Handle bill split type
          if (shareData.type === 'bill_split' && shareData.metadata) {
            setRemainingAmount(shareData.metadata.remaining_amount);
            setTotalAmount(shareData.metadata.total_amount);
          } else if (shareData.type === 'cart_split' && shareData.remaining_items) {
            // Redirect to shared cart page for item-level sharing
            navigate(`/shared-cart/${shareToken}`);
            return;
          } else {
            setError('Invalid payment link format');
            return;
          }
        } else {
          // Fallback to URL parameters for backward compatibility
          const amount = searchParams.get('amount');
          const total = searchParams.get('total');
          const orderIdFromUrl = searchParams.get('order_id');
          
          if (!amount) {
            setError('Invalid payment amount');
            return;
          }

          setRemainingAmount(parseInt(amount, 10));
          
          if (total) {
            setTotalAmount(parseInt(total, 10));
          } else {
            setTotalAmount(parseInt(amount, 10));
          }

          if (orderIdFromUrl) {
            setSharedOrderId(orderIdFromUrl);
            sessionStorage.setItem("temp_order_id", orderIdFromUrl);
          }
        }
        
      } catch (err) {
        console.error('Error parsing payment info:', err);
        setError('Failed to load payment information - please check your connection');
      } finally {
        setLoading(false);
      }
    };

    parsePaymentInfo();
  }, [shareToken, searchParams, navigate]);

  // Handle back navigation
  const handleBack = () => {
    navigate('/QROrderPay');
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount / 100);
  };

  // Payment handler functions
  const handleTipConfirm = async (tipAmount) => {
    try {
      const baseAmount = remainingAmount;
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
    setShowTipModal(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="split-payment-page">
        <div className="split-payment-header">
          <div className="header-content">
            <button className="back-button" onClick={handleBack}>
              <ArrowLeft size={24} />
            </button>
            <div className="header-text">
              <h1>Loading Payment</h1>
            </div>
            <div className="w-6"></div>
          </div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading payment information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="split-payment-page">
        <div className="split-payment-header">
          <div className="header-content">
            <button className="back-button" onClick={handleBack}>
              <ArrowLeft size={24} />
            </button>
            <div className="header-text">
              <h1>Split Payment</h1>
            </div>
            <div className="w-6"></div>
          </div>
        </div>
        <div className="error-container">
          <div className="error-message">
            <h3>Unable to Load Payment</h3>
            <p>{error}</p>
            <button onClick={() => navigate('/QROrderPay')} className="back-to-menu-btn">
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="split-payment-page">
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
      </div>

      {/* Header */}
      <div className="split-payment-header">
        <div className="header-content">
          <button className="back-button" onClick={handleBack}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-text">
            <h1>Split Payment</h1>
          </div>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="split-payment-content">
        {/* Payment Details */}
        <div className="payment-details">
          <div className="payment-amount-card">
            <div className="amount-icon">
              <DollarSign size={24} />
            </div>
            <div className="amount-details">
              <h3>Amount to Pay</h3>
              <div className="payment-amount">{formatCurrency(remainingAmount)}</div>
              {totalAmount > remainingAmount && (
                <p className="payment-total">Total Bill: {formatCurrency(totalAmount)}</p>
              )}
            </div>
          </div>

          <div className="payment-message">
            <p>Someone has shared their bill with you. Pay the remaining amount to complete the transaction.</p>
            <p className="secure-notice">🔒 This is a secure payment link that expires in 24 hours.</p>
          </div>
        </div>

        {/* Payment Button */}
        <div className="payment-action">
          <button 
            className="pay-now-btn"
            onClick={handlePayNow}
            disabled={paymentProcessing || isCreatingPaymentIntent}
          >
            {paymentProcessing || isCreatingPaymentIntent ? 'Processing...' : `Pay ${formatCurrency(remainingAmount)}`}
          </button>
        </div>

        {/* Tip Modal */}
        {showTipModal && (
          <TipModal
            isOpen={showTipModal}
            onClose={() => setShowTipModal(false)}
            onConfirm={handleTipConfirm}
            baseAmount={remainingAmount / 100}
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

export default SplitPaymentPage;
