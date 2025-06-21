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

  const total = ((baseAmount + tipAmount) / 100).toFixed(2);
  const baseAmountFormatted = (baseAmount / 100).toFixed(2);
  const tipAmountFormatted = (tipAmount / 100).toFixed(2);

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Complete Your Payment</h1>
        <p className="checkout-desc">Please enter your card details below to complete your order.</p>
        
        

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#000000',
                colorBackground: '#ffffff',
                colorText: '#1d1d1f',
                colorDanger: '#ef4444',
                fontFamily: 'Satoshi, system-ui, sans-serif',
                borderRadius: '12px',
                spacingUnit: '4px',
              },
              rules: {
                '.Input': {
                  boxShadow: 'none',
                  border: '1px solid #e2e8f0',
                  padding: '16px',
                },
                '.Input:focus': {
                  boxShadow: 'none',
                  borderColor: '#000000',
                },
                '.Label': {
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#86868b',
                },
                '.Tab': {
                  border: '1px solid #e2e8f0',
                  boxShadow: 'none',
                },
                '.Tab:hover': {
                  border: '1px solid #000000',
                  color: '#000000',
                },
                '.Tab--selected': {
                  backgroundColor: '#000000',
                  color: '#ffffff',
                },
                '.Error': {
                  color: '#ef4444',
                  fontSize: '14px',
                }
              }
            }
          }}
        >
          <CheckoutForm />
        </Elements>

        <div className="amount-breakdown">
          <div className="breakdown-row">
            <span>Subtotal</span>
            <span>£{baseAmountFormatted}</span>
          </div>
          <div className="breakdown-row">
            <span>Tip</span>
            <span>£{tipAmountFormatted}</span>
          </div>
          <div className="breakdown-row total">
            <span>Total</span>
            <span>£{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage; 