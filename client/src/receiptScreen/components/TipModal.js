import { useState, useEffect, useRef } from "react";

const TipModal = ({ isOpen, onClose, currentTip, baseAmount, onConfirm, isProcessing }) => {
  const [selectedTip, setSelectedTip] = useState(currentTip);
  const customInputRef = useRef(null);
  
  // Reset selected tip when modal is opened with current tip value
  useEffect(() => {
    if (isOpen) {
      setSelectedTip(currentTip);
      setCustomTip("");
      setIsCustomTip(false);
    }
  }, [isOpen, currentTip]);
  
  // Predefined tip percentages
  const tipPercentages = [
    { value: 4, label: "$4" },
    { value: 7, label: "$7" },
    { value: 10, label: "$10" }
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
    onConfirm(selectedTip);
    onClose();
  };
  
  // Prevent modal backdrop clicks from closing when processing
  const handleModalBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isProcessing) {
      onClose();
    }
  };
  
  return (
    <div className={`modal-backdrop ${isOpen ? 'open' : ''}`} onClick={handleModalBackdropClick}>
      <div className={`tip-modal ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-indicator"></div>
        </div>
        
        <div className="modal-content">
          <div className="tip-title">Say thanks with a tip</div>
          <div className="tip-desc-label">This will be added to any discretionary service charge which goes directly to the restaurant team.</div>
          
          <div className="tip-options-grid">
            {tipPercentages.map((option) => (
              <button 
                key={option.value} 
                className={`tip-option ${selectedTip === option.value && !isCustomTip ? "active" : ""}`} 
                onClick={() => handleTipSelect(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          <div className="bottom-options">
            <button 
              className={`no-tip-button ${selectedTip === 0 && !isCustomTip ? "active" : ""}`}
              onClick={handleNoTip}
            >
              No Tip
            </button>
            
            <div className={`custom-button-container ${isCustomTip ? "expanded" : ""}`}>
              {!isCustomTip ? (
                <button 
                  className="custom-button"
                  onClick={() => setIsCustomTip(true)}
                >
                  Custom
                </button>
              ) : (
                <div className="custom-input-wrapper">
                  <span className="currency">$</span>
                  <input 
                    ref={customInputRef}
                    type="text" 
                    value={customTip} 
                    onChange={handleCustomTipChange}
                    placeholder="0.00"
                    className="custom-tip-input"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="payment-summary">
            <div className="summary-row">
              <span>You are paying</span>
              <span className="total-amount">${(baseAmount + selectedTip).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className={`confirm-button ${isProcessing ? 'processing' : ''}`} 
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Confirm and pay'}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: flex-end;
          z-index: 1000;
          visibility: hidden;
          opacity: 0;
          transition: visibility 0s linear 0.3s, opacity 0.3s;
          pointer-events: none;
        }
        
        .modal-backdrop.open {
          visibility: visible;
          opacity: 1;
          transition-delay: 0s;
          pointer-events: auto;
        }
        
        .tip-modal {
          background-color: white;
          width: 100%;
          max-width: 400px;
          border-radius: 20px 20px 0 0;
          transform: translateY(100%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          z-index: 1001;
          pointer-events: auto;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
        }
        
        .tip-modal.open {
          transform: translateY(0);
        }
        
        .modal-header {
          padding: 12px 0 8px 0;
          display: flex;
          justify-content: center;
        }
        
        .header-indicator {
          width: 36px;
          height: 4px;
          background-color: #d1d1d6;
          border-radius: 2px;
        }
        
        .modal-content {
          padding: 0 24px;
          flex: 1;
        }
        
        .tip-title {
          font-size: 28px;
          font-weight: 600;
          color: #1d1d1f;
          margin-bottom: 8px;
          text-align: center;
        }
        
        .tip-desc-label {
          font-size: 16px;
          color: #86868b;
          margin-bottom: 32px;
          line-height: 1.4;
        }
        
        .tip-options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .tip-option {
          background-color: #1d1d1f;
          color: #2ecc71;
          border: none;
          border-radius: 12px;
          padding: 20px 16px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .tip-option.active {
          background-color: #2ecc71;
          color: white;
        }
        
        .bottom-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .no-tip-button {
          background-color: #f2f2f7;
          color: #1d1d1f;
          border: none;
          border-radius: 30px;
          padding: 16px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 52px;
        }
        
        .no-tip-button.active {
          background-color: #2ecc71;
          color: white;
        }
        
        .custom-button-container {
          position: relative;
          height: 52px;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .custom-button-container.expanded {
          background-color: #f2f2f7;
          border: 2px solid #2ecc71;
        }
        
        .custom-button {
          width: 100%;
          height: 100%;
          background-color: #2ecc71;
          color: white;
          border: none;
          border-radius: 30px;
          padding: 16px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
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
          font-weight: 600;
          color: #1d1d1f;
          margin-right: 8px;
        }
        
        .custom-tip-input {
          background: none;
          border: none;
          outline: none;
          width: 100%;
          height: 100%;
          font-size: 18px;
          font-weight: 600;
          color: #1d1d1f;
          font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .custom-tip-input::placeholder {
          color: #86868b;
        }
        
        .payment-summary {
          margin-bottom: 24px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 16px;
          color: black;
        }
        
        .total-amount {
          font-size: 18px;
          font-weight: 600;
        }
        
        .modal-footer {
          padding: 0 24px 24px 24px;
        }
        
        .confirm-button {
          width: 100%;
          padding: 16px;
          background-color: #2ecc71;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .confirm-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .confirm-button.processing {
          background-color: #27ae60;
        }
        
        .tip-option:disabled,
        .no-tip-button:disabled,
        .custom-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default TipModal;