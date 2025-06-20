import React from 'react';
import MenuItem from './MenuItem';

const MenuItemsGrid = ({ 
  items,
  categories,
  formatCurrency, 
  isItemInStock, 
  isItemSoldOutAtLocation, 
  getItemQuantity, 
  handleIncrement, 
  handleDecrement,
  locationId,
  onItemClick
}) => {
  // Group items by category - moved before early return to follow hooks rules
  const groupedItems = React.useMemo(() => {
    const grouped = {};
    
    // Initialize with all categories
    categories.forEach(category => {
      grouped[category.id] = {
        category: category,
        items: []
      };
    });
    
    // Add items to their respective categories
    items.forEach(item => {
      const itemCategories = item.item_data?.categories || [];
      if (itemCategories.length === 0) {
        // Items without categories go to "Other"
        if (!grouped['other']) {
          grouped['other'] = {
            category: { id: 'other', category_data: { name: 'Other' } },
            items: []
          };
        }
        grouped['other'].items.push(item);
      } else {
        itemCategories.forEach(cat => {
          if (grouped[cat.id]) {
            grouped[cat.id].items.push(item);
          }
        });
      }
    });
    
    // Filter out empty categories
    return Object.values(grouped).filter(group => group.items.length > 0);
  }, [items, categories]);

  if (items.length === 0) {
    return (
      <div className="no-items">
        <p>No items found</p>
        
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
      {groupedItems.map(group => (
        <div key={group.category.id} className="category-section" id={`category-${group.category.id}`}>
          <div className="category-header">
            <h2 className="category-title">{group.category.category_data?.name || 'Other'}</h2>

          </div>
          
          <div className="category-items">
            {group.items.map((item, index) => {
              const itemData = item.item_data;
              const variation = itemData?.variations?.[0];
              const inStock = isItemInStock(item.id);
              const soldOutAtLocation = locationId ? isItemSoldOutAtLocation(item, locationId) : false;
              const isAvailable = inStock && !soldOutAtLocation;
              
              // Use consistent ID (variation ID if available, otherwise item ID)
              const cartItemId = variation?.id || item.id;
              const currentQuantity = getItemQuantity(cartItemId);
              const isLastInCategory = index === group.items.length - 1;

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
                  onItemClick={onItemClick}
                  isLastInCategory={isLastInCategory}
                />
              );
            })}
          </div>
        </div>
      ))}
      
      <style jsx>{`
        .menu-items-grid {
          padding: 0;
          font-family: 'Satoshi', sans-serif;
        }

        .category-section {
          margin-bottom: 32px;
          position: sticky;
        }

        .category-section:first-child {
          margin-top: 40px;
        }

        .category-header {
          padding: 24px 16px 16px 16px;
          background: #fff;
          position: sticky;
          top: 120px;
          z-index: 50;
          text-align: left;
        }

        .category-title {
          font-size: 20px;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 8px 0;
          font-family: 'Satoshi', sans-serif;
          text-align: left;
        }

        .category-line {
          height: 2px;
          background: #f0f0f0;
          width: 100%;
          margin-left: 0;
        }

        .category-items {
          background: #fff;
          position: relative;
        }
        
        .category-items::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100vw;
          height: 15px;
          background: #f0f0f0;
          z-index: 1;
        }
      `}</style>
    </div>
  );
};

export default MenuItemsGrid;