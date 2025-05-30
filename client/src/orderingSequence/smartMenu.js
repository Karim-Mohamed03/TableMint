import React, { useState, useEffect } from 'react';

// Import the utility functions from menuCategories
import { getCatalogData, getInventoryData, processCatalogWithImages } from './menuCategories';

// Smart Menu component - Menu display only, no cart functionality
const SmartMenu = () => {
  const [catalogData, setCatalogData] = useState(null);
  const [imageMap, setImageMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inventoryData, setInventoryData] = useState({});
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // Fetch catalog data on component mount
  useEffect(() => {
    const fetchData = async () => {
      console.log(`🚀 [DEBUG] Starting data fetch process for Smart Menu`);
      setLoading(true);
      setError(null);
      
      // Fetch catalog data
      console.log(`📋 [DEBUG] Fetching catalog data...`);
      const catalogResponse = await getCatalogData();
      console.log(`📋 [DEBUG] Catalog response:`, catalogResponse);
      
      if (catalogResponse && catalogResponse.success) {
        console.log(`✅ [DEBUG] Catalog fetch successful, setting catalog data`);
        setCatalogData(catalogResponse.objects);
        
        // Set image map if available
        if (catalogResponse.imageMap) {
          console.log(`🖼️ [DEBUG] Setting image map with ${Object.keys(catalogResponse.imageMap).length} images`);
          setImageMap(catalogResponse.imageMap);
        }
        
        // Extract item variation IDs for inventory check, but keep mapping to item IDs
        const items = catalogResponse.objects.filter(obj => obj.type === 'ITEM');
        console.log(`🔍 [DEBUG] Found ${items.length} items in catalog`);
        
        const itemVariationMap = []; // Array of {itemId, variationId} objects
        
        items.forEach((item, index) => {
          console.log(`🔍 [DEBUG] Processing item ${index + 1}/${items.length}: ${item.id} (${item.item_data?.name})`);
          if (item.item_data?.variations && item.item_data.variations.length > 0) {
            // Use the first variation (most common case)
            const variation = item.item_data.variations[0];
            console.log(`🔍 [DEBUG] Item ${item.id} has variation: ${variation.id}`);
            itemVariationMap.push({
              itemId: item.id,
              variationId: variation.id
            });
          } else {
            console.log(`⚠️ [DEBUG] Item ${item.id} has no variations`);
          }
        });
        
        console.log(`🔍 [DEBUG] Final item variation map (${itemVariationMap.length} items):`, itemVariationMap);
        
        if (itemVariationMap.length > 0) {
          console.log(`📦 [DEBUG] Starting inventory fetch for ${itemVariationMap.length} variations`);
          setInventoryLoading(true);
          
          // No need to specify location ID - backend will use default location
          const inventoryResponse = await getInventoryData(itemVariationMap);
          console.log(`📦 [DEBUG] Inventory response:`, inventoryResponse);
          
          if (inventoryResponse && inventoryResponse.success) {
            console.log(`✅ [DEBUG] Inventory fetch successful, processing data`);
            // Convert inventory array to object for easier lookup
            // Map variation inventory back to item IDs for UI consistency
            const inventoryMap = {};
            inventoryResponse.counts.forEach((count, index) => {
              console.log(`🔄 [DEBUG] Processing inventory count ${index + 1}/${inventoryResponse.counts.length}:`, count);
              // Find the item ID that corresponds to this variation ID
              const itemVariation = itemVariationMap.find(mapping => mapping.variationId === count.catalog_object_id);
              if (itemVariation) {
                console.log(`✅ [DEBUG] Mapping variation ${count.catalog_object_id} to item ${itemVariation.itemId}`);
                inventoryMap[itemVariation.itemId] = {
                  quantity: parseInt(count.quantity || '0'),
                  state: count.state,
                  location_id: count.location_id
                };
              } else {
                console.log(`⚠️ [DEBUG] No item mapping found for variation ${count.catalog_object_id}`);
              }
            });
            console.log(`🔄 [DEBUG] Final inventory map:`, inventoryMap);
            setInventoryData(inventoryMap);
          } else {
            console.error(`❌ [DEBUG] Inventory fetch failed or returned no success`);
          }
          setInventoryLoading(false);
        } else {
          console.log(`⚠️ [DEBUG] No item variations found, skipping inventory fetch`);
        }
      } else {
        console.error(`❌ [DEBUG] Catalog fetch failed`);
        setError('Failed to load menu items');
      }
      
      console.log(`🏁 [DEBUG] Data fetch process complete for Smart Menu`);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Parse and organize catalog data
  const organizedData = React.useMemo(() => {
    if (!catalogData) return { categories: [], items: [] };

    const categories = catalogData.filter(obj => obj.type === 'CATEGORY');
    const items = catalogData.filter(obj => obj.type === 'ITEM');

    return { categories, items };
  }, [catalogData]);

  // Format currency
  const formatCurrency = (amount, currency = 'GBP') => {
    if (!amount) return '£0.00';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  };

  // Check if item is in stock
  const isItemInStock = (itemId) => {
    const inventory = inventoryData[itemId];
    if (!inventory) return true; // Default to in stock if no inventory data
    
    // Item is considered out of stock if quantity is 0 or state indicates unavailable
    return inventory.quantity > 0 && inventory.state !== 'SOLD_OUT';
  };

  // Filter items by category
  const getFilteredItems = () => {
    if (selectedCategory === 'all') {
      return organizedData.items;
    }
    
    return organizedData.items.filter(item => 
      item.item_data?.categories?.some(cat => cat.id === selectedCategory)
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="smart-menu">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading menu...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="smart-menu">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="smart-menu">
      {/* Header */}
      <div className="menu-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Smart Menu</h1>
            <p>Browse our delicious selection</p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        <button 
          className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All Items
        </button>
        {organizedData.categories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.category_data?.name || 'Unknown Category'}
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="menu-items-grid">
        {getFilteredItems().map(item => {
          const itemData = item.item_data;
          const variation = itemData?.variations?.[0];
          const price = variation?.item_variation_data?.price_money;
          const inStock = isItemInStock(item.id);

          return (
            <div key={item.id} className="menu-item-card">
              <div className="item-image-container">
                {/* Item Image */}
                {itemData?.primaryImage ? (
                  <img 
                    src={itemData.primaryImage.url} 
                    alt={itemData.primaryImage.caption || itemData?.name || 'Menu item'}
                    className="item-image"
                    onError={(e) => {
                      console.log(`🖼️ [DEBUG] Image failed to load for item ${item.id}: ${itemData.primaryImage.url}`);
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="no-image-placeholder">
                    <span>No Image</span>
                  </div>
                )}
                
                {/* Out of Stock Overlay */}
                {!inStock && (
                  <div className="out-of-stock-overlay">
                    <span>Out of Stock</span>
                  </div>
                )}
              </div>
              
              <div className="item-content">
                <div className="item-header">
                  <h3 className="item-name">{itemData?.name || 'Unknown Item'}</h3>
                  <div className="item-price">
                    {formatCurrency(price?.amount, price?.currency)}
                  </div>
                </div>
                
                {itemData?.description && (
                  <p className="item-description">{itemData.description}</p>
                )}

                <div className="item-details">
                  {itemData?.food_and_beverage_details?.calorie_count && (
                    <span className="calorie-info">
                      {itemData.food_and_beverage_details.calorie_count} cal
                    </span>
                  )}
                  
                  {itemData?.food_and_beverage_details?.ingredients && (
                    <div className="ingredients">
                      <span className="ingredients-label">Contains: </span>
                      {itemData.food_and_beverage_details.ingredients.map((ingredient, idx) => (
                        <span key={idx} className="ingredient-tag">
                          {ingredient.standard_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="item-meta">
                  <span className={`item-type ${itemData?.product_type?.toLowerCase()}`}>
                    {itemData?.product_type?.replace('_', ' ') || 'Regular'}
                  </span>
                  {itemData?.is_alcoholic && <span className="alcoholic-tag">Contains Alcohol</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No items message */}
      {getFilteredItems().length === 0 && (
        <div className="no-items">
          <p>No items found in this category</p>
        </div>
      )}

      <style jsx>{`
        .smart-menu {
          max-width: 100%;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #fff;
          min-height: 100vh;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          padding: 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #00ccbc;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-container {
          text-align: center;
          padding: 40px 20px;
        }

        .error-message {
          color: #e74c3c;
          font-size: 16px;
          margin-bottom: 20px;
        }

        .retry-button {
          background: #00ccbc;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }

        .retry-button:hover {
          background: #00a693;
        }

        .menu-header {
          background: #fff;
          padding: 16px 16px 8px 16px;
          border-bottom: 1px solid #f0f0f0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-text {
          flex: 1;
        }

        .menu-header h1 {
          font-size: 24px;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 4px 0;
        }

        .menu-header p {
          color: #718096;
          font-size: 14px;
          margin: 0;
        }

        .category-filter {
          display: flex;
          gap: 12px;
          padding: 16px;
          overflow-x: auto;
          background: #fff;
          border-bottom: 1px solid #f0f0f0;
          -webkit-overflow-scrolling: touch;
        }

        .category-filter::-webkit-scrollbar {
          display: none;
        }

        .category-btn {
          background: transparent;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          transition: all 0.2s ease;
          color: #718096;
          position: relative;
        }

        .category-btn:hover {
          color: #2d3748;
        }

        .category-btn.active {
          color: #00ccbc;
          font-weight: 600;
        }

        .category-btn.active::after {
          content: '';
          position: absolute;
          bottom: -16px;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 2px;
          background: #00ccbc;
        }

        .menu-items-grid {
          padding: 0;
        }

        .menu-item-card {
          background: white;
          border: none;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s ease;
          display: flex;
          align-items: center;
          padding: 16px;
          position: relative;
        }

        .menu-item-card:hover {
          background: #f8f9fa;
        }

        .menu-item-card:last-child {
          border-bottom: none;
        }

        .item-content {
          flex: 1;
          padding-right: 16px;
          display: flex;
          flex-direction: column;
          order: 1;
          text-align: left;
          align-items: flex-start;
        }

        .item-header {
          display: block;
          margin-bottom: 8px;
        }

        .item-name {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .item-description {
          color: #718096;
          font-size: 14px;
          line-height: 1.4;
          margin: 0 0 8px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .item-details {
          margin-bottom: 8px;
        }

        .calorie-info {
          color: #718096;
          font-size: 12px;
          font-weight: 500;
        }

        .item-price {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          margin-top: auto;
        }

        .item-image-container {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          background: #f7fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          flex-shrink: 0;
          order: 2;
        }

        .item-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .no-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f7fafc;
          color: #a0aec0;
          font-size: 12px;
        }

        .out-of-stock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 500;
          font-size: 12px;
          border-radius: 8px;
        }

        .item-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .item-type {
          background: #e6fffa;
          color: #00ccbc;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .item-type.food_and_bev {
          background: #f0fff4;
          color: #38a169;
        }

        .alcoholic-tag {
          background: #fed7d7;
          color: #e53e3e;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .ingredients {
          margin-top: 4px;
        }

        .ingredients-label {
          font-size: 12px;
          color: #718096;
          font-weight: 500;
        }

        .ingredient-tag {
          background: #fff5b4;
          color: #744210;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 500;
          margin-left: 4px;
          text-transform: capitalize;
        }

        .no-items {
          text-align: center;
          padding: 60px 20px;
          color: #718096;
        }

        /* Mobile-first design - no media queries needed as this is already mobile-optimized */
        
        /* Larger screens */
        @media (min-width: 768px) {
          .smart-menu {
            max-width: 480px;
            margin: 0 auto;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          }
          
          .menu-header {
            padding: 20px 20px 12px 20px;
          }
          
          .category-filter {
            padding: 20px;
          }
          
          .menu-item-card {
            padding: 20px;
          }
          
          .item-image-container {
            width: 100px;
            height: 100px;
          }
        }
      `}
    </style>
    </div>
  );
};

export default SmartMenu;
