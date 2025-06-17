import { useState, useRef, useEffect } from "react";
import { Share2, Copy, MessageCircle, Mail } from 'lucide-react';

// Updated Bill Split Wheel Component - Circular Progress Style
const BillSplitWheel = ({ numberOfPeople, perPersonAmount, totalAmount, splitMethod, customAmount }) => {
  // Define colors - using a blue color as in the original code
  const primaryColor = '#2ecc71';
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
    return `£${amount.toFixed(2)}`;
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

// Share Payment Link Component
const SharePaymentLink = ({ remainingAmount, totalAmount, onClose, onPayMyPart }) => {
  const [linkCopied, setLinkCopied] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(true);
  const [paymentLink, setPaymentLink] = useState('');
  const [error, setError] = useState(null);

  // Generate secure payment link using backend API
  const generateSecurePaymentLink = async () => {
    try {
      setIsGeneratingLink(true);
      setError(null);

      // Get the consistent temporary order ID
      const generateTempOrderId = () => {
        const storedTempId = sessionStorage.getItem("temp_order_id");
        if (storedTempId) {
          return storedTempId;
        }
        
        const randomId = `temp-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString().slice(-6)}`;
        sessionStorage.setItem("temp_order_id", randomId);
        return randomId;
      };

      const tempOrderId = generateTempOrderId();

      // Prepare the data for secure sharing (simplified for bill split)
      const shareData = {
        remaining_items: [{
          id: 'split-payment',
          name: 'Remaining Payment Amount',
          price: remainingAmount / 100,
          quantity: 1,
          options: '',
          description: `Split payment for remaining £${(remainingAmount / 100).toFixed(2)}`
        }],
        order_id: tempOrderId,
        type: 'bill_split',
        metadata: {
          remaining_amount: remainingAmount,
          total_amount: totalAmount,
          share_created_at: new Date().toISOString()
        }
      };

      // Call the secure backend API to create share session
      const response = await fetch('https://tablemint.onrender.com/api/orders/share/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shareData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create secure share session');
      }

      // Generate the secure share URL using the token
      const shareToken = result.share_token;
      const secureLink = `${window.location.origin}/split-payment/${shareToken}`;
      
      setPaymentLink(secureLink);

    } catch (err) {
      console.error('Error generating secure payment link:', err);
      setError(err.message || 'Failed to generate secure link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Generate the link when component mounts
  useEffect(() => {
    generateSecurePaymentLink();
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareViaWhatsApp = () => {
    const message = `Hi! I've started a bill split for our order. The remaining amount is £${(remainingAmount / 100).toFixed(2)}. Please use this secure link to pay your share: ${paymentLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = () => {
    const subject = 'Split Bill Payment Request';
    const body = `Hi!\n\nI've started a bill split for our order. The remaining amount is £${(remainingAmount / 100).toFixed(2)}.\n\nPlease use this secure link to pay your share:\n${paymentLink}\n\nThis link is secure and will expire in 24 hours.\n\nThanks!`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const shareViaGeneric = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Split Bill Payment',
        text: `Pay your share of £${(remainingAmount / 100).toFixed(2)}`,
        url: paymentLink
      });
    }
  };

  return (
    <div className="share-payment-container">
      <div className="share-header">
        <h3>Share Payment Link</h3>
        <p>Send this secure link to others so they can pay the remaining £{(remainingAmount / 100).toFixed(2)}</p>
      </div>
      
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={generateSecurePaymentLink} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {isGeneratingLink ? (
        <div className="generating-link">
          <div className="loading-spinner"></div>
          <p>Generating secure link...</p>
        </div>
      ) : paymentLink && (
        <>
          <div className="payment-link-container">
            <div className="payment-link-display">
              <input 
                type="text" 
                value={paymentLink} 
                readOnly 
                className="payment-link-input"
              />
              <button 
                onClick={copyToClipboard}
                className={`copy-link-btn ${linkCopied ? 'copied' : ''}`}
              >
                <Copy size={16} />
                {linkCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="share-options">
            <button onClick={shareViaWhatsApp} className="share-option whatsapp">
              <MessageCircle size={20} />
              <span>WhatsApp</span>
            </button>
            
            <button onClick={shareViaEmail} className="share-option email">
              <Mail size={20} />
              <span>Email</span>
            </button>
            
            {navigator.share && (
              <button onClick={shareViaGeneric} className="share-option generic">
                <Share2 size={20} />
                <span>Share</span>
              </button>
            )}
          </div>
        </>
      )}

      <div className="share-footer">
        <button onClick={onPayMyPart || onClose} className="continue-payment-btn">
          Pay My Part
        </button>
      </div>
    </div>
  );
};

// Split Bill Modal Component for Cart
const CartSplitBillModal = ({ isOpen, onClose, totalAmount, onConfirm }) => {
  const [splitMethod, setSplitMethod] = useState("equal");
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [customAmount, setCustomAmount] = useState("");
  const [youPayFor, setYouPayFor] = useState(1);
  const [showShareLink, setShowShareLink] = useState(false);
  
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
    // Only allow valid decimal numbers
    if (value === "" || (/^\d+(\.\d{0,2})?$/.test(value) && parseFloat(value) > 0)) {
      setCustomAmount(value);
    }
  };

  const handleSplitAndShare = () => {
    // Determine the amount to be paid based on the selected split method
    let amountToPay;
    let remainingAmount;
    
    if (splitMethod === 'equal') {
      amountToPay = (totalAmount / numberOfPeople) * youPayFor;
      remainingAmount = totalAmount - amountToPay;
    } else {
      amountToPay = parseFloat(customAmount) * 100 || 0; // Convert to cents
      remainingAmount = totalAmount - amountToPay;
    }
    
    if (remainingAmount > 0) {
      setShowShareLink(true);
    } else {
      // If no remaining amount, just proceed with payment
      handleConfirm();
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
        <div className="number-input-row">
          <div className="number-input-label">{label}</div>
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

  const calculateRemainingAmount = () => {
    let amountToPay;
    if (splitMethod === 'equal') {
      amountToPay = (totalAmount / numberOfPeople) * youPayFor;
    } else {
      amountToPay = parseFloat(customAmount) * 100 || 0;
    }
    return totalAmount - amountToPay;
  };

  if (!isOpen) return null;

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
        
        {!showShareLink ? (
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
                          label="Total people"
                          description="you pay for"
                        />
                      </div>
                    </div>
                    
                    <div className="payment-info">
                      <div className="amount-per-person">
                        <div className="label">Your share £{perPersonAmount.toFixed(2)}</div>
                        <div className="small-text">inclusive of all taxes & fees</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="custom-amount">
                    <div className="input-group">
                      <div className="section-label">Amount you'll pay</div>
                      <div className="amount-input">
                        <span className="currency">£</span>
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
                            £{Math.max(0, (totalAmount / 100 - parseFloat(customAmount || 0))).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <SharePaymentLink 
            remainingAmount={calculateRemainingAmount()}
            totalAmount={totalAmount}
            onClose={() => setShowShareLink(false)}
            onPayMyPart={handleConfirm}
          />
        )}
        
        {!showShareLink && (
          <div className="modal-footer">
            <div className="button-row">
              <button className="cancel-button" onClick={onClose}>Cancel</button>
              <button className="confirm-button" onClick={handleSplitAndShare}>
                {calculateRemainingAmount() > 0 ? 'Split & Share' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
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
          background-color: black;
          border-radius: 30px;
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
          z-index: 1;
          top: 4px;
          height: calc(100% - 8px);
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
          border: none;
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
          background-color: #2ecc71;
          color: white;
          transition: all 0.2s ease;
        }

        .confirm-button:hover {
          background-color: #27ae60;
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
          padding: 0px;
          margin-bottom: 0px;
          display: flex;
          justify-content: center;
          width: 100%;
          max-width: 320px;
          margin-left: auto;
          margin-right: auto;
        }
        
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
          font-weight: 500;
          width: 80px;
          text-align: left;
          margin-right: 8px;
        }
        
        .number-input-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          width: 100%;
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
          background-color: black;
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
          text-align: right;
          width: 90px;
        }
        
        .payment-info {
          margin-top: 0px;
          padding-top: 0px;
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

        .section-label {
          font-size: 14px;
          color: #86868b;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .remaining-amount {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
        }

        /* Share Payment Link Styles */
        .share-payment-container {
          padding: 20px 0;
        }

        .share-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .share-header h3 {
          font-size: 20px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0 0 8px 0;
        }

        .share-header p {
          font-size: 14px;
          color: #86868b;
          margin: 0;
        }

        .payment-link-container {
          margin-bottom: 24px;
        }

        .payment-link-display {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .payment-link-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e5e5e7;
          border-radius: 12px;
          font-size: 14px;
          color: #1d1d1f;
          background-color: #f5f5f7;
        }

        .copy-link-btn {
          padding: 12px 16px;
          border: none;
          border-radius: 12px;
          background-color: #2ecc71;
          color: white;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .copy-link-btn.copied {
          background-color: #27ae60;
        }

        .copy-link-btn:hover {
          background-color: #27ae60;
        }

        .share-options {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }

        .share-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 12px;
          border: 1px solid #e5e5e7;
          border-radius: 12px;
          background-color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .share-option:hover {
          border-color: #2ecc71;
          background-color: #f8fffe;
        }

        .share-option.whatsapp:hover {
          border-color: #25d366;
          background-color: #f0fff4;
        }

        .share-option.email:hover {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .share-option span {
          margin-top: 8px;
          font-size: 12px;
          font-weight: 500;
          color: #1d1d1f;
        }

        .share-footer {
          text-align: center;
        }

        .continue-payment-btn {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 12px;
          background-color: #2ecc71;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .continue-payment-btn:hover {
          background-color: #27ae60;
        }
      `}</style>
    </div>
  );
};

export default CartSplitBillModal;
