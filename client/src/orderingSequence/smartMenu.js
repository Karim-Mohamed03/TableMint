import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

// Import the ItemDetailModal component from the new menu folder location
import ItemDetailModal from '../components/menu/ItemDetailModal';

// Smart Menu component - Menu display only, no cart functionality
const SmartMenu = () => {
  const [catalogData, setCatalogData] = useState(null);
  const [imageMap, setImageMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inventoryData, setInventoryData] = useState({});
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);

  const { restaurantId } = useParams();
  
  // Fetch menu data on component mount
  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      setError(null);
      
      // Get restaurant context for restaurant ID
      const storedRestaurantContext = sessionStorage.getItem('restaurant_context');
      let restaurantContext = null;
      
      try {
        if (storedRestaurantContext) {
          restaurantContext = JSON.parse(storedRestaurantContext);
        }
        
        const restaurantIdToUse = restaurantId || (restaurantContext?.id);
        
        if (!restaurantIdToUse) {
          throw new Error('Restaurant ID not found');
        }
        
        // Fetch published menu from the API
        const response = await axios.get(
          `http://localhost:8000/api/restaurants/${restaurantIdToUse}/published-menu/`
        );
        
        if (response.data.success && response.data.menu) {
          const { menu_data } = response.data.menu;
          
          // Set the menu data
          setCatalogData(menu_data);
          
          // Set the first category as selected by default if available
          if (menu_data.categories && menu_data.categories.length > 0) {
            setSelectedCategory(menu_data.categories[0].name);
          }
        } else {
          throw new Error(response.data.error || 'Failed to load menu');
        }
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError(err.response?.data?.error || 'Failed to load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMenu();
  }, [restaurantId]);

  // Get current category items
  const currentCategoryItems = React.useMemo(() => {
    if (!catalogData?.categories) return [];
    
    if (selectedCategory === 'all') {
      // Flatten all items from all categories
      return catalogData.categories.flatMap(category => category.items || []);
    }
    
    // Find the selected category and return its items
    const category = catalogData.categories.find(cat => cat.name === selectedCategory);
    return category?.items || [];
  }, [catalogData, selectedCategory]);

  // Format currency
  const formatCurrency = (amount, currency = 'GBP') => {
    if (amount === undefined || amount === null) return '';
    
    // If amount is a string, try to convert it to a number
    const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(amountNum)) return '';
    
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency
    }).format(amountNum);
  };

  // Check if item is in stock
  const isItemInStock = (itemId) => {
    const inventory = inventoryData[itemId];
    if (!inventory) return true;
    return inventory.quantity > 0 && inventory.state !== 'SOLD_OUT';
  };

  // Get style configuration with defaults
  const styleConfig = React.useMemo(() => {
    if (!catalogData?.style_config) {
      return {
        fonts: {
          body: { sizes: { mobile: 'text-sm', desktop: 'text-base' }, family: 'sans-serif' },
          price: 'font-sans',
          heading: { sizes: { mobile: 'text-xl', desktop: 'text-2xl' }, family: 'sans-serif', weight: 'medium' }
        },
        colors: {
          text: '#000000',
          price: '#000000',
          heading: '#000000',
          background: '#ffffff',
          description: '#666666'
        },
        spacing: {
          itemSpacing: 'mb-8',
          sectionSpacing: 'mb-12'
        }
      };
    }
    return catalogData.style_config;
  }, [catalogData]);

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

  return (
    <div className="smart-menu">
      {/* Header */}
      <div className="menu-header">
        <div className="header-content">
          <button className="menu-toggle">☰</button>
          <h1 className="restaurant-name">
            {catalogData?.restaurant_name || 'Restaurant Menu'}
          </h1>
          <div className="header-actions">
            <button className="search-button">🔍</button>
          </div>
        </div>
        <div className="delivery-info">
          {catalogData?.delivery_info || 'Open Now • Delivery • Pickup'}
        </div>
      </div>

      {/* Category Filter - Horizontal Scrollable */}
      <div className="category-scroll-container">
        <div className="category-scroll">
          {catalogData?.categories?.map((category) => (
            <button
              key={category.name}
              className={`category-tab ${
                selectedCategory === category.name ? 'active' : ''
              }`}
              onClick={() => setSelectedCategory(category.name)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Content */}
      <div className="menu-content" style={{ backgroundColor: styleConfig.colors?.background || '#ffffff' }}>
        {/* Category Name */}
        {selectedCategory !== 'all' && (
          <h2 
            className="category-title"
            style={{ 
              color: styleConfig.colors?.heading || '#000000',
              fontFamily: styleConfig.fonts?.heading?.family || 'sans-serif',
              fontWeight: styleConfig.fonts?.heading?.weight || '600'
            }}
          >
            {selectedCategory}
          </h2>
        )}
        
        {/* Items Grid */}
        <div className="menu-grid">
          {currentCategoryItems.map((item, index) => (
            <div 
              key={index}
              className="menu-item"
              onClick={() => handleItemClick(item)}
            >
              <div className="item-content">
                {item.image && (
                  <div className="item-image-container">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="item-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.classList.add('hidden');
                      }}
                    />
                  </div>
                )}
                <div className="item-details">
                  <div className="item-header">
                    <h3 
                      className="item-name"
                      style={{ color: styleConfig.colors?.heading || '#000000' }}
                    >
                      {item.name}
                    </h3>
                    {item.price && (
                      <span 
                        className="item-price"
                        style={{ color: styleConfig.colors?.price || '#000000' }}
                      >
                        {formatCurrency(item.price, catalogData.currency || 'GBP')}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p 
                      className="item-description"
                      style={{ color: styleConfig.colors?.description || '#666666' }}
                    >
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
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
          max-width: 100%;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
          min-height: 100vh;
          color: #333;
        }

        .item-content {
          display: flex;
          flex-direction: column;
          height: 100%;
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

        .menu-header {
          background: #ffffff;
          padding: 16px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          border-bottom: 1px solid #f0f0f0;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          margin-bottom: 8px;
        }

        .restaurant-name {
          font-size: 18px;
          font-weight: 600;
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

        .delivery-info {
          color: #666;
          font-size: 13px;
          text-align: center;
          padding: 4px 0;
        }

        /* Category Scroll */
        .category-scroll-container {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          background: white;
          border-bottom: 1px solid #f0f0f0;
          padding: 12px 0;
        }

        .category-scroll {
          display: flex;
          gap: 12px;
          padding: 0 16px;
          width: max-content;
        }

        .category-tab {
          padding: 8px 16px;
          border: 1px solid #e0e0e0;
          border-radius: 20px;
          background: #f8f8f8;
          color: #555;
          font-size: 14px;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .category-tab.active {
          background: #333;
          color: white;
          border-color: #333;
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
        }

        .category-btn:hover {
          background: #f7fafc;
        }

        .category-btn.active {
          background: #2d3748;
          color: white;
        }

        .item-details {
          padding: 16px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .item-name {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          flex: 1;
        }

        .item-price {
          font-size: 16px;
          font-weight: 600;
          margin-left: 12px;
          white-space: nowrap;
        }

        .item-description {
          font-size: 14px;
          color: #666;
          margin: 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-image-container {
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 Aspect Ratio */
          overflow: hidden;
          background: #f8f8f8;
        }

        .item-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .no-items {
          text-align: center;
          padding: 40px 20px;
          color: #999;
          font-size: 15px;
        }

        /* Larger screens */
        @media (min-width: 768px) {
          .smart-menu {
            max-width: 480px;
            margin: 0 auto;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          }
          
          .menu-header {
            padding: 20px;
          }
          
          .category-filter {
            padding: 20px;
          }
          
          .menu-items-container {
            padding: 0 20px 20px;
          }
          
          .item-image-container {
            width: 100px;
            height: 100px;
          }
        }
      `}</style>
    </div>
  );
};

export default SmartMenu;