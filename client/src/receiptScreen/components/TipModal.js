import { useState, useEffect, useRef } from "react";
import { X } from 'lucide-react';

const TipModal = ({ isOpen, onClose, currentTip, baseAmount, onConfirm, isProcessing, currency = 'GBP' }) => {
  const [selectedTip, setSelectedTip] = useState(currentTip || 0);
  const customInputRef = useRef(null);
  
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
    onConfirm(selectedTip);
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
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={handleModalBackdropClick}>
      <div className={`modal-content ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
          <h1 className="modal-title">Add a Tip</h1>
          <div className="header-spacer"></div>
        </div>
        
        <div className="modal-body">
          <p className="tip-description">This will be added to any discretionary service charge which goes directly to the restaurant team.</p>
          
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
          
          <div className="payment-summary">
            <div className="summary-row">
              <span>Total with tip</span>
              <span className="total-amount">{formatCurrency(baseAmount + selectedTip)}</span>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="confirm-button"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .modal-overlay {
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
        
        .modal-overlay.open {
          visibility: visible;
          opacity: 1;
          transition-delay: 0s;
          pointer-events: auto;
        }
        
        .modal-content {
          background-color: white;
          width: 100%;
          height: 65vh;
          border-radius: 20px 20px 0 0;
          transform: translateY(100%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 1001;
          pointer-events: auto;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
        }
        
        .modal-content.open {
          transform: translateY(0);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #eee;
        }

        .close-button {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          transition: color 0.2s;
        }

        .close-button:hover {
          color: #333;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
          text-align: center;
          flex-grow: 1;
        }

        .header-spacer {
          width: 40px;
        }

        .modal-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }

        .tip-description {
          color: #666;
          margin: 0 0 20px;
          text-align: center;
          font-size: 14px;
        }

        .tip-options-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .tip-option {
          background: #f5f5f5;
          border: 2px solid transparent;
          border-radius: 8px;
          padding: 12px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tip-option.active {
          background: #fff;
          border-color: #1a73e8;
          color: #1a73e8;
        }

        .bottom-options {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .no-tip-button,
        .custom-button {
          flex: 1;
          background: #f5f5f5;
          border: 2px solid transparent;
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .no-tip-button.active,
        .custom-button.active {
          background: #fff;
          border-color: #1a73e8;
          color: #1a73e8;
        }

        .custom-input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          background: #f5f5f5;
          border: 2px solid #1a73e8;
          border-radius: 8px;
          padding: 8px 12px;
        }

        .currency {
          color: #666;
          margin-right: 4px;
        }

        .custom-tip-input {
          flex: 1;
          border: none;
          background: none;
          font-size: 16px;
          padding: 0;
          outline: none;
        }

        .payment-summary {
          border-top: 1px solid #eee;
          padding-top: 20px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 16px;
          font-weight: 500;
        }

        .total-amount {
          font-size: 18px;
          font-weight: 600;
          color: #1a73e8;
        }

        .modal-footer {
          padding: 20px;
          border-top: 1px solid #eee;
        }

        .confirm-button {
          width: 100%;
          background: #1a73e8;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 14px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .confirm-button:hover {
          background: #1557b0;
        }

        .confirm-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default TipModal;