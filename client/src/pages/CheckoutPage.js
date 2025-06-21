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
      <h1 className="checkout-title">Pay securely</h1>
      <p className="checkout-desc">All transactions are private and encrypted.</p>
      <div className="checkout-container">
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#1d1d1f',
                colorBackground: '#ffffff',
                colorText: '#1d1d1f',
                colorDanger: '#ef4444',
                fontFamily: 'Satoshi, system-ui, sans-serif',
                borderRadius: '8px',
                spacingUnit: '4px',
                fontSizeBase: '15px'
              },
              rules: {
                '.Input': {
                  boxShadow: 'none',
                  border: '1px solid #f2f2f2',
                  padding: '16px',
                  backgroundColor: '#ffffff'
                },
                '.Input:focus': {
                  boxShadow: 'none',
                  borderColor: '#1d1d1f'
                },
                '.Input:hover': {
                  borderColor: '#1d1d1f'
                },
                '.Label': {
                  fontWeight: '400',
                  fontSize: '14px',
                  color: '#86868b'
                },
                '.Tab': {
                  border: '1px solid #f2f2f2',
                  boxShadow: 'none',
                  backgroundColor: '#ffffff'
                },
                '.Tab:hover': {
                  border: '1px solid #1d1d1f',
                  color: '#1d1d1f',
                  backgroundColor: '#ffffff'
                },
                '.Tab--selected': {
                  backgroundColor: '#1d1d1f',
                  color: '#ffffff'
                },
                '.Error': {
                  color: '#ef4444',
                  fontSize: '14px'
                }
              }
            }
          }}
        >
          <CheckoutForm />
        </Elements>

        
      </div>

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
  );
};

export default CheckoutPage; 