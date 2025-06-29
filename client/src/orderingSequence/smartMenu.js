import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

// Import the ItemDetailModal component from the new menu folder location
import ItemDetailModal from '../components/menu/ItemDetailModal';

// Import menu template components
import ModernMinimalistItem from './menuTemplates/ModernMinimalistItem';
import ClassicElegantItem from './menuTemplates/ClassicElegantItem';

// Import utility functions from menuCategories
import { getCatalogData, processCatalogWithImages, getInventoryData } from './menuCategories';

// Smart Menu component - Menu display only, no cart functionality
const SmartMenu = () => {
  const [catalogData, setCatalogData] = useState(null);
  const [imageMap, setImageMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [restaurantContext, setRestaurantContext] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inventoryData, setInventoryData] = useState({});
  const [effectiveLocationId, setEffectiveLocationId] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState('Modern Minimalist');
  const categoryFilterRef = React.useRef(null);

  // We'll use restaurant context instead of the URL param for consistency
  useParams(); // Keep this for potential future use
  
  // Load context from sessionStorage and URL parameters
  useEffect(() => {
    // Get restaurant context from sessionStorage
    const storedRestaurantContext = sessionStorage.getItem('restaurant_context');
    if (storedRestaurantContext) {
      try {
        const restaurantData = JSON.parse(storedRestaurantContext);
        setRestaurantContext(restaurantData);
      } catch (e) {
        console.error('Failed to parse restaurant context:', e);
      }
    }

    // Determine effective location ID from URL parameters or restaurant context
    const urlParams = new URLSearchParams(window.location.search);
    const urlLocationId = urlParams.get('location_id');
    
    // Priority: URL param > restaurant context
    const finalLocationId = urlLocationId || 
                           (storedRestaurantContext ? JSON.parse(storedRestaurantContext).location_id : null);
    
    setEffectiveLocationId(finalLocationId);
  }, []);

  // Fetch catalog data when location is available
  useEffect(() => {
    const fetchData = async () => {
      if (!effectiveLocationId && !restaurantContext) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Use restaurant-specific location ID if available
        const locationIdToUse = effectiveLocationId || restaurantContext?.location_id;
        
        // Get active menu ID from restaurant context or URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const urlMenuId = urlParams.get('menu_id');
        const menuIdToUse = urlMenuId || restaurantContext?.active_menu;
        
        // Fetch catalog data with location_id and menu_id
        const catalogResponse = await getCatalogData(locationIdToUse, menuIdToUse);
        
        if (catalogResponse && catalogResponse.success) {
          // Process the catalog data to include images
          const processedData = processCatalogWithImages(catalogResponse.objects);
          
          // Set the catalog data and image map
          setCatalogData(processedData.objects);
          setImageMap(processedData.imageMap);
          
          // Extract item variation IDs for inventory check
          const items = processedData.objects.filter(obj => obj.type === 'ITEM');
          const itemVariationMap = [];
          
          items.forEach((item) => {
            if (item.item_data?.variations && item.item_data.variations.length > 0) {
              const variation = item.item_data.variations[0];
              itemVariationMap.push({
                itemId: item.id,
                variationId: variation.id
              });
            }
          });
          
          if (itemVariationMap.length > 0) {
            
            // Fetch inventory data
            const inventoryResponse = await getInventoryData(itemVariationMap, locationIdToUse);
            
            if (inventoryResponse && inventoryResponse.success) {
              // Convert inventory array to object for easier lookup
              const inventoryMap = {};
              inventoryResponse.counts.forEach((count) => {
                const itemVariation = itemVariationMap.find(
                  mapping => mapping.variationId === count.catalog_object_id
                );
                if (itemVariation) {
                  inventoryMap[itemVariation.itemId] = {
                    quantity: parseInt(count.quantity || '0'),
                    state: count.state,
                    location_id: count.location_id
                  };
                }
              });
              setInventoryData(inventoryMap);
            }
          }
        } else {
          throw new Error('Failed to load catalog data');
        }
      } catch (err) {
        console.error('Error fetching catalog:', err);
        setError('Failed to load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [effectiveLocationId, restaurantContext]);

  // Get categories and items from catalog data
  const { categories, items } = useMemo(() => {
    if (!catalogData) return { categories: [], items: [] };
    
    // Filter out only category and item objects
    const allCategories = catalogData.filter(obj => obj.type === 'CATEGORY');
    const allItems = catalogData.filter(obj => obj.type === 'ITEM');
    
    console.log('All categories from catalog:', allCategories);
    console.log('All items from catalog:', allItems);
    
    // Process items to include images and inventory data
    const processedItems = allItems.map(item => {
      const itemInventory = inventoryData[item.id];
      const isAvailable = !itemInventory || 
                       (itemInventory.quantity > 0 && itemInventory.state !== 'SOLD_OUT');
      
      console.log('Processing item:', {
        id: item.id,
        name: item.item_data?.name,
        categoryId: item.item_data?.category_id,
        inventory: itemInventory,
        variations: item.item_data?.variations
      });
      
      return {
        ...item,
        name: item.item_data?.name,
        isAvailable,
        inventory: itemInventory
      };
    });
    
    // Group items by category
    const categoriesWithItems = allCategories.map(category => {
      const categoryName = category.category_data?.name || 'Uncategorized';
      const categoryItems = processedItems.filter(item => 
        item.item_data?.category_id === category.id
      );
      
      console.log(`Category ${categoryName} (${category.id}) has ${categoryItems.length} items`);
      
      return {
        ...category,
        name: categoryName,
        items: categoryItems
      };
    });
    
    console.log('Processed categories with items:', categoriesWithItems);
    
    return {
      categories: categoriesWithItems,
      items: processedItems
    };
  }, [catalogData, inventoryData]);
  
  // Get current category items
  const currentCategoryItems = useMemo(() => {
    if (selectedCategory === 'all') {
      console.log('Showing all items:', items);
      return items;
    }
    
    // Find the selected category and return its items
    const category = categories.find(cat => cat.name === selectedCategory);
    console.log('Selected category items:', {
      selectedCategory,
      foundCategory: category,
      allCategories: categories.map(c => c.name)
    });
    return category?.items || [];
  }, [categories, items, selectedCategory]);

  // Format currency
  const formatCurrency = (amount, currency = 'GBP') => {
    if (amount === undefined || amount === null || amount === '') return '';
    
    // If amount is a string, try to convert it to a number
    const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(amountNum)) return '';
    
    // Convert amount from cents to currency units if needed (Square API uses cents)
    const displayAmount = amountNum >= 1000 && amountNum % 100 === 0 ? amountNum / 100 : amountNum;
    
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency
    }).format(displayAmount);
  };

  // Check if item is in stock
  const isItemInStock = (itemId) => {
    const inventory = inventoryData[itemId];
    if (!inventory) return true;
    return inventory.quantity > 0 && inventory.state !== 'SOLD_OUT';
  };

  // Fetch active template from session storage on component mount
  useEffect(() => {
    const restaurantContext = JSON.parse(sessionStorage.getItem('restaurant_context') || '{}');
    if (restaurantContext?.active_template) {
      setActiveTemplate(restaurantContext.active_template);
    }
  }, []); // Empty dependency array means this runs once on mount


  console.log('Active template:', activeTemplate);

  // Handle item selection
  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleCloseModal = () => {
    setShowItemModal(false);
    setSelectedItem(null);
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
      <div className="menu-header-container">
        <div className="menu-header">
          <div className="header-content">
            <div className="header-text">
              <h1>
                {restaurantContext?.name || 'Restaurant Menu'}
              </h1>
              <p>Choose from our delicious selection</p>
            </div>
          </div>
        </div>
        
        {/* Category Navigation */}
        <div ref={categoryFilterRef} className="category-navigation">
          <button 
            className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Items
          </button>
          {categories?.map((category) => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.name ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.name)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Content */}
      <div className="menu-content">
        {/* Category Name */}
        {selectedCategory !== 'all' && (
          <h2 className="category-title">
            {selectedCategory}
          </h2>
        )}
        
        {/* Items List */}
        <div className="menu-items-list">
          {currentCategoryItems.map((item) => {
            const TemplateComponent = activeTemplate === 'Classic Elegant' ? ClassicElegantItem : ModernMinimalistItem;
            
            const itemData = {
              ...item,
              name: item.name || item.item_data?.name || 'Unnamed Item',
              price: item.price || item.item_data?.variations?.[0]?.item_variation_data?.price_money?.amount || 0,
              description: item.description || item.item_data?.description,
              image: item.image || (item.item_data?.image_ids?.[0] ? imageMap[item.item_data.image_ids[0]]?.url : null)
            };
            
            return (
              <div 
                key={item.id}
                className="menu-item"
                onClick={() => handleItemClick(item)}
              >
                <TemplateComponent 
                  item={itemData}
                  formatCurrency={(amount, currency) => formatCurrency(amount, currency || restaurantContext?.currency || 'GBP')}
                  onItemClick={handleItemClick}
                  isAvailable={item.isAvailable}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* No items message */}
      {currentCategoryItems.length === 0 && (
        <div className="no-items p-8 text-center">
          <p className="text-gray-500">No items found in this category</p>
        </div>
      )}

      {/* Item Detail Modal */}
      {showItemModal && selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          isOpen={showItemModal}
          onClose={handleCloseModal}
          formatCurrency={formatCurrency}
          isItemInStock={isItemInStock}
        />
      )}

      <style jsx>{`
        .smart-menu {
          width: 100%;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: transparent;
          min-height: 100vh;
          color: #333;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          padding: 20px;
          background: white;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #2d3748;
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
          background: white;
        }

        .error-message {
          color: #e74c3c;
          font-size: 16px;
          margin-bottom: 20px;
        }

        .retry-button {
          background: #2d3748;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }

        .retry-button:hover {
          background: #1a202c;
        }

        .menu-header-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          width: 100%;
        }

        .menu-header {
          background: #ffffff;
          padding: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
        }

        .header-text h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 4px 0;
          line-height: 1.2;
        }

        .header-text p {
          color: #555555;
          font-size: 14px;
          margin: 0;
          font-weight: 400;
        }

        .restaurant-name {
          font-size: 18px;
          margin: 0;
          flex-grow: 1;
          text-align: center;
          padding: 0 40px;
        }

        .menu-toggle, .search-button {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #333;
          padding: 8px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .menu-toggle:hover, .search-button:hover {
          background-color: #f5f5f5;
        }

        /* Category Navigation */
        .category-navigation {
          display: flex;
          gap: 0;
          padding: 0;
          overflow-x: auto;
          background: styleConfig.colors?.background || '#ffffff';
          -webkit-overflow-scrolling: touch;
          min-height: 56px;
          width: 100%;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .category-navigation::-webkit-scrollbar {
          display: none;
        }

        .category-btn {
          background: transparent;
          border: none;
          padding: 16px 20px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          white-space: nowrap;
          transition: all 0.2s ease;
          color: #666;
          position: relative;
          border-bottom: 2px solid transparent;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .category-btn:hover {
          color: #000;
          background: rgba(0, 0, 0, 0.03);
        }

        .category-btn.active {
          color: #000;
          font-weight: 600;
          border-bottom-color: #000;
        }

        .delivery-info {
          color: #666;
          font-size: 13px;
          text-align: center;
          padding: 4px 0;
        }

        .menu-content {
          padding: 16px;
          width: 100%;
          margin: 180px auto 0;
          text-align: left;
        }

        .category-title {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 20px 0;
          padding: 0;
          text-align: left;
        }

        /* Menu Items List */
        .menu-items-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .menu-item {
          border-bottom: 1px solid #f0f0f0;
          padding: 20px 0;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .menu-item:hover {
          background-color: #fafafa;
        }

        .menu-item:last-child {
          border-bottom: none;
        }

        .item-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          width: 100%;
          text-align: left;
        }

        .item-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
          width: 100%;
          text-align: left;
        }

        .item-name {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          padding: 0;
          line-height: 1.3;
          text-align: left;
          width: 100%;
          display: block;
        }

        .item-description {
          font-size: 14px;
          color: #666;
          margin: 0;
          line-height: 1.4;
          text-align: left;
          width: 100%;
        }

        .item-price {
          color: #000;
          font-weight: 600;
          margin: 8px 0 0 0;
          padding: 0;
          text-align: left;
          width: 100%;
          display: block;
        }

        .item-image-container {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          background: #f8f8f8;
          flex-shrink: 0;
        }

        .item-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .no-image {
          width: 100%;
          height: 100%;
          background: #f0f0f0;
        }

        .add-button {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #333;
          color: white;
          border: none;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease;
        }

        .add-button:hover {
          background: #555;
        }

        .no-items {
          text-align: center;
          padding: 40px 20px;
          color: #999;
          font-size: 15px;
        }

        /* Larger screens */
        @media (min-width: 768px) {
          .menu-header {
            padding: 20px;
          }
          
          .menu-content {
            padding: 20px;
          }
          
          .item-image-container {
            width: 100px;
            height: 100px;
          }

          .add-button {
            width: 28px;
            height: 28px;
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
};

export default SmartMenu;