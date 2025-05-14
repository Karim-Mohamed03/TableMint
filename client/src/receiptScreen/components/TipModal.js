import { useState, useEffect } from "react";

const TipModal = ({ isOpen, onClose, currentTip, baseAmount, onConfirm }) => {
  const [selectedTip, setSelectedTip] = useState(currentTip);
  
  // Reset selected tip when modal is opened with current tip value
  useEffect(() => {
    if (isOpen) {
      setSelectedTip(currentTip);
      setCustomTip("");
      setIsCustomTip(false);
    }
  }, [isOpen, currentTip]);
  
  // Predefined tip percentages (removed 0% option)
  const tipPercentages = [
    { value: 5, percent: "15%" },
    { value: 7, percent: "20%" },
    { value: 10, percent: "28%" }
  ];
  
  // Custom tip amount
  const [customTip, setCustomTip] = useState("");
  const [isCustomTip, setIsCustomTip] = useState(false);
  
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
        setIsCustomTip(true);
      }
    }
  };
  
  const handleNoTip = () => {
    setSelectedTip(0);
    setCustomTip("");
    setIsCustomTip(false);
  };
  
  const handleConfirm = () => {
    // Pass the selected tip amount to the parent component
    onConfirm(selectedTip);
  };
  
  // Calculate tip percentage based on base amount
  const calculateTipPercentage = (tipAmount) => {
    return Math.round((tipAmount / (baseAmount / 100)) * 100);
  };
  
  // Prevent modal backdrop clicks from closing when processing
  const handleModalBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div className={`modal-backdrop ${isOpen ? 'open' : ''}`} onClick={handleModalBackdropClick}>
      <div className={`tip-modal ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <button className="back-button" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 10H5M5 10L10 5M5 10L10 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2>Add a tip</h2>
          <div style={{ width: 20 }}></div> {/* Empty div for balance */}
        </div>
        <div>
            <div className="tip-title">Say thanks with a tip</div>
            <div className="tip-desc-label">This will be added to any discretionary service charge which goes directly to the restaurant team.</div>
        </div>
        
        <div className="modal-body">
          {/* <div className="bill-amount-display">
            <div className="amount-label">Bill Amount</div>
            <div className="amount-value">${(baseAmount / 100).toFixed(2)}</div>
          </div> */}
          
          <div className="tip-options-container">
            {/* Three tip options in a single row */}
            <div className="tip-options-row">
              {tipPercentages.map((option) => (
                <button 
                  key={option.value} 
                  className={`tip-option ${selectedTip === option.value && !isCustomTip ? "active" : ""}`} 
                  onClick={() => handleTipSelect(option.value)}
                >
                  <span className="tip-percent">{option.percent}</span>
                  <span className="tip-amount">${option.value.toFixed(2)}</span>
                </button>
              ))}
            </div>
            
            {/* Custom amount and No tip in the second row */}
            <div className="custom-no-tip-row">
              <div className={`custom-tip-container ${isCustomTip ? "active" : ""}`}>
                <div className="custom-tip-label">Custom</div>
                <div className="custom-tip-input">
                  <span className="currency">$</span>
                  <input 
                    type="text" 
                    value={customTip} 
                    onChange={handleCustomTipChange}
                    placeholder="0.00"
                    onClick={() => setIsCustomTip(true)}
                  />
                </div>
              </div>
              
              <button 
                className={`no-tip-button ${selectedTip === 0 && !isCustomTip ? "active" : ""}`}
                onClick={handleNoTip}
              >
                No tip
              </button>
            </div>
          </div>

          <div>
            <div className="tip-summary">You're paying: ${((baseAmount / 100) + selectedTip).toFixed(2)} </div>
          </div>
          
          {/* <div className="tip-summary">
            <div className="summary-row">
              <div className="summary-label">Tip amount</div>
              <div className="summary-value">${selectedTip.toFixed(2)}</div>
            </div>
            <div className="summary-row">
              <div className="summary-label">Tip percentage</div>
              <div className="summary-value">
                {isCustomTip && customTip !== "" 
                  ? `${calculateTipPercentage(parseFloat(customTip))}%` 
                  : tipPercentages.find(t => t.value === selectedTip)?.percent || "0%"}
              </div>
            </div>
            <div className="summary-row total">
              <div className="summary-label">Total amount</div>
              <div className="summary-value">
                ${((baseAmount / 100) + selectedTip).toFixed(2)}
              </div>
            </div>
          </div> */}
        </div>
        
        <div className="modal-footer">
          <button className="confirm-button" onClick={handleConfirm}>
            Confirm and proceed to payment
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
          max-width: 500px;
          border-radius: 20px 20px 0 0;
          padding: 24px;
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
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-shrink: 0;
        }
        
        .tip-title {
          font-size: 30px;
          font-weight: 600;
          color: #1d1d1f;
          margin-bottom: 4px;
        }
        
        .tip-desc-label {
          font-size: 14px;
          color: #86868b;
          margin-bottom: 16px;
        }
        
        .modal-header h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }
        
        .back-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #0071e3;
        }
        
        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding-right: 5px;
        }
        
        .tip-options-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .tip-options-row {
          display: flex;
          justify-content: center;
          gap: 12px;
        }
        
        .custom-no-tip-row {
          display: flex;
          gap: 12px;
        }
        
        .tip-option {
          flex: 1;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .tip-option.active {
          border-color: #0071e3;
          background-color: #f0f7ff;
        }
        
        .tip-percent {
          font-size: 16px;
          font-weight: 600;
          color: #1d1d1f;
          margin-bottom: 4px;
        }
        
        .tip-amount {
          font-size: 14px;
          color: #86868b;
        }
        
        .custom-tip-container {
          flex: 1;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          background-color: #ffffff;
          transition: all 0.2s ease;
        }
        
        .custom-tip-container.active {
          border-color: #0071e3;
          background-color: #f0f7ff;
        }
        
        .custom-tip-label {
          font-size: 16px;
          font-weight: 600;
          color: #1d1d1f;
          margin-bottom: 8px;
        }
        
        .custom-tip-input {
          display: flex;
          align-items: center;
          background-color: #f5f5f7;
          border-radius: 8px;
          padding: 8px 12px;
        }
        
        .currency {
          font-size: 16px;
          font-weight: 500;
          color: #1d1d1f;
          margin-right: 4px;
        }
        
        .custom-tip-input input {
          background: none;
          border: none;
          outline: none;
          width: 100%;
          font-size: 16px;
          color: #1d1d1f;
        }
        
        .no-tip-button {
          flex: 1;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 16px;
          font-weight: 600;
          color: #1d1d1f;
        }
        
        .no-tip-button.active {
          border-color: #0071e3;
          background-color: #f0f7ff;
        }
        
        .tip-summary {
          background-color: none;
          border-radius: 12px;
          padding: 16px;
          font-size: 18px;
          font-weight: 600;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .summary-row.total {
          margin-top: 12px;
          padding-top: 12px;
          
        }
        
        .summary-label {
          font-size: 14px;
          color: #86868b;
        }
        
        .summary-value {
          font-size: 14px;
          font-weight: 500;
          color: #1d1d1f;
        }
        
        .summary-row.total .summary-label,
        .summary-row.total .summary-value {
          font-size: 16px;
          font-weight: 600;
        }
        
        .modal-footer {
          flex-shrink: 0;
          padding-top: 16px;
          border-top: 1px solid #e5e5e5;
          margin-top: 24px;
        }
        
        .confirm-button {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 30px;
          background-color: #0071e3;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .confirm-button:hover {
          background-color: #0062c4;
        }
      `}</style>
    </div>
  );
};

export default TipModal;