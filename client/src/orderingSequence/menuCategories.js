import React, { useState, useEffect } from 'react';

// Function to fetch catalog data from the backend API
const getCatalogData = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/pos/catalog/', {
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

// Main MenuCategories component
const MenuCategories = () => {
  const [catalogData, setCatalogData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch catalog data on component mount
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      setError(null);
      
      const response = await getCatalogData();
      
      if (response && response.success) {
        setCatalogData(response.objects);
      } else {
        setError('Failed to load menu items');
      }
      
      setLoading(false);
    };

    fetchCatalog();
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
        <h1>Menu</h1>
        <p>Choose from our delicious selection</p>
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

          return (
            <div key={item.id} className="menu-item-card">
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
              
              <button className="add-to-order-btn">
                Add to Order
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
export { getCatalogData };