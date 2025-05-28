import { useState, useEffect } from "react";

const ItemSelectionModal = ({ isOpen, onClose, items, onConfirm }) => {
  // State to track selected items and their quantities
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Initialize selected items when modal opens or items change
  useEffect(() => {
    if (isOpen && items) {
      // Create a default selection with all items and their original quantities
      const initialSelection = items.map(item => ({
        ...item,
        selected: false, // Default to not selected
        payQuantity: item.quantity // Default quantity to pay for is the original quantity
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
          ...item.total_money,
          amount: item.base_price_money.amount * item.payQuantity
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
          <div key={index} className={`item-row ${item.selected ? 'selected' : ''}`}>
            <div className="item-selection">
              <input
                type="checkbox"
                checked={item.selected}
                onChange={() => toggleItemSelection(index)}
                id={`item-${index}`}
                className="item-checkbox"
              />
              <label htmlFor={`item-${index}`} className="item-label">
                <div className="item-details">
                  <div className="item-name">{item.name}</div>
                  <div className="item-price">
                    {formatCurrency(item.base_price_money?.amount * item.payQuantity, item.base_price_money?.currency)}
                  </div>
                </div>
              </label>
            </div>
            
            {item.selected && item.quantity > 1 && (
              <div className="quantity-selector">
                <div className="quantity-label">Quantity:</div>
                <div className="quantity-controls">
                  <button 
                    className="quantity-btn"
                    onClick={() => updatePayQuantity(index, item.payQuantity - 1)}
                    disabled={item.payQuantity <= 1}
                  >−</button>
                  <span className="quantity-value">{item.payQuantity}</span>
                  <button 
                    className="quantity-btn"
                    onClick={() => updatePayQuantity(index, item.payQuantity + 1)}
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
          <span>Total</span>
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
          Confirm and Add Tip
        </button>
      </div>
      
      <style jsx>{`
        .items-modal-content {
          padding: 16px 24px 24px;
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
          background-color: #f5f5f7;
          transition: all 0.2s ease;
        }
        
        .item-row.selected {
          background-color: #f0f7ff;
          border: 1px solid #0071e3;
        }
        
        .item-selection {
          display: flex;
          align-items: center;
        }
        
        .item-checkbox {
          width: 20px;
          height: 20px;
          margin-right: 16px;
          accent-color: #0071e3;
        }
        
        .item-label {
          flex: 1;
          cursor: pointer;
        }
        
        .item-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .item-name {
          font-weight: 500;
          font-size: 16px;
          color: #1d1d1f;
        }
        
        .item-price {
          font-weight: 600;
          color: #1d1d1f;
        }
        
        .quantity-selector {
          display: flex;
          align-items: center;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px dashed #e0e0e0;
        }
        
        .quantity-label {
          font-size: 14px;
          color: #86868b;
          margin-right: 12px;
        }
        
        .quantity-controls {
          display: flex;
          align-items: center;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #e0e0e0;
        }
        
        .quantity-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #0071e3;
        }
        
        .quantity-btn:disabled {
          color: #86868b;
          cursor: not-allowed;
        }
        
        .quantity-value {
          width: 36px;
          text-align: center;
          font-weight: 600;
        }
        
        .quantity-total {
          margin-left: 12px;
          font-size: 14px;
          color: #86868b;
        }
        
        .items-summary {
          background-color: #f9f9f9;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 18px;
          font-weight: 600;
        }
        
        .summary-amount {
          color: #0071e3;
        }
        
        .modal-footer {
          display: flex;
          gap: 12px;
        }
        
        .cancel-button, .confirm-button {
          flex: 1;
          padding: 16px;
          border-radius: 30px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        
        .cancel-button {
          background-color: #f5f5f7;
          color: #1d1d1f;
          border: 1px solid #e0e0e0;
        }
        
        .confirm-button {
          background-color: #0071e3;
          color: white;
        }
        
        .confirm-button:disabled {
          background-color: #a2c5eb;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ItemSelectionModal;