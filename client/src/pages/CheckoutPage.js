import React, { useState } from 'react';
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('apple-pay');
  const [showPromoCode, setShowPromoCode] = useState(false);

  if (!clientSecret || !stripePromise) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Preparing payment form...</p>
      </div>
    );
  }
  const baseAmountF = baseAmount/100;
  const tipAmountF = tipAmount/100;
  const baseAmountFormatted = (baseAmountF / 100).toFixed(2);
  const tipAmountFormatted = (tipAmountF / 100).toFixed(2);
  const total = ((baseAmountF + tipAmountF) / 100).toFixed(2);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: '0',
      maxWidth: '480px',
      margin: '0 auto',
      // boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '16px 20px'
      }}>
        <button style={{
          position: 'absolute',
          left: '20px',
          background: 'none',
          border: 'none',
          padding: '8px',
          cursor: 'pointer',
          color: '#1d1d1f'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#1d1d1f',
          margin: '0',
          letterSpacing: '-0.3px'
        }}>Your order</h1>
      </div>

      <div style={{ padding: '24px 20px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#1d1d1f',
          margin: '0 0 8px 0',
          letterSpacing: '-0.5px',
          textAlign: 'left'
        }}>Pay securely</h2>
        <p style={{
          fontSize: '15px',
          color: '#86868b',
          margin: '0 0 32px 0',
          lineHeight: '1.4',
          fontWeight: '400',
          textAlign: 'left'
        }}>All transactions are private and encrypted.</p>

        {/* Payment Methods */}
        <div style={{ marginBottom: '24px' }}>
          {/* Apple Pay Option */}
          <div 
            style={{
              border: selectedPaymentMethod === 'apple-pay' ? '2px solid #1d1d1f' : '1px solid #e5e5e7',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              cursor: 'pointer',
              position: 'relative',
              backgroundColor: '#ffffff',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setSelectedPaymentMethod('apple-pay')}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#1d1d1f'
              }}>Apple Pay</span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  backgroundColor: '#000',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>Pay</div>
                {selectedPaymentMethod === 'apple-pay' && (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#000',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Credit Card Option */}
          <div 
            style={{
              border: selectedPaymentMethod === 'credit-card' ? '2px solid #1d1d1f' : '1px solid #e5e5e7',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              position: 'relative',
              backgroundColor: '#ffffff',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setSelectedPaymentMethod('credit-card')}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#1d1d1f'
              }}>Credit Card</span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <div style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  color: '#1a4cff',
                  backgroundColor: '#f0f4ff',
                  padding: '2px 4px',
                  borderRadius: '2px'
                }}>VISA</div>
                <div style={{
                  fontSize: '10px',
                  fontWeight: '500',
                  color: '#000',
                  backgroundColor: '#f5f5f5',
                  padding: '2px 4px',
                  borderRadius: '2px'
                }}>Pay</div>
                <div style={{
                  fontSize: '10px',
                  fontWeight: '500',
                  color: '#000',
                  backgroundColor: '#f5f5f5',
                  padding: '2px 4px',
                  borderRadius: '2px'
                }}>G Pay</div>
                <div style={{
                  fontSize: '12px',
                  backgroundColor: '#fff3cd',
                  padding: '2px 4px',
                  borderRadius: '2px'
                }}>😊</div>
                {selectedPaymentMethod === 'credit-card' && (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#000',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Promo Code Section */}
        <div style={{ marginBottom: '32px' }}>
          <button 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: 'none',
              border: 'none',
              padding: '16px 0',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              color: '#1d1d1f'
            }}
            onClick={() => setShowPromoCode(!showPromoCode)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                backgroundColor: '#000',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span>Add a promo code</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {showPromoCode && (
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '12px'
            }}>
              <input 
                type="text" 
                placeholder="Enter promo code"
                style={{
                  flex: '1',
                  padding: '12px',
                  border: '1px solid #e5e5e7',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <button style={{
                padding: '12px 16px',
                backgroundColor: '#1d1d1f',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>Apply</button>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div style={{
          padding: '16px 0',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            fontSize: '14px',
            color: '#1d1d1f'
          }}>
            <span className='subtotal-label'>Subtotal</span>
            <span>£{baseAmountFormatted}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            fontSize: '14px',
            color: '#1d1d1f'
          }}>
            <span className='tips-label'>Tips</span>
            <span>£{tipAmountFormatted}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            fontSize: '14px',
            color: '#1d1d1f'
          }}>
      
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0 0 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#1d1d1f',
            borderTop: '1px solid #f2f2f2',
            marginTop: '8px'
          }}>
            <span className='total-label'>Total</span>
            <span>£{total}</span>
          </div>
        </div>

        {/* Payment Section */}
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
                  border: '1px solid #e5e5e7',
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
                  border: '1px solid #e5e5e7',
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
          {selectedPaymentMethod === 'credit-card' && (
            <div style={{ marginBottom: '8px' }}>
              <CheckoutForm />
            </div>
          )}
        </Elements>

        {/* Payment Button */}
        {selectedPaymentMethod === 'apple-pay' ? (
          <button style={{
            width: '100%',
            backgroundColor: '#000',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              backgroundColor: 'white',
              color: 'black',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600'
            }}>Pay</div>
            <span>Pay with Apple Pay</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default CheckoutPage;