import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./components/CheckoutForm";
import SplitBillModal from "./components/SplitBillModal";
import TipModal from "./components/TipModal";
import "./PaymentPage.css";

// PaymentPage Component
export default function PaymentPage({ stripePromise, clientSecret, updatePaymentAmount, createPaymentIntent, isCreatingPaymentIntent }) {
  const [tip, setTip] = useState(5);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const baseAmount = 3500; // in cents (e.g., $35.00)
  const [userPaymentAmount, setUserPaymentAmount] = useState(null);
  const [splitDetails, setSplitDetails] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  
  // Calculate total based on whether it's a split bill or not
  const totalAmount = baseAmount + tip * 100; // Convert tip to cents
  const amountToPay = userPaymentAmount || totalAmount;
  
  // Update payment amount in parent component when amount changes
  useEffect(() => {
    updatePaymentAmount(amountToPay);
  }, [amountToPay, updatePaymentAmount]);
  
  const handleTipChange = (tipAmount) => {
    setTip(tipAmount);
    // Reset split payment if tip changes
    setUserPaymentAmount(null);
    setSplitDetails(null);
  };
  
  const toggleSplitModal = () => {
    setShowSplitModal(!showSplitModal);
  };
  
  const toggleTipModal = () => {
    setShowTipModal(!showTipModal);
  };
  
  const handleSplitConfirm = (splitInfo) => {
    // Set the amount the user will pay
    setUserPaymentAmount(splitInfo.amountToPay);
    setSplitDetails(splitInfo);
    
    // Close the modal
    setShowSplitModal(false);
  };

  const handleTipConfirm = async (tipAmount) => {
    setTip(tipAmount);
    setShowTipModal(false);
    
    try {
      // Calculate final amount with the selected tip
      const finalAmount = baseAmount + tipAmount * 100;
      
      // Show processing state
      setPaymentProcessing(true);
      
      // Create payment intent with the final amount
      await createPaymentIntent(finalAmount);
      
      // Show checkout form after payment intent is created
      setShowCheckout(true);
    } catch (error) {
      console.error("Error creating payment intent:", error);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePayFullAmount = () => {
    // Reset any split payment
    setUserPaymentAmount(null);
    setSplitDetails(null);
    // Show the tip modal
    setShowTipModal(true);
  };

  const handlePaySpecificAmount = async () => {
    // Show the split bill modal
    toggleSplitModal();
  };
  
  const options = clientSecret ? { clientSecret } : {};
  
  // Render a loading spinner when payment intent is being created
  if (paymentProcessing || isCreatingPaymentIntent) {
    return (
      <div className="payment-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Preparing payment...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="payment-container">
      <div className="payment-header">
        <h1>Table 15</h1>
        <p className="subtitle">Complete your payment</p>
      </div>
      
      <div className="bill-summary">
        <div className="bill-row">
          <span>Subtotal</span>
          <span>${(baseAmount / 100).toFixed(2)}</span>
        </div>
        <div className="bill-row">
          <span>Tip</span>
          <span>${tip.toFixed(2)}</span>
        </div>
        {splitDetails && (
          <div className="bill-row split-row">
            <span>Your portion ({splitDetails.splitMethod === 'equal' ? `1/${splitDetails.numberOfPeople}` : 'custom'})</span>
            <span>${(userPaymentAmount / 100).toFixed(2)}</span>
          </div>
        )}
        <div className="bill-row total">
          <span>Total{splitDetails ? ' (you pay)' : ''}</span>
          <span>${(amountToPay / 100).toFixed(2)}</span>
        </div>
      </div>
      
      {!showCheckout ? (
        <div className="payment-options">
          <button className="payment-option full-amount" onClick={handlePayFullAmount}>
            <div className="option-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="option-text">
              <h3>Pay full amount</h3>
              <p>Pay the entire bill yourself</p>
            </div>
            <div className="option-amount">
              ${(totalAmount / 100).toFixed(2)}
            </div>
          </button>
          
          <button className="payment-option specific-amount" onClick={handlePaySpecificAmount}>
            <div className="option-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 5H19V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 19H5V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="option-text">
              <h3>Pay specific amount</h3>
              <p>Split the bill with others</p>
            </div>
            <div className="option-amount">
              {splitDetails ? `$${(userPaymentAmount / 100).toFixed(2)}` : 'Custom'}
            </div>
          </button>
        </div>
      ) : (
        <div className="payment-section">
          {clientSecret ? (
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm />
            </Elements>
          ) : (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Preparing payment form...</p>
            </div>
          )}
        </div>
      )}
      
      <SplitBillModal 
        isOpen={showSplitModal} 
        onClose={toggleSplitModal} 
        baseAmount={baseAmount} 
        tip={tip} 
        totalAmount={totalAmount}
        onConfirm={handleSplitConfirm}
      />
      
      <TipModal
        isOpen={showTipModal}
        onClose={toggleTipModal}
        currentTip={tip}
        baseAmount={baseAmount}
        onConfirm={handleTipConfirm}
      />
      
      <style jsx>{`
        .split-row {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed var(--border-color);
          color: var(--primary-color);
          font-weight: 600;
        }
        
        .payment-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 24px;
        }
        
        .payment-option {
          display: flex;
          align-items: center;
          background-color: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 16px;
          transition: all 0.2s ease;
          cursor: pointer;
          text-align: left;
        }
        
        .payment-option:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border-color: var(--primary-color);
        }
        
        .option-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background-color: #f5f5f7;
          border-radius: 50%;
          margin-right: 16px;
          color: var(--primary-color);
        }
        
        .option-text {
          flex: 1;
        }
        
        .option-text h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1d1d1f;
        }
        
        .option-text p {
          margin: 4px 0 0;
          font-size: 14px;
          color: #86868b;
        }
        
        .option-amount {
          font-size: 18px;
          font-weight: 600;
          color: var(--primary-color);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
        }
      `}</style>
    </div>
  );
}