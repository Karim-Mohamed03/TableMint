import React from 'react';
import MenuItem from './MenuItem';

const MenuItemsGrid = ({ 
  items, 
  formatCurrency, 
  isItemInStock, 
  isItemSoldOutAtLocation, 
  getItemQuantity, 
  handleIncrement, 
  handleDecrement,
  locationId 
}) => {
  if (items.length === 0) {
    return (
      <div className="no-items">
        <p>No items found in this category</p>
        
        <style jsx>{`
          .no-items {
            text-align: center;
            padding: 60px 20px;
            font-family: 'Satoshi', sans-serif;
          }

          .no-items p {
            font-family: 'Satoshi', sans-serif;
            font-weight: 400;
            color: #718096;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="menu-items-grid">
      {items.map(item => {
        const itemData = item.item_data;
        const variation = itemData?.variations?.[0];
        const inStock = isItemInStock(item.id);
        const soldOutAtLocation = locationId ? isItemSoldOutAtLocation(item, locationId) : false;
        const isAvailable = inStock && !soldOutAtLocation;
        
        // Use consistent ID (variation ID if available, otherwise item ID)
        const cartItemId = variation?.id || item.id;
        const currentQuantity = getItemQuantity(cartItemId);

        return (
          <MenuItem
            key={item.id}
            item={item}
            formatCurrency={formatCurrency}
            isAvailable={isAvailable}
            soldOutAtLocation={soldOutAtLocation}
            currentQuantity={currentQuantity}
            onIncrement={() => handleIncrement(item)}
            onDecrement={() => handleDecrement(item)}
          />
        );
      })}
      
      <style jsx>{`
        .menu-items-grid {
          padding: 0;
          font-family: 'Satoshi', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default MenuItemsGrid;