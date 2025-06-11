import { useState, useEffect } from "react";
import { Share2, Copy, MessageCircle, Mail } from 'lucide-react';

// Share Remaining Items Component
const ShareRemainingItems = ({ remainingItems, originalItems, onClose }) => {
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Generate a shareable link with remaining items
  const generateShareableLink = () => {
    // Create a unique identifier for this share session
    const shareId = Math.random().toString(36).substring(2, 15);
    
    // In a real implementation, you'd send this data to your backend
    // For now, we'll create a URL with query parameters
    const remainingItemsData = {
      shareId,
      remainingItems: remainingItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        options: item.options,
        description: item.description
      }))
    };
    
    // Encode the data and create the URL
    const encodedData = encodeURIComponent(JSON.stringify(remainingItemsData));
    return `${window.location.origin}/shared-cart?data=${encodedData}`;
  };

  const paymentLink = generateShareableLink();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const shareViaWhatsApp = () => {
    const totalRemainingAmount = remainingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const message = `Hi! I've paid for some items from our order. There are still items remaining worth £${totalRemainingAmount.toFixed(2)}. Please use this link to see what's left and pay for what you want: ${paymentLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = () => {
    const totalRemainingAmount = remainingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const subject = 'Remaining Items to Pay For';
    const body = `Hi!\n\nI've paid for some items from our order. There are still items remaining worth £${totalRemainingAmount.toFixed(2)}.\n\nPlease use this link to see what's left and pay for what you want:\n${paymentLink}\n\nThanks!`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const shareViaGeneric = () => {
    if (navigator.share) {
      const totalRemainingAmount = remainingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      navigator.share({
        title: 'Remaining Items to Pay',
        text: `There are remaining items worth £${totalRemainingAmount.toFixed(2)} to pay for`,
        url: paymentLink
      });
    }
  };

  const totalRemainingAmount = remainingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="share-remaining-container">
      <div className="share-header">
        <h3>Share Remaining Items</h3>
        <p>Send this link so others can pay for the remaining £{totalRemainingAmount.toFixed(2)} worth of items</p>
      </div>
      
      <div className="remaining-items-summary">
        <h4>Remaining Items:</h4>
        <div className="remaining-items-list">
          {remainingItems.map((item, index) => (
            <div key={item.id || index} className="remaining-item">
              <span className="item-name">{item.quantity}x {item.name}</span>
              <span className="item-price">£{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
      
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

      <div className="share-footer">
        <button onClick={onClose} className="continue-payment-btn">
          Continue with My Payment
        </button>
      </div>
    </div>
  );
};

const CartItemSelectionModal = ({ isOpen, onClose, items, onConfirm }) => {
  // State to track selected items and their quantities
  const [selectedItems, setSelectedItems] = useState([]);
  const [showShareView, setShowShareView] = useState(false);
  
  // Initialize selected items when modal opens or items change
  useEffect(() => {
    if (isOpen && items) {
      // Create a default selection with all items and their original quantities
      const initialSelection = items.map(item => ({
        ...item,
        selected: false, // Default to not selected
        payQuantity: item.quantity, // Default quantity to pay for is the original quantity
        // Add price information for cart items
        base_price_money: {
          amount: Math.round(item.price * 100), // Convert to cents
          currency: 'GBP'
        }
      }));
      setSelectedItems(initialSelection);
    }
  }, [isOpen, items]);

  //ITEM SELECTION LOGIC
  
  // Toggle item selection
  const toggleItemSelection = (index) => {
    const updatedItems = [...selectedItems];
    updatedItems[index].selected = !updatedItems[index].selected;
    setSelectedItems(updatedItems);
  };
  
  // Update the quantity of an item to pay for
  const updatePayQuantity = (index, newQuantity) => {
    const item = selectedItems[index];
    // Ensure new quantity is within valid range (1 to original quantity)
    if (newQuantity >= 1 && newQuantity <= item.quantity) {
      const updatedItems = [...selectedItems];
      updatedItems[index].payQuantity = newQuantity;
      setSelectedItems(updatedItems);
    }
  };
  
  // Calculate the total amount based on selected items
  const calculateTotal = () => {
    return selectedItems
      .filter(item => item.selected)
      .reduce((sum, item) => {
        const itemUnitPrice = item.base_price_money?.amount || 0;
        return sum + (itemUnitPrice * item.payQuantity);
      }, 0);
  };
  
  // Format currency for display
  const formatCurrency = (amount, currency = 'GBP') => {
    if (!amount && amount !== 0) return '£0';
    
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    });
    
    return formatter.format(amount / 100);
  };
  
  // Handle confirm button click
  const handleConfirm = () => {
    // Filter out only the selected items
    const itemsToPay = selectedItems
      .filter(item => item.selected)
      .map(item => ({
        ...item,
        // Calculate the total price for this item based on selected quantity
        total_money: {
          amount: item.base_price_money.amount * item.payQuantity,
          currency: item.base_price_money.currency
        }
      }));
    
    // Calculate total amount
    const totalAmount = calculateTotal();
    
    // Call the onConfirm callback with the selected items and total
    onConfirm({
      items: itemsToPay,
      totalAmount
    });
  };

  // Handle Pay & Share button click
  const handlePayAndShare = () => {
    // Filter out only the selected items
    const itemsToPay = selectedItems
      .filter(item => item.selected)
      .map(item => ({
        ...item,
        // Calculate the total price for this item based on selected quantity
        total_money: {
          amount: item.base_price_money.amount * item.payQuantity,
          currency: item.base_price_money.currency
        }
      }));
    
    // Calculate remaining items (not selected or partially selected)
    const remainingItems = [];
    
    selectedItems.forEach(item => {
      if (!item.selected) {
        // Item not selected at all, add full quantity to remaining
        remainingItems.push({
          ...item,
          quantity: item.quantity
        });
      } else if (item.payQuantity < item.quantity) {
        // Item partially selected, add remaining quantity
        remainingItems.push({
          ...item,
          quantity: item.quantity - item.payQuantity
        });
      }
    });
    
    if (remainingItems.length > 0) {
      // Show share view if there are remaining items
      setShowShareView(true);
    } else {
      // No remaining items, just proceed with payment
      handleConfirm();
    }
  };

  // Calculate remaining items
  const calculateRemainingItems = () => {
    const remaining = [];
    selectedItems.forEach(item => {
      if (!item.selected) {
        remaining.push({
          ...item,
          quantity: item.quantity
        });
      } else if (item.payQuantity < item.quantity) {
        remaining.push({
          ...item,
          quantity: item.quantity - item.payQuantity
        });
      }
    });
    return remaining;
  };

  // Calculate whether any items are selected
  const hasSelectedItems = selectedItems.some(item => item.selected);
  
  // Check if modal should be shown
  if (!isOpen) return null;
  
  return (
    <div className="items-modal-content">
      {!showShareView ? (
        <>
          <div className="modal-title">
            <h2>Select Your Items</h2>
            <p>Choose the items you want to pay for</p>
          </div>
          
          <div className="items-list">
            {selectedItems.map((item, index) => (
              <div 
                key={item.id || index} 
                className={`item-row ${item.selected ? 'selected' : ''}`}
                onClick={() => toggleItemSelection(index)}
              >
                <div className="item-selection">
                  <div className="item-details">
                    <div className="item-info">
                      <div className="item-name">{item.name}</div>
                      {item.options && (
                        <div className="item-description">Options: {item.options}</div>
                      )}
                      {item.description && (
                        <div className="item-description">{item.description}</div>
                      )}
                    </div>
                    <div className="item-price">
                      {formatCurrency(item.base_price_money?.amount * item.payQuantity, item.base_price_money?.currency)}
                    </div>
                  </div>
                </div>
                
                {item.selected && item.quantity > 1 && (
                  <div className="quantity-selector">
                    <div className="quantity-label">Quantity:</div>
                    <div className="quantity-controls">
                      <button 
                        className="quantity-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePayQuantity(index, item.payQuantity - 1);
                        }}
                        disabled={item.payQuantity <= 1}
                      >−</button>
                      <span className="quantity-value">{item.payQuantity}</span>
                      <button 
                        className="quantity-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePayQuantity(index, item.payQuantity + 1);
                        }}
                        disabled={item.payQuantity >= item.quantity}
                      >+</button>
                    </div>
                    <div className="quantity-total">of {item.quantity}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="items-summary">
            <div className="summary-row">
              <span>You are paying</span>
              <span className="summary-amount">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
          
          <div className="modal-footer">
            <button className="cancel-button" onClick={onClose}>Cancel</button>
            <div className="confirm-buttons">
              <button 
                className="confirm-button" 
                onClick={handleConfirm}
                disabled={!hasSelectedItems}
              >
                Pay Only
              </button>
              {calculateRemainingItems().length > 0 && (
                <button 
                  className="pay-share-button" 
                  onClick={handlePayAndShare}
                  disabled={!hasSelectedItems}
                >
                  Pay & Share
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <ShareRemainingItems 
          remainingItems={calculateRemainingItems()}
          originalItems={items}
          onClose={() => {
            // When continuing with payment, call the original onConfirm
            const itemsToPay = selectedItems
              .filter(item => item.selected)
              .map(item => ({
                ...item,
                total_money: {
                  amount: item.base_price_money.amount * item.payQuantity,
                  currency: item.base_price_money.currency
                }
              }));
            
            onConfirm({
              items: itemsToPay,
              totalAmount: calculateTotal()
            });
          }}
        />
      )}
      
      <style jsx>{`
        .items-modal-content {
          background-color: white;
          border-radius: 16px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 16px 20px 24px;
        }
        
        .modal-title {
          margin-bottom: 24px;
          text-align: center;
        }
        
        .modal-title h2 {
          font-size: 24px;
          margin: 0 0 8px;
          color: #1d1d1f;
        }
        
        .modal-title p {
          margin: 0;
          color: #86868b;
          font-size: 16px;
        }
        
        .items-list {
          max-height: 400px;
          overflow-y: auto;
          margin-bottom: 24px;
        }
        
        .item-row {
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 12px;
          background-color:rgb(255, 255, 255);
          transition: all 0.2s ease;
          cursor: pointer;
          border: 1px solid #f0f0f0;
        }
        
        .item-row:hover {
          background-color: rgb(250, 250, 250);
        }
        
        .item-row.selected {
          background-color:rgb(245, 245, 245);
          border: 1px solid #2ecc71;
        }
        
        .item-selection {
          display: flex;
          align-items: center;
          width: 100%;
        }
        
        .item-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        
        .item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .item-name {
          font-weight: 600;
          font-size: 16px;
          color: #1d1d1f;
        }
        
        .item-description {
          font-size: 14px;
          color: #86868b;
        }
        
        .item-price {
          font-size: 16px;
          font-weight: 600;
          color: #1d1d1f;
        }
        
        .quantity-selector {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        
        .quantity-label {
          font-size: 14px;
          color: #86868b;
          font-weight: 500;
        }
        
        .quantity-controls {
          display: flex;
          align-items: center;
          background-color: #f8f9fa;
          border-radius: 24px;
          padding: 4px;
          gap: 2px;
        }
        
        .quantity-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background-color: #ffffff;
          color: #1d1d1f;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .quantity-btn:hover:not(:disabled) {
          background-color: #2ecc71;
          color: white;
          transform: scale(1.05);
        }
        
        .quantity-btn:active:not(:disabled) {
          transform: scale(0.95);
        }
        
        .quantity-btn:disabled {
          background-color: #f0f0f0;
          color: #c0c0c0;
          cursor: not-allowed;
          box-shadow: none;
        }
        
        .quantity-value {
          font-size: 16px;
          font-weight: 600;
          color: #1d1d1f;
          min-width: 32px;
          text-align: center;
          padding: 0 8px;
        }
        
        .quantity-total {
          font-size: 14px;
          color: #86868b;
        }
        
        .items-summary {
          background-color: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 18px;
          font-weight: 600;
          color: #1d1d1f;
        }
        
        .summary-amount {
          color: #2ecc71;
        }
        
        .modal-footer {
          display: flex;
          gap: 5px;
        }
        
        .cancel-button {
          flex: 1;
          padding: 14px;
          border: 1px solid #d2d2d7;
          border-radius: 12px;
          background-color: transparent;
          color: #1d1d1f;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .cancel-button:hover {
          background-color: #f5f5f7;
        }
        
        .confirm-button {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 12px;
          background-color: black;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .confirm-button:hover:not(:disabled) {
          background-color: #27ae60;
        }
        
        .confirm-button:disabled {
          background-color: #b0b0b6;
          cursor: not-allowed;
        }

        .pay-share-button {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 12px;
          background-color: #2ecc71;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .pay-share-button:hover:not(:disabled) {
          background-color: #27ae60;
        }
        
        .pay-share-button:disabled {
          background-color: #b0b0b6;
          cursor: not-allowed;
        }

        .confirm-buttons {
          display: flex;
          gap: 8px;
          flex: 2;
        }

        /* ShareRemainingItems Component Styles */
        .share-remaining-container {
          padding: 20px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .share-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .share-header h3 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px;
          color: #1d1d1f;
        }

        .share-header p {
          font-size: 16px;
          color: #86868b;
          margin: 0;
        }

        .remaining-items-summary {
          background-color: #f8f9fa;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .remaining-items-summary h4 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px;
          color: #1d1d1f;
        }

        .remaining-items-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .remaining-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background-color: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .remaining-item .item-name {
          font-size: 14px;
          color: #1d1d1f;
          font-weight: 500;
        }

        .remaining-item .item-price {
          font-size: 14px;
          color: #2ecc71;
          font-weight: 600;
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
          border: 1px solid #d2d2d7;
          border-radius: 8px;
          font-size: 14px;
          background-color: #f8f9fa;
          color: #1d1d1f;
          font-family: monospace;
        }

        .copy-link-btn {
          padding: 12px 16px;
          border: 1px solid #d2d2d7;
          border-radius: 8px;
          background-color: white;
          color: #1d1d1f;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }

        .copy-link-btn:hover {
          background-color: #f5f5f7;
          border-color: #2ecc71;
        }

        .copy-link-btn.copied {
          background-color: #2ecc71;
          color: white;
          border-color: #2ecc71;
        }

        .share-options {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .share-option {
          flex: 1;
          padding: 16px;
          border: 1px solid #d2d2d7;
          border-radius: 12px;
          background-color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #1d1d1f;
        }

        .share-option:hover {
          background-color: #f5f5f7;
          border-color: #2ecc71;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(46, 204, 113, 0.2);
        }

        .share-option.whatsapp:hover {
          border-color: #25D366;
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.2);
        }

        .share-option.email:hover {
          border-color: #ea4335;
          box-shadow: 0 4px 12px rgba(234, 67, 53, 0.2);
        }

        .share-option.generic:hover {
          border-color: #007aff;
          box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
        }

        .share-footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }

        .continue-payment-btn {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 12px;
          background-color: #000000;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .continue-payment-btn:hover {
          background-color: #333333;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};

export default CartItemSelectionModal;
