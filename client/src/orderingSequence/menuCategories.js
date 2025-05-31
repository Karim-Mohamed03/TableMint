import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';


// Function to fetch catalog data from the backend API
const getCatalogData = async (locationId = null) => {
  try {
    const url = new URL('https://tablemint.onrender.com/api/pos/catalog/');
    if (locationId) {
      url.searchParams.append('location_id', locationId);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      console.log('Catalog data fetched successfully:', data);
      return data;
    } else {
      console.error('Failed to fetch catalog:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Error calling get_catalog:', error);
    return null;
  }
};

// Function to fetch inventory data for a single item variation
const getItemInventory = async (catalogObjectId, locationId = null) => {
  console.log(`🔍 [DEBUG] Starting inventory fetch for variation: ${catalogObjectId}`);
  console.log(`🔍 [DEBUG] Location ID: ${locationId}`);
  
  try {
    // Fix the URL construction - remove the extra query parameter
    const url = new URL('https://tablemint.onrender.com/api/orders/inventory/');
    url.searchParams.append('catalog_object_id', catalogObjectId);
    if (locationId) {
      url.searchParams.append('location_ids', locationId);
    }

    const finalUrl = url.toString();
    console.log(`🔍 [DEBUG] Final URL: ${finalUrl}`);

    const response = await fetch(finalUrl, {
      method: 'GET',
    });

    console.log(`🔍 [DEBUG] Response status: ${response.status}`);
    console.log(`🔍 [DEBUG] Response ok: ${response.ok}`);

    if (!response.ok) {
      console.error(`❌ [DEBUG] HTTP error! status: ${response.status}`);
      const errorText = await response.text();
      console.error(`❌ [DEBUG] Error response body: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`🔍 [DEBUG] Response data for ${catalogObjectId}:`, data);
    console.log(`🔍 [DEBUG] Data has 'success' property: ${data.hasOwnProperty('success')}`);
    console.log(`🔍 [DEBUG] Data has 'errors' property: ${data.hasOwnProperty('errors')}`);
    console.log(`🔍 [DEBUG] Data has 'counts' property: ${data.hasOwnProperty('counts')}`);
    
    // Check for Square API format (errors + counts) instead of success property
    if (data.hasOwnProperty('errors') && data.hasOwnProperty('counts')) {
      console.log(`✅ [DEBUG] Square API format detected`);
      console.log(`🔍 [DEBUG] Errors array length: ${data.errors ? data.errors.length : 'null'}`);
      console.log(`🔍 [DEBUG] Counts array length: ${data.counts ? data.counts.length : 'null'}`);
      
      if (data.errors && data.errors.length > 0) {
        console.error(`❌ [DEBUG] API returned errors:`, data.errors);
        return { success: false, errors: data.errors, counts: [] };
      } else {
        console.log(`✅ [DEBUG] API returned success with counts:`, data.counts);
        return { success: true, errors: [], counts: data.counts };
      }
    } else if (data.success) {
      console.log(`✅ [DEBUG] Legacy success format detected`);
      return data;
    } else {
      console.error(`❌ [DEBUG] Unexpected response format:`, data);
      return { success: false, errors: [data.error || 'Unknown error'], counts: [] };
    }
  } catch (error) {
    console.error(`❌ [DEBUG] Exception in getItemInventory for ${catalogObjectId}:`, error);
    return { success: false, errors: [error.message], counts: [] };
  }
};

// Function to fetch inventory data for multiple items individually
const getInventoryData = async (itemVariationMap, locationId = null) => {
  try {
    console.log(`📊 [DEBUG] Starting batch inventory fetch for ${itemVariationMap.length} variations`);
    console.log('📊 [DEBUG] Item variation mapping:', itemVariationMap);
    console.log(`📊 [DEBUG] Location ID for batch: ${locationId}`);
    
    // Fetch inventory for each variation individually
    const inventoryPromises = itemVariationMap.map((mapping, index) => {
      console.log(`📊 [DEBUG] Creating promise ${index + 1}/${itemVariationMap.length} for variation: ${mapping.variationId}`);
      return getItemInventory(mapping.variationId, locationId);
    });
    
    console.log(`📊 [DEBUG] Created ${inventoryPromises.length} inventory promises`);
    const inventoryResults = await Promise.all(inventoryPromises);
    console.log(`📊 [DEBUG] All inventory promises resolved. Results:`, inventoryResults);
    
    // Process results and create inventory map
    const counts = [];
    inventoryResults.forEach((result, index) => {
      const mapping = itemVariationMap[index];
      console.log(`📊 [DEBUG] Processing result ${index + 1}: variation ${mapping.variationId}, item ${mapping.itemId}`);
      console.log(`📊 [DEBUG] Result content:`, result);
      
      if (result && result.success && result.counts && result.counts.length > 0) {
        console.log(`✅ [DEBUG] Valid inventory data found for ${mapping.variationId}`);
        const inventoryInfo = result.counts[0]; // Take the first (and should be only) result
        const processedCount = {
          catalog_object_id: inventoryInfo.catalog_object_id,
          quantity: inventoryInfo.quantity || '0',
          state: inventoryInfo.state || 'IN_STOCK',
          location_id: inventoryInfo.location_id
        };
        counts.push(processedCount);
        console.log(`✅ [DEBUG] Added processed count:`, processedCount);
      } else {
        console.log(`⚠️ [DEBUG] No valid inventory data for ${mapping.variationId}, using default`);
        // Default to in stock if no inventory data available
        const defaultCount = {
          catalog_object_id: mapping.variationId,
          quantity: '1',
          state: 'IN_STOCK',
          location_id: locationId
        };
        counts.push(defaultCount);
        console.log(`⚠️ [DEBUG] Added default count:`, defaultCount);
      }
    });
    
    console.log(`📊 [DEBUG] Final processed counts (${counts.length} items):`, counts);
    const finalResult = {
      success: true,
      counts: counts
    };
    console.log(`📊 [DEBUG] Returning final result:`, finalResult);
    return finalResult;
  } catch (error) {
    console.error(`❌ [DEBUG] Exception in getInventoryData:`, error);
    return { success: false, counts: [] };
  }
};



// Helper function to fetch available locations
const getLocations = async () => {
  try {
    const response = await fetch('https://tablemint.onrender.com/api/pos/locations/', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      console.log('Locations fetched successfully:', data);
      return data.locations;
    } else {
      console.error('Failed to fetch locations:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Error fetching locations:', error);
    return null;
  }
};

// Helper function to check if an item is available at a specific location
const isItemAvailableAtLocation = (item, locationId) => {
  // If no locationId is specified, show all items
  if (!locationId) {
    console.log(`✅ [LOCATION FILTER] No locationId specified, showing all items`);
    return true;
  }

  console.log(`🔍 [LOCATION FILTER] Checking item ${item.id} (${item.item_data?.name}) for location ${locationId}`);

  // Check if item is present at all locations at the item level
  if (item.present_at_all_locations) {
    console.log(`📍 [LOCATION FILTER] Item ${item.id} is present at all locations (item level)`);
    return true; // Show item regardless of sold_out status
  }

  // Check if item has present_at_location_ids at the item level
  if (item.present_at_location_ids && Array.isArray(item.present_at_location_ids)) {
    console.log(`📍 [LOCATION FILTER] Item ${item.id} present_at_location_ids (item level):`, item.present_at_location_ids);
    
    if (item.present_at_location_ids.includes(locationId)) {
      console.log(`✅ [LOCATION FILTER] Item ${item.id} is available at location ${locationId} (found in item-level present_at_location_ids)`);
      return true; // Show item regardless of sold_out status
    }
  }

  // Check variations for location availability
  const variations = item.item_data?.variations || [];
  console.log(`🔍 [LOCATION FILTER] Checking ${variations.length} variations for item ${item.id}`);
  
  for (const variation of variations) {
    console.log(`🔍 [VARIATION] Checking variation ${variation.id}`);
    console.log(`  - present_at_all_locations: ${variation.present_at_all_locations}`);
    console.log(`  - present_at_location_ids: ${JSON.stringify(variation.present_at_location_ids)}`);
    
    // Check if variation is present at all locations
    if (variation.present_at_all_locations) {
      console.log(`✅ [LOCATION FILTER] Variation ${variation.id} is present at all locations`);
      return true; // Show item regardless of sold_out status
    }
    
    // Check if variation has present_at_location_ids
    if (variation.present_at_location_ids && Array.isArray(variation.present_at_location_ids)) {
      console.log(`📍 [LOCATION FILTER] Variation ${variation.id} present_at_location_ids:`, variation.present_at_location_ids);
      
      if (variation.present_at_location_ids.includes(locationId)) {
        console.log(`✅ [LOCATION FILTER] Variation ${variation.id} is available at location ${locationId}`);
        return true; // Show item regardless of sold_out status
      }
    }
  }

  // If no variations are available at this location, item is not available
  console.log(`❌ [LOCATION FILTER] Item ${item.id} has no variations available at location ${locationId}`);
  return false;
};

// Helper function to check if an item is sold out at a specific location
const isItemSoldOutAtLocation = (item, locationId) => {
  // If no locationId is specified, can't determine sold out status
  if (!locationId) {
    return false;
  }

  console.log(`🔍 [SOLD OUT CHECK] Checking if item ${item.id} (${item.item_data?.name}) is sold out at location ${locationId}`);

  // Check variations for sold out status
  const variations = item.item_data?.variations || [];
  
  for (const variation of variations) {
    const locationOverrides = variation.item_variation_data?.location_overrides || [];
    
    // Look for a location override that matches our location ID
    const locationOverride = locationOverrides.find(override => override.location_id === locationId);
    
    if (locationOverride && locationOverride.sold_out === true) {
      console.log(`❌ [SOLD OUT CHECK] Item ${item.id} is sold out at location ${locationId}`);
      return true;
    }
  }

  console.log(`✅ [SOLD OUT CHECK] Item ${item.id} is NOT sold out at location ${locationId}`);
  return false;
};

// Main MenuCategories component
const MenuCategories = () => {
  const navigate = useNavigate();
  const { locationId } = useParams(); // Extract location_id from URL
  const { addItem, getItemCount } = useCart();
  const [catalogData, setCatalogData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inventoryData, setInventoryData] = useState({});
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // Fetch catalog data on component mount
  useEffect(() => {
    const fetchData = async () => {
      console.log(`🚀 [DEBUG] Starting data fetch process with location_id: ${locationId}`);
      setLoading(true);
      setError(null);
      
      // Fetch catalog data with location_id
      console.log(`📋 [DEBUG] Fetching catalog data for location: ${locationId}`);
      const catalogResponse = await getCatalogData(locationId);
      console.log(`📋 [DEBUG] Catalog response:`, catalogResponse);
      
      if (catalogResponse && catalogResponse.success) {
        console.log(`✅ [DEBUG] Catalog fetch successful, setting catalog data`);
        setCatalogData(catalogResponse.objects);
        
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
          console.log(`📦 [DEBUG] Starting inventory fetch for ${itemVariationMap.length} variations with location_id: ${locationId}`);
          setInventoryLoading(true);
          
          // Pass the location_id to the inventory fetch
          const inventoryResponse = await getInventoryData(itemVariationMap, locationId);
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
      
      console.log(`🏁 [DEBUG] Data fetch process complete`);
      setLoading(false);
    };

    fetchData();
  }, [locationId]); // Add locationId as dependency to refetch when it changes

  const goToCart = () => {
    navigate('/cart');
  };

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

  // Filter items by category and location
  const getFilteredItems = () => {
    let items = organizedData.items;
    
    console.log(`🔍 [FILTER DEBUG] Starting with ${items.length} total items`);
    console.log(`🔍 [FILTER DEBUG] Current locationId from URL: "${locationId}"`);
    console.log(`🔍 [FILTER DEBUG] Selected category: "${selectedCategory}"`);
    
    // Filter by location first if locationId is provided
    if (locationId) {
      console.log(`🔍 [LOCATION FILTER] Filtering ${items.length} items for location: ${locationId}`);
      
      items.forEach((item, index) => {
        console.log(`🔍 [ITEM ${index + 1}] ${item.item_data?.name} (${item.id})`);
        console.log(`  - present_at_all_locations: ${item.present_at_all_locations}`);
        console.log(`  - present_at_location_ids: ${JSON.stringify(item.present_at_location_ids)}`);
        const isAvailable = isItemAvailableAtLocation(item, locationId);
        console.log(`  - isAvailable: ${isAvailable}`);
      });
      
      items = items.filter(item => isItemAvailableAtLocation(item, locationId));
      console.log(`🔍 [LOCATION FILTER] After location filtering: ${items.length} items remaining`);
      
      if (items.length > 0) {
        console.log(`✅ [LOCATION FILTER] Remaining items:`, items.map(item => `${item.item_data?.name} (${item.id})`));
      } else {
        console.log(`❌ [LOCATION FILTER] No items passed location filter!`);
      }
    }
    
    // Then filter by category
    if (selectedCategory === 'all') {
      console.log(`🔍 [CATEGORY FILTER] Showing all categories, final count: ${items.length}`);
      return items;
    }
    
    const categoryFiltered = items.filter(item => 
      item.item_data?.categories?.some(cat => cat.id === selectedCategory)
    );
    console.log(`🔍 [CATEGORY FILTER] After category "${selectedCategory}" filtering: ${categoryFiltered.length} items`);
    
    return categoryFiltered;
  };

  // Loading state
  if (loading) {
    return (
      <div className="menu-categories">
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
      <div className="menu-categories">
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
    <div className="menu-categories">
      {/* Header */}
      <div className="menu-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Menu</h1>
            <p>Choose from our delicious selection</p>
          </div>
          <button className="cart-button" onClick={goToCart}>
            <ShoppingCart size={24} />
            {getItemCount() > 0 && (
              <span className="cart-badge">{getItemCount()}</span>
            )}
          </button>
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
          const soldOutAtLocation = locationId ? isItemSoldOutAtLocation(item, locationId) : false;
          const isAvailable = inStock && !soldOutAtLocation;

          return (
            <div key={item.id} className="menu-item-card">
              <div className="item-content">
                <div className="item-header">
                  <h3 className="item-name">{itemData?.name || 'Unknown Item'}</h3>
                  <div className="item-price">
                    {formatCurrency(price?.amount, price?.currency)}
                  </div>
                </div>
                
                {soldOutAtLocation && (
                  <div className="sold-out-badge">
                    Out of Stock at this Location
                  </div>
                )}
                
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
              
              <button 
                className={`add-to-order-btn ${!isAvailable ? 'sold-out' : ''}`}
                disabled={!isAvailable}
                onClick={() => isAvailable && handleAddToCart(item)}
              >
                {soldOutAtLocation ? 'Out of Stock at Location' : !inStock ? 'Out of Stock' : 'Add to Order'}
              </button>
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
        .menu-categories {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
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
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }

        .retry-button:hover {
          background: #0056b3;
        }

        .menu-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header-text {
          flex: 1;
          text-align: left;
        }

        .menu-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 8px 0;
        }

        .menu-header p {
          color: #666;
          font-size: 16px;
          margin: 0;
        }

        .cart-button {
          position: relative;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px;
          cursor: pointer;
          transition: background 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cart-button:hover {
          background: #0056b3;
        }

        .cart-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #e74c3c;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 12px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .category-filter {
          display: flex;
          gap: 8px;
          margin-bottom: 30px;
          overflow-x: auto;
          padding-bottom: 8px;
        }

        .category-btn {
          background: #f8f9fa;
          border: 2px solid transparent;
          padding: 10px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          transition: all 0.2s ease;
          color: #666;
        }

        .category-btn:hover {
          background: #e9ecef;
        }

        .category-btn.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .menu-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .menu-item-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: 1px solid #e5e5e7;
        }

        .menu-item-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .item-content {
          margin-bottom: 16px;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .item-name {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
          flex: 1;
          margin-right: 12px;
        }

        .item-price {
          font-size: 18px;
          font-weight: 700;
          color: #007bff;
        }

        .sold-out-badge {
          background: #ff4757;
          color: white;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          display: inline-block;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .item-description {
          color: #666;
          font-size: 14px;
          line-height: 1.4;
          margin: 0 0 12px 0;
        }

        .item-details {
          margin-bottom: 12px;
        }

        .calorie-info {
          background: #f8f9fa;
          color: #666;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-right: 8px;
        }

        .ingredients {
          margin-top: 8px;
        }

        .ingredients-label {
          font-size: 12px;
          color: #666;
          font-weight: 600;
        }

        .ingredient-tag {
          background: #fff3cd;
          color: #856404;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          margin-left: 4px;
          text-transform: capitalize;
        }

        .item-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .item-type {
          background: #e3f2fd;
          color: #1976d2;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .item-type.food_and_bev {
          background: #e8f5e8;
          color: #2e7d32;
        }

        .alcoholic-tag {
          background: #ffebee;
          color: #c62828;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .add-to-order-btn {
          width: 100%;
          background: #007bff;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .add-to-order-btn:hover {
          background: #0056b3;
        }

        .add-to-order-btn.sold-out {
          background: #6c757d;
          color: #ffffff;
          cursor: not-allowed;
        }

        .add-to-order-btn.sold-out:hover {
          background: #6c757d;
        }

        .no-items {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .menu-categories {
            padding: 16px;
          }

          .menu-header h1 {
            font-size: 28px;
          }

          .menu-items-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .item-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .item-name {
            margin-right: 0;
            margin-bottom: 8px;
          }
        }
      `}</style>
    </div>
  );
};

// Export the component and utility functions
export default MenuCategories;
export { getCatalogData, getInventoryData };