import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const TipModal = ({ isOpen, onClose, currentTip, baseAmount, onConfirm, isProcessing, currency = 'GBP' }) => {
  const [selectedTip, setSelectedTip] = useState(currentTip || 0);
  const customInputRef = useRef(null);
  const navigate = useNavigate();
  
  // Reset selected tip when modal is opened with current tip value
  useEffect(() => {
    if (isOpen) {
      setSelectedTip(currentTip || 0);
      setCustomTip("");
      setIsCustomTip(false);
    }
  }, [isOpen, currentTip]);
  
  // Predefined tip percentages
  const tipPercentages = [
    { value: 4, label: `${currency === 'GBP' ? '£' : '$'}4` },
    { value: 7, label: `${currency === 'GBP' ? '£' : '$'}7` },
    { value: 10, label: `${currency === 'GBP' ? '£' : '$'}10` }
  ];
  
  // Custom tip amount
  const [customTip, setCustomTip] = useState("");
  const [isCustomTip, setIsCustomTip] = useState(false);
  
  // Focus input when custom tip is activated
  useEffect(() => {
    if (isCustomTip && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [isCustomTip]);
  
  const handleTipSelect = (tipAmount) => {
    setSelectedTip(tipAmount);
    setIsCustomTip(false);
  };
  
  const handleCustomTipChange = (e) => {
    const value = e.target.value;
    if (value === "" || (/^\d+(\.\d{0,2})?$/.test(value) && parseFloat(value) >= 0)) {
      setCustomTip(value);
      if (value !== "") {
        setSelectedTip(parseFloat(value));
      }
    }
  };
  
  const handleNoTip = () => {
    setSelectedTip(0);
    setCustomTip("");
    setIsCustomTip(false);
  };
  
  const handleConfirm = () => {
    const tipInCents = Math.round(selectedTip * 100); // Convert to cents here
    onConfirm(tipInCents); // Pass the amount in cents to parent
    // Navigate to the checkout page with the necessary data
    navigate('/checkout', {
      state: {
        baseAmount: Math.round(baseAmount), // Convert to cents
        tipAmount: tipInCents, // Already in cents
      }
    });
    onClose();
  };
  
  // Prevent modal backdrop clicks from closing when processing
  const handleModalBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isProcessing) {
      onClose();
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <button className="close-button" onClick={onClose}>
            <span>×</span>
          </button>
          <h1 className="modal-title">Add a Tip</h1>
          <div className="header-spacer"></div>
        </div>

        
        
        <div className="modal-body">

        <h3 className="modal-title">Say Thanks with a Tip</h3>
          <div className="tip-desc-label">This will be added to any discretionary service charge which goes directly to the restaurant team.</div>
          
          <div className="tip-options-grid">
            {tipPercentages.map((option) => (
              <button 
                key={option.value} 
                className={`tip-option ${selectedTip === option.value && !isCustomTip ? "active" : ""}`} 
                onClick={() => handleTipSelect(option.value)}
                disabled={isProcessing}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          <div className="bottom-options">
            <button 
              className={`no-tip-button ${selectedTip === 0 && !isCustomTip ? "active" : ""}`}
              onClick={handleNoTip}
              disabled={isProcessing}
            >
              No Tip
            </button>
            
            <div className={`custom-button-container ${isCustomTip ? "expanded" : ""}`}>
              {!isCustomTip ? (
                <button 
                  className="custom-button"
                  onClick={() => setIsCustomTip(true)}
                  disabled={isProcessing}
                >
                  Custom
                </button>
              ) : (
                <div className="custom-input-wrapper">
                  <span className="currency">{currency === 'GBP' ? '£' : '$'}</span>
                  <input 
                    ref={customInputRef}
                    type="text" 
                    value={customTip} 
                    onChange={handleCustomTipChange}
                    placeholder="0.00"
                    className="custom-tip-input"
                    disabled={isProcessing}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* <div className="payment-summary">
            <div className="summary-row">
              <span>Total with tip</span>
              <span className="total-amount">{formatCurrency(baseAmount + selectedTip)}</span>
            </div>
          </div> */}
        </div>
        
        <div className="modal-footer">
          <button 
            className={`confirm-button ${isProcessing ? 'processing' : ''}`} 
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Confirm and continue to payment'}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: white;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          z-index: 1000;
          padding: 0;
        }
        
        .modal-content {
          background: white;
          width: 100%;
          max-width: none;
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: none;
          background: white;
          top: 0;
          z-index: 10;
        }
        
        .close-button {
          background: none;
          border: none;
          color: #333;
          cursor: pointer;
          padding: 8px;
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
          font-size: 24px;
        }

        .close-button:hover {
          background-color: #f5f5f5;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 500;
          color: #000000;
          margin: 0;
          font-family: 'Satoshi', sans-serif;
          text-align: center;
          flex: 1;
        }

        .header-spacer {
          width: 40px;
        }
        
        .modal-body {
          padding: 0 24px;
          flex: 1;
          overflow-y: auto;
        }
        
        .tip-desc-label {
          font-size: 16px;
          color: #718096;
          margin-bottom: 32px;
          line-height: 1.4;
          font-family: 'Satoshi', sans-serif;
          font-weight: 400;
        }
        
        .tip-options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .tip-option {
          background-color: white;
          color: #000;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px 16px;
          font-size: 18px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Satoshi', sans-serif;
        }
        
        .tip-option.active {
          background-color: #000;
          color: white;
          border-color: #000;
        }
        
        .bottom-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .no-tip-button {
          background-color: white;
          color: #000;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 52px;
          font-family: 'Satoshi', sans-serif;
        }
        
        .no-tip-button.active {
          background-color: #000;
          color: white;
          border-color: #000;
        }
        
        .custom-button-container {
          position: relative;
          height: 52px;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .custom-button-container.expanded {
          background-color: white;
          border: 1px solid #e2e8f0;
        }
        
        .custom-button {
          width: 100%;
          height: 100%;
          background-color: white;
          color: #000;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Satoshi', sans-serif;
        }
        
        .custom-input-wrapper {
          display: flex;
          align-items: center;
          width: 100%;
          height: 100%;
          padding: 0 16px;
        }
        
        .currency {
          font-size: 18px;
          font-weight: 500;
          color: #000;
          margin-right: 8px;
          font-family: 'Satoshi', sans-serif;
        }
        
        .custom-tip-input {
          background: none;
          border: none;
          outline: none;
          width: 100%;
          height: 100%;
          font-size: 18px;
          font-weight: 500;
          color: #000;
          font-family: 'Satoshi', sans-serif;
        }
        
        .custom-tip-input::placeholder {
          color: #718096;
        }
        
        .payment-summary {
          margin-bottom: 24px;
          padding: 24px 0;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 16px;
          color: #000;
          font-family: 'Satoshi', sans-serif;
        }
        
        .total-amount {
          font-size: 18px;
          font-weight: 600;
        }
        
        .modal-footer {
          padding: 20px 16px;
          background: transparent;
          position: sticky;
          bottom: 0;
        }
        
        .confirm-button {
          width: 100%;
          background-color: #000;
          color: white;
          border: none;
          border-radius: 25px;
          padding: 16px 20px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          font-family: 'Satoshi', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .confirm-button:hover:not(:disabled) {
          background-color: #333;
        }
        
        .confirm-button:active:not(:disabled) {
          transform: translateY(1px);
        }
        
        .confirm-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .confirm-button.processing {
          background-color: #333;
        }
        
        .tip-option:disabled,
        .no-tip-button:disabled,
        .custom-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Mobile responsiveness */
        @media (max-width: 480px) {
          .modal-header {
            padding: 16px;
          }
          
          .modal-body {
            padding: 16px;
          }
          
          .modal-footer {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default TipModal;