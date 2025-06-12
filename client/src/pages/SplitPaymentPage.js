import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, DollarSign } from 'lucide-react';
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from '../contexts/CartContext';
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
  const { paymentId } = useParams();
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  
  // Split payment state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Payment state management
  const [showTipModal, setShowTipModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [userPaymentAmount, setUserPaymentAmount] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [tipInCents, setTipInCents] = useState(0);
  const [baseAmountInCents, setBaseAmountInCents] = useState(null);

  // Parse the payment information from URL
  useEffect(() => {
    const parsePaymentInfo = () => {
      try {
        const amount = searchParams.get('amount');
        const total = searchParams.get('total');
        
        if (!amount) {
          setError('Invalid payment amount');
          return;
        }

        setRemainingAmount(parseInt(amount, 10));
        setTotalAmount(parseInt(total, 10) || parseInt(amount, 10));

        // Set the payment amount
        setUserPaymentAmount(parseInt(amount, 10));
        
        // Add a small delay to simulate fetching data
        setTimeout(() => setLoading(false), 300);
      } catch (err) {
        console.error('Error parsing payment data:', err);
        setError('Invalid payment link');
        setLoading(false);
      }
    };

    parsePaymentInfo();
  }, [searchParams]);

  // Format currency display
  const formatCurrency = (amountInCents) => {
    return `£${(amountInCents / 100).toFixed(2)}`;
  };
  
  // Update payment amount when it changes
  useEffect(() => {
    if (updatePaymentAmount && userPaymentAmount) {
      updatePaymentAmount(userPaymentAmount);
    }
  }, [userPaymentAmount, updatePaymentAmount]);

  // Payment handler functions
  const handleTipConfirm = async (tipAmount) => {
    try {
      const baseAmount = userPaymentAmount || remainingAmount;
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

  const handleBack = () => {
    navigate('/');
  };

  // Show loading spinner
  if (loading) {
    return (
      <div className="split-payment-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="split-payment-page">
        <div className="error-container">
          <div className="error-icon">
            <ShoppingCart size={48} />
          </div>
          <h2 className="error-title">Oops!</h2>
          <p className="error-message">{error}</p>
          <button className="error-button" onClick={handleBack}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="split-payment-page">
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
        </div>
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

export default SplitPaymentPage;
