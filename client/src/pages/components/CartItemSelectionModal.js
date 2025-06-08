import { useState, useEffect } from "react";

const CartItemSelectionModal = ({ isOpen, onClose, items, onConfirm }) => {
  // State to track selected items and their quantities
  const [selectedItems, setSelectedItems] = useState([]);
  
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

  // Calculate whether any items are selected
  const hasSelectedItems = selectedItems.some(item => item.selected);
  
  // Check if modal should be shown
  if (!isOpen) return null;
  
  return (
    <div className="items-modal-content">
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
        <button 
          className="confirm-button" 
          onClick={handleConfirm}
          disabled={!hasSelectedItems}
        >
          Confirm
        </button>
      </div>
      
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
      `}</style>
    </div>
  );
};

export default CartItemSelectionModal;
