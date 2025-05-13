import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./components/CheckoutForm";
import SplitBillModal from "./components/SplitBillModal";
import "./PaymentPage.css";

// PaymentPage Component
export default function PaymentPage({ stripePromise, clientSecret, updatePaymentAmount }) {
  const [tip, setTip] = useState(5);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const baseAmount = 3500; // in cents (e.g., $35.00)
  const [userPaymentAmount, setUserPaymentAmount] = useState(null);
  const [splitDetails, setSplitDetails] = useState(null);

  // Calculate total based on whether it's a split bill or not
  const totalAmount = baseAmount + tip * 100; // Convert tip to cents
  const amountToPay = userPaymentAmount || totalAmount;

  const tipPercentages = [
    { value: 0, percent: "0%" },
    { value: 5, percent: "15%" },
    { value: 7, percent: "20%" },
    { value: 10, percent: "28%" }
  ];

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

  const handleSplitConfirm = (splitInfo) => {
    // Set the amount the user will pay
    setUserPaymentAmount(splitInfo.amountToPay);
    setSplitDetails(splitInfo);
  };

  const options = { clientSecret };

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

      <div className="split-bill-section">
        <button className="split-button" onClick={toggleSplitModal}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.8333 4.16667C15.8333 5.5474 14.714 6.66667 13.3333 6.66667C11.9526 6.66667 10.8333 5.5474 10.8333 4.16667C10.8333 2.78595 11.9526 1.66667 13.3333 1.66667C14.714 1.66667 15.8333 2.78595 15.8333 4.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.16667 15.8333C9.16667 17.2141 8.04738 18.3333 6.66667 18.3333C5.28596 18.3333 4.16667 17.2141 4.16667 15.8333C4.16667 14.4526 5.28596 13.3333 6.66667 13.3333C8.04738 13.3333 9.16667 14.4526 9.16667 15.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10.8333 5.83333L4.16667 14.1667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {splitDetails ? 'Change split amount' : 'Split the bill'}
        </button>
      </div>

      <div className="tip-section">
        <p className="tip-label">Add a tip</p>
        <div className="tip-options">
          {tipPercentages.map((option) => (
            <button 
              key={option.value} 
              className={`tip-btn ${tip === option.value ? "active" : ""}`} 
              onClick={() => handleTipChange(option.value)}
            >
              <span className="tip-percent">{option.percent}</span>
              <span className="tip-amount">${option.value}</span>
            </button>
          ))}
        </div>
      </div>

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
      
      <SplitBillModal 
        isOpen={showSplitModal} 
        onClose={toggleSplitModal} 
        baseAmount={baseAmount} 
        tip={tip} 
        totalAmount={totalAmount}
        onConfirm={handleSplitConfirm}
      />

      <style jsx>{`
        .split-row {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed var(--border-color);
          color: var(--primary-color);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}