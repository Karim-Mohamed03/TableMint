import { useState, useRef, useEffect } from "react";

// Updated Bill Split Wheel Component - Circular Progress Style
const BillSplitWheel = ({ numberOfPeople, perPersonAmount, totalAmount, splitMethod, customAmount }) => {
  // Define colors - using a blue color as in the original code
  const primaryColor = '#0071e3';
  const secondaryColor = '#f0f0f0'; // Light grey for the background arc
  
  // Calculate percentage based on split method
  const calculatePercentage = () => {
    if (splitMethod === 'equal') {
      // In equal split, highlight represents user's portion (1/numberOfPeople)
      return (1 / numberOfPeople) * 100;
    } else {
      // In custom split, highlight represents the custom amount portion
      const customAmountValue = parseFloat(customAmount) || 0;
      return (customAmountValue / (totalAmount / 100)) * 100;
    }
  };
  
  const percentage = calculatePercentage();
  
  // SVG parameters for the circular progress
  const radius = 100;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Format currency
  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="bill-split-wheel-container">
      <svg width="300" height="300" viewBox="0 0 300 300">
        {/* Background circle */}
        <circle
          stroke={secondaryColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx="150"
          cy="150"
        />
        
        {/* Progress circle - counterclockwise */}
        <circle
          stroke={primaryColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          r={normalizedRadius}
          cx="150"
          cy="150"
          style={{
            strokeDasharray: `${circumference} ${circumference}`,
            strokeDashoffset: strokeDashoffset,
            transform: 'rotate(-90deg)',
            transformOrigin: '150px 150px',
            transition: 'stroke-dashoffset 0.5s ease-in-out'
          }}
        />
        
        {/* White center circle */}
        <circle cx="150" cy="150" r="80" fill="white" />
        
        {/* Total amount text */}
        <text x="150" y="140" textAnchor="middle" className="wheel-total-label" fontSize="16">Total Amount</text>
        <text x="150" y="180" textAnchor="middle" className="wheel-total-amount" fontSize="30">{formatCurrency(totalAmount / 100)}</text>
      </svg>
    </div>
  );
};

// Split Bill Modal Component
const SplitBillModal = ({ isOpen, onClose, baseAmount, tip, totalAmount, onConfirm }) => {
  const [splitMethod, setSplitMethod] = useState("equal");
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [customAmount, setCustomAmount] = useState("");
  const [youPayFor, setYouPayFor] = useState(1);
  
  // Refs for tab animation
  const equalTabRef = useRef(null);
  const customTabRef = useRef(null);
  const [activeTabDimensions, setActiveTabDimensions] = useState({
    left: 0,
    width: 0,
    height: 0,
  });

  // Update active tab dimensions when split method changes
  useEffect(() => {
    const updateTabDimensions = () => {
      const activeTabRef = splitMethod === 'equal' ? equalTabRef : customTabRef;
      if (activeTabRef.current) {
        const { offsetLeft, offsetWidth, offsetHeight } = activeTabRef.current;
        setActiveTabDimensions({
          left: offsetLeft,
          width: offsetWidth,
          height: offsetHeight,
        });
      }
    };

    // Update dimensions on mount and when split method changes
    updateTabDimensions();

    // Add resize listener for responsive behavior
    window.addEventListener('resize', updateTabDimensions);
    return () => window.removeEventListener('resize', updateTabDimensions);
  }, [splitMethod, isOpen]);

  // Stop propagation on modal content clicks
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handlePeopleChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 2 && value <= 10) {
      setNumberOfPeople(value);
    }
  };
  
  const handleYouPayForChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= numberOfPeople) {
      setYouPayFor(value);
    }
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    if (value === "" || (/^\d+(\.\d{0,2})?$/.test(value) && parseFloat(value) > 0)) {
      setCustomAmount(value);
    }
  };

  const handleConfirm = () => {
    // Determine the amount to be paid based on the selected split method
    let amountToPay;
    if (splitMethod === 'equal') {
      amountToPay = (totalAmount / numberOfPeople) * youPayFor;
    } else {
      amountToPay = parseFloat(customAmount) * 100 || 0; // Convert to cents
    }
    
    // Call the onConfirm callback with the amount to pay
    if (onConfirm) {
      onConfirm({
        splitMethod,
        amountToPay,
        numberOfPeople: splitMethod === 'equal' ? numberOfPeople : null,
        youPayFor: splitMethod === 'equal' ? youPayFor : null,
        customAmount: splitMethod === 'custom' ? parseFloat(customAmount) : null
      });
    }
    
    // Close the modal
    onClose();
  };

  const perPersonAmount = totalAmount / 100 / numberOfPeople * youPayFor;

  // Custom Number Input Component
  const NumberInput = ({ value, min, max, onChange, label, description }) => {
    const handleDecrement = () => {
      if (value > min) {
        onChange({ target: { value: value - 1 } });
      }
    };

    const handleIncrement = () => {
      if (value < max) {
        onChange({ target: { value: value + 1 } });
      }
    };

    return (
      <div className="custom-number-input">
        <div className="number-input-label">{label}</div>
        <div className="number-input-row">
          <div className="number-control">
            <button 
              type="button" 
              onClick={handleDecrement}
              className="control-button decrement"
              disabled={value <= min}
            >−</button>
            <div className="number-display">{value}</div>
            <button 
              type="button" 
              onClick={handleIncrement}
              className="control-button increment"
              disabled={value >= max}
            >+</button>
          </div>
          <div className="input-description">{description}</div>
        </div>
      </div>
    );
  };

  return (
    <div className={`modal-backdrop ${isOpen ? 'open' : ''}`} onClick={handleBackdropClick}>
      <div className={`split-bill-modal ${isOpen ? 'open' : ''}`} onClick={handleModalClick}>
        <div className="modal-header">
          <button className="back-button" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 10H5M5 10L10 5M5 10L10 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2>{splitMethod === 'equal' ? "Equal parts" : "Custom amount"}</h2>
          <div style={{ width: 20 }}></div> {/* Empty div for balance */}
        </div>
        
        <div className="modal-body">
          {/* Bill Split Visualization Wheel */}
          <div className="visualization-wheel">
            <BillSplitWheel 
              numberOfPeople={numberOfPeople}
              perPersonAmount={perPersonAmount}
              totalAmount={totalAmount}
              splitMethod={splitMethod}
              customAmount={customAmount}
            />
          </div>
          
          <div className="split-options">
            <div className="option-tabs-container">
              <div className="option-tabs">
                {/* Moving background element that animates position changes */}
                <div 
                  className="tab-active-background" 
                  style={{
                    left: activeTabDimensions.left,
                    width: activeTabDimensions.width,
                    height: activeTabDimensions.height,
                  }} 
                />
                
                <button 
                  ref={equalTabRef}
                  className={`option-tab ${splitMethod === 'equal' ? 'active' : ''}`}
                  onClick={() => setSplitMethod('equal')}
                >
                  Equal parts
                </button>
                <button 
                  ref={customTabRef}
                  className={`option-tab ${splitMethod === 'custom' ? 'active' : ''}`}
                  onClick={() => setSplitMethod('custom')}
                >
                  Custom amount
                </button>
              </div>
            </div>
            
            <div className="content-container">
              {splitMethod === 'equal' ? (
                <div className="equal-split">
                  <div className="people-selector">
                    {/* New number input style that matches the image */}
                    <div className="number-inputs-container">
                      <NumberInput 
                        value={numberOfPeople}
                        min={2}
                        max={10}
                        onChange={handlePeopleChange}
                        label="Total people"
                        description="at your table"
                      />
                      
                      <NumberInput 
                        value={youPayFor}
                        min={1}
                        max={numberOfPeople}
                        onChange={handleYouPayForChange}
                        label="You pay for"
                        description="you pay for"
                      />
                    </div>
                  </div>
                  
                  <div className="payment-info">
                    <div className="amount-per-person">
                      <div className="label">Your share</div>
                      <div className="amount">${perPersonAmount.toFixed(2)}</div>
                      <div className="small-text">inclusive of all taxes & fees</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="custom-amount">
                  <div className="input-group">
                    <div className="section-label">Amount you'll pay</div>
                    <div className="amount-input">
                      <span className="currency">$</span>
                      <input 
                        type="text" 
                        id="custom-amount" 
                        placeholder="0.00" 
                        value={customAmount} 
                        onChange={handleCustomAmountChange}
                      />
                    </div>
                  </div>
                  
                  {customAmount && (
                    <div className="payment-info">
                      <div className="section-label">Remaining amount</div>
                      <div className="remaining-amount">
                        <div className="label">Others pay</div>
                        <div className="amount">
                          ${Math.max(0, (totalAmount / 100 - parseFloat(customAmount || 0))).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <div className="button-row">
            <button className="cancel-button" onClick={onClose}>Cancel</button>
            <button className="confirm-button" onClick={handleConfirm}>Confirm</button>
          </div>
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
          transition: visibility 0s linear 0.5s, opacity 0.5s;
          pointer-events: none;
        }
        
        .modal-backdrop.open {
          visibility: visible;
          opacity: 1;
          transition-delay: 0s;
          pointer-events: auto;
        }
        
        .option-tabs-container {
          margin: 16px 0;
          background-color: #f5f5f7;
          border-radius: 30px;
          width: 100%;
          position: relative;
        }
        
        .option-tabs {
          display: flex;
          width: 100%;
          position: relative;
          z-index: 1;
        }
        
        .tab-active-background {
          position: absolute;
          background-color: #0071e3;
          border-radius: 30px;
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
          z-index: 1;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .back-button {
          background: none;
          border: none;
          cursor: pointer;
        }
        
        .option-tab {
          flex: 1;
          padding: 12px 16px;
          border: none;
          background: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 30px;
          position: relative;
          z-index: 2;
          transition: color 0.3s ease;
          color: #1d1d1f;
        }
        
        .option-tab.active {
          color: #ffffff;
          background-color: transparent;
        }

        .split-bill-modal {
          background-color: white;
          width: 100%;
          max-width: 500px;
          border-radius: 20px 20px 0 0;
          padding: 24px;
          transform: translateY(100%);
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          height: 800px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          z-index: 1001;
          pointer-events: auto;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
        }
        
        .split-bill-modal.open {
          transform: translateY(0);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-shrink: 0;
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          text-align: center;
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding-right: 5px;
        }

        .modal-footer {
          flex-shrink: 0;
          padding-top: 16px;
          border-top: 1px solid #e5e5e5;
          margin-top: auto;
        }

        .button-row {
          display: flex;
          gap: 12px;
          width: 100%;
        }

        .cancel-button {
          flex: 1;
          padding: 14px;
          border-radius: 30px !important;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid #d1d1d6;
          background: #f5f5f7;
          color: #1d1d1f;
          transition: all 0.2s ease;
        }

        .cancel-button:hover {
          background-color: #ebebeb;
        }

        .confirm-button {
          flex: 1;
          padding: 14px;
          border: none;
          border-radius: 30px !important;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          background-color: #0071e3;
          color: white;
          transition: all 0.2s ease;
        }

        .confirm-button:hover {
          background-color: #0062c4;
        }

        .content-container {
          height: auto;
          min-height: 200px;
          overflow-y: auto;
          transition: height 0.3s ease;
        }
        
        .visualization-wheel {
          background-color: transparent;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          display: flex;
          justify-content: center;
          width: 100%;
          max-width: 320px;
          margin-left: auto;
          margin-right: auto;
        }
        
        /* New number input styles that match the image */
        .number-inputs-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          gap: 20px;
        }
        
        .custom-number-input {
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        
        .number-input-label {
          font-size: 14px;
          color: #86868b;
          margin-bottom: 8px;
          text-align: center;
        }
        
        .number-input-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          width: 100%;
          gap: 16px;
        }
        
        .number-control {
          display: flex;
          align-items: center;
          background-color: #ffffff;
          border-radius: 50px;
          height: 48px;
          padding: 0;
          justify-content: space-between;
          color: white;
          width: auto;
        }
        
        .control-button {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: none;
          background-color: #0071e3;
          color: #ffffff;
          font-size: 18px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        
        .control-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .number-display {
          font-size: 16px;
          font-weight: 500;
          min-width: 30px;
          text-align: center;
          color: #1d1d1f;
          padding: 0 4px;
        }
        
        .input-description {
          font-size: 14px;
          color: #86868b;
          text-align: left;
        }
        
        .payment-info {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e5e5e5;
        }
        
        .amount-per-person {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .label {
          font-size: 16px;
          color: #1d1d1f;
          margin-bottom: 8px;
        }
        
        .amount {
          font-size: 24px;
          font-weight: 600;
          color: #1d1d1f;
        }
        
        .small-text {
          font-size: 12px;
          color: #86868b;
          margin-top: 4px;
        }
        
        /* Custom input styling for custom amount */
        .amount-input {
          display: flex;
          align-items: center;
          background-color: #f5f5f7;
          border-radius: 12px;
          padding: 12px 16px;
          margin-top: 8px;
        }
        
        .currency {
          font-size: 18px;
          font-weight: 500;
          color: #1d1d1f;
          margin-right: 8px;
        }
        
        .amount-input input {
          font-size: 18px;
          font-weight: 500;
          color: #1d1d1f;
          background: none;
          border: none;
          outline: none;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default SplitBillModal;