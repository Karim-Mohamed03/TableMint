import React from 'react';
import { Elements } from "@stripe/react-stripe-js";
import { useLocation } from 'react-router-dom';
import CheckoutForm from '../receiptScreen/components/CheckoutForm';
import './CheckoutPage.css';

const CheckoutPage = ({
  stripePromise,
  clientSecret,
  restaurantBranding,
  isBrandingLoaded
}) => {
  const location = useLocation();
  const { baseAmount, tipAmount, orderId } = location.state || {};

  if (!clientSecret || !stripePromise) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Preparing payment form...</p>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Pay securely</h1>
        <div className="checkout-desc">
          <h3 className="checkout-desc-title">All transactions are private and encrypted.</h3>
        </div>
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
                fontFamily: 'Satoshi, system-ui, sans-serif',
                spacingUnit: '2px',
                borderRadius: '4px',
              }
            }
          }}
        >
          <CheckoutForm
            baseAmount={baseAmount}
            tipAmount={tipAmount}
            currency="GBP"
            orderId={orderId}
            restaurantBranding={restaurantBranding}
            isBrandingLoaded={isBrandingLoaded}
          />
        </Elements>

        {/* add subtotal */}
        <div className="subtotal-container">
          <div className="subtotal-label">Subtotal</div>
          <div className="subtotal-amount">£{baseAmount}</div>
        </div>
        {/* Add tip amount */}
        <div className="tip-container">
          <div className="tip-label">Tip({tipAmount / baseAmount * 100}%)</div>
          <div className="tip-amount">£{tipAmount}</div>
        </div>

        {/* Add horizontal line */}
        <div className="horizontal-line"></div>

        {/* Add total amount */}
        <div className="total-container">
          <div className="total-label">Total</div>
          <div className="total-amount">£{baseAmount + tipAmount}</div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage; 