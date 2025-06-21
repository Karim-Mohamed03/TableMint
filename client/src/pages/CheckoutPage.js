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
        <h1 className="checkout-title">Complete Your Payment</h1>
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
      </div>
    </div>
  );
};

export default CheckoutPage; 