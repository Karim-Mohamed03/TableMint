import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

// Import translation components and hooks
import { TranslationProvider, useTranslation } from '../contexts/TranslationContext';
import LanguageSelector from '../components/LanguageSelector';
import { useTranslatedText, TranslatedText } from '../hooks/useTranslatedText';

// Import menu template components
import ModernMinimalistItem from './menu-templates/ModernMinimalistItem';
import ClassicElegantItem from './menu-templates/ClassicElegantItem';

// Import the ItemDetailModal component from the new menu folder location
import ItemDetailModal from './menu-templates/modals/ItemDetailModal';

// Smart Menu component with translation functionality
const SmartMenuContent = () => {
  const [catalogData, setCatalogData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [restaurantContext, setRestaurantContext] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTemplate, setActiveTemplate] = useState('Modern Minimalist');
  const [translatedMenuData, setTranslatedMenuData] = useState(null);
  const categoryFilterRef = React.useRef(null);

  // Translation hooks
  const { currentLanguage, isRTL, translateTextDynamic } = useTranslation();

  // Translated static text
  const { translatedText: loadingText } = useTranslatedText('Loading menu...');
  const { translatedText: tryAgainText } = useTranslatedText('Try Again');
  const { translatedText: failedToLoadText } = useTranslatedText('Failed to load menu. Please try again.');
  const { translatedText: allItemsText } = useTranslatedText('All Items');
  const { translatedText: chooseFromSelectionText } = useTranslatedText('Choose from our delicious selection');
  const { translatedText: noItemsFoundText } = useTranslatedText('No items found in this category');

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
  }, []);

  // Add new function to fetch smart menu data
  const getSmartMenuData = async (restaurantId = null) => {
    try {
      if (!restaurantId) {
        console.error('Restaurant ID is required to fetch smart menu');
        return null;
      }

      const url = new URL(`https://tablemint.onrender.com/api/restaurants/${restaurantId}/published-menu/`);
      
      const response = await fetch(url.toString(), { method: 'GET' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success) {
        // Update restaurant context with the new data
        const updatedContext = {
          ...restaurantContext,
          ...data.restaurant_context
        };
        setRestaurantContext(updatedContext);
        sessionStorage.setItem('restaurant_context', JSON.stringify(updatedContext));
        
        return data.menu_data;
      } else {
        console.error('Failed to fetch smart menu:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Error fetching smart menu:', error);
      return null;
    }
  };

  // Function to translate menu data
  const translateMenuData = async (menuData, targetLanguage) => {
    if (targetLanguage === 'en' || !menuData) {
      return menuData;
    }

    try {
      const translatedData = {
        ...menuData,
        menu_name: await translateTextDynamic(menuData.menu_name || ''),
        categories: await Promise.all(
          menuData.categories.map(async (category) => ({
            ...category,
            name: await translateTextDynamic(category.name || ''),
            items: await Promise.all(
              category.items.map(async (item) => ({
                ...item,
                name: await translateTextDynamic(item.name || ''),
                description: await translateTextDynamic(item.description || '')
              }))
            )
          }))
        )
      };
      return translatedData;
    } catch (error) {
      console.error('Error translating menu data:', error);
      return menuData; // Fallback to original data
    }
  };

  // Translate menu data when language changes
  useEffect(() => {
    const translateMenu = async () => {
      if (catalogData) {
        const translated = await translateMenuData(catalogData, currentLanguage);
        setTranslatedMenuData(translated);
      }
    };

    translateMenu();
  }, [catalogData, currentLanguage]);

  // Modify the fetchData function in the useEffect
  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantContext?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Get restaurant ID from context
        const restaurantId = restaurantContext.id;
        
        // Fetch smart menu data
        const menuData = await getSmartMenuData(restaurantId);
        
        if (menuData) {
          console.log('Raw menu data:', menuData);
          
          // The menu data is already in the correct format, just set it directly
          setCatalogData(menuData);
          
          // Set active template from restaurant context
          if (restaurantContext.active_template) {
            setActiveTemplate(restaurantContext.active_template);
          }
        } else {
          throw new Error('Failed to load menu data');
        }
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError('Failed to load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [restaurantContext?.id]);

  // Update the useMemo hook for organizing data
  const { categories, items, categoriesWithItems } = useMemo(() => {
    const dataToUse = translatedMenuData || catalogData;
    if (!dataToUse) return { categories: [], items: [], categoriesWithItems: [] };
    
    // Categories are already in the correct format
    const allCategories = dataToUse.categories;
    
    // Flatten all items from categories
    const allItems = allCategories.reduce((acc, category) => {
      return [...acc, ...category.items];
    }, []);
    
    // Process items to include any additional data needed
    const processedItems = allItems.map(item => ({
      ...item,
      item_data: {
        name: item.name,
        description: item.description,
        price_money: {
          amount: item.price,
          currency: restaurantContext?.currency || 'GBP'
        },
        images: item.image ? [item.image] : [] // Use 'image' field, not 'media'
      }
    }));
    
    return {
      categories: allCategories,
      items: processedItems,
      categoriesWithItems: allCategories
    };
  }, [translatedMenuData, catalogData, restaurantContext?.currency]);

  // Format currency
  const formatCurrency = (amount, currency = 'GBP') => {
    if (amount === undefined || amount === null || amount === '') return '';
    
    // If amount is a string, try to convert it to a number
    const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(amountNum)) return '';
    
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency
    }).format(amountNum);
  };

  // Smooth scroll to category
  const scrollToCategory = (categoryName) => {
    if (!categoryName) return; // Return early if category name is undefined
    
    setActiveCategory(categoryName);
    
    if (categoryName === 'all') {
      // Scroll to top
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      // Scroll category navigation to the beginning
      scrollCategoryNavigation('all');
      return;
    }

    // Create category ID in a consistent way
    const categoryId = `category-${(categoryName || '').toLowerCase().replace(/\s+/g, '-')}`;
    
    // Find the category element and scroll to it
    const categoryElement = document.getElementById(categoryId);
    if (categoryElement) {
      const headerOffset = 180; // Account for fixed header
      const elementPosition = categoryElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Scroll the category navigation to show the active button
      scrollCategoryNavigation(categoryName);
    }
  };

  // Function to scroll the category navigation horizontally
  const scrollCategoryNavigation = (categoryName) => {
    if (!categoryFilterRef.current) return;

    const navigation = categoryFilterRef.current;
    const activeButton = navigation.querySelector(`button[data-category="${categoryName}"]`) || 
                        navigation.querySelector('.category-btn.active');
    
    if (activeButton) {
      const navRect = navigation.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      // Calculate the position to center the button
      const scrollLeft = activeButton.offsetLeft - (navRect.width / 2) + (buttonRect.width / 2);
      
      navigation.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Function to detect which category is currently in view
  const detectActiveCategory = () => {
    if (!categoriesWithItems.length) return;

    const headerOffset = 200; // Offset for fixed header
    const scrollPosition = window.scrollY + headerOffset;

    // Check if we're at the top of the page
    if (window.scrollY < 100) {
      if (activeCategory !== 'all') {
        setActiveCategory('all');
        scrollCategoryNavigation('all');
      }
      return;
    }

    // Find which category section is currently in view
    for (let i = 0; i < categoriesWithItems.length; i++) {
      const category = categoriesWithItems[i];
      if (!category?.name) continue; // Skip if category name is undefined
      
      const categoryName = category.name;
      const categoryId = `category-${(categoryName || '').toLowerCase().replace(/\s+/g, '-')}`;
      const categoryElement = document.getElementById(categoryId);
      
      if (categoryElement) {
        const categoryTop = categoryElement.offsetTop;
        const categoryHeight = categoryElement.offsetHeight;
        const categoryBottom = categoryTop + categoryHeight;
        
        // Check if this category is in view
        if (scrollPosition >= categoryTop && scrollPosition < categoryBottom) {
          if (activeCategory !== categoryName) {
            setActiveCategory(categoryName);
            scrollCategoryNavigation(categoryName);
          }
          return;
        }
      }
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      // Throttle scroll events for better performance
      if (window.scrollThrottleTimer) {
        clearTimeout(window.scrollThrottleTimer);
      }
      
      window.scrollThrottleTimer = setTimeout(() => {
        detectActiveCategory();
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    setTimeout(detectActiveCategory, 500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (window.scrollThrottleTimer) {
        clearTimeout(window.scrollThrottleTimer);
      }
    };
  }, [categoriesWithItems, activeCategory]);

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
          <p>{loadingText}</p>
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
            {tryAgainText}
          </button>
        </div>
      </div>
    );
  }

  const dataToDisplay = translatedMenuData || catalogData;

  return (
    <div className={`smart-menu ${isRTL() ? 'rtl' : 'ltr'}`} dir={isRTL() ? 'rtl' : 'ltr'}>
      {/* Menu Header */}
      <div className="menu-header-container">
        <div className="menu-header">
          <div className="header-content">
            <div className="header-text">
              <h1>
                {dataToDisplay?.menu_name || restaurantContext?.name || 'Restaurant Menu'}
              </h1>
              <p>
                <TranslatedText>
                  {chooseFromSelectionText}
                </TranslatedText>
              </p>
            </div>
            {/* Language Selector in header */}
            <div className="header-actions">
              <LanguageSelector />
            </div>
          </div>
        </div>
        
        {/* Category Navigation */}
        <div ref={categoryFilterRef} className="category-navigation">
          <button 
            className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
            data-category="all"
            onClick={() => scrollToCategory('all')}
          >
            <TranslatedText>{allItemsText}</TranslatedText>
          </button>
          {categoriesWithItems?.map((category) => {
            const categoryName = category.name;
            return (
              <button
                key={categoryName}
                className={`category-btn ${activeCategory === categoryName ? 'active' : ''}`}
                data-category={categoryName}
                onClick={() => scrollToCategory(categoryName)}
              >
                {categoryName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Content - All Categories */}
      <div className="menu-content">
        {categoriesWithItems?.map((category) => {
          const categoryName = category.name;
          const categoryId = `category-${(categoryName || '').toLowerCase().replace(/\s+/g, '-')}`;
          
          return (
            <div 
              key={categoryName} 
              id={categoryId}
              className="category-section"
            >
              <h2 className="category-title">
                {categoryName}
              </h2>
              
              <div className="menu-items-list">
                {(category?.items || []).map((item) => {
                  const TemplateComponent = activeTemplate === 'Classic Elegant' ? ClassicElegantItem : ModernMinimalistItem;
                  
                  const itemData = {
                    ...item,
                    name: item.name,
                    price: item.price,
                    description: item.description,
                    image: item.image || null
                  };
                  
                  return (
                    <div 
                      key={item.name}
                      className="menu-item"
                      onClick={() => handleItemClick(item)}
                    >
                      <TemplateComponent 
                        item={itemData}
                        formatCurrency={(amount) => formatCurrency(amount, restaurantContext?.currency || 'GBP')}
                        onItemClick={handleItemClick}
                        isAvailable={true}
                      />
                    </div>
                  );
                })}
              </div>

              {/* No items message for empty categories */}
              {(!category?.items || category.items.length === 0) && (
                <div className="no-items">
                  <p><TranslatedText>{noItemsFoundText}</TranslatedText></p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Item Detail Modal */}
      {showItemModal && selectedItem && (
        <ItemDetailModal
          item={{
            ...selectedItem,
            item_data: {
              name: selectedItem.name,
              description: selectedItem.description,
              price_money: {
                amount: selectedItem.price,
                currency: restaurantContext?.currency || 'GBP'
              },
              images: selectedItem.image ? [selectedItem.image] : [],
              primaryImage: selectedItem.image ? { url: selectedItem.image } : null
            }
          }}
          isOpen={showItemModal}
          onClose={handleCloseModal}
          formatCurrency={(amount) => formatCurrency(amount, restaurantContext?.currency || 'GBP')}
          isItemInStock={() => true}
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

        /* RTL Support */
        .smart-menu.rtl {
          direction: rtl;
        }

        .smart-menu.rtl .menu-header-container {
          text-align: right;
        }

        .smart-menu.rtl .category-navigation {
          flex-direction: row-reverse;
        }

        .smart-menu.rtl .category-btn {
          text-align: right;
        }

        .smart-menu.rtl .menu-content {
          text-align: right;
        }

        .smart-menu.rtl .category-title {
          text-align: right;
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

        .header-text {
          flex: 1;
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

        .header-actions {
          display: flex;
          align-items: flex-start;
          padding-top: 4px;
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
          background: #ffffff;
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

        .category-section {
          margin-bottom: 40px;
        }

        .category-section:last-child {
          margin-bottom: 20px;
        }

        .category-title {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 20px 0;
          padding: 0;
          text-align: left;
          scroll-margin-top: 200px; /* For smooth scroll positioning */
        }

        /* Menu Items List */
        .menu-items-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .menu-item {
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

// Main SmartMenu component with translation provider
const SmartMenu = () => {
  return (
    <TranslationProvider>
      <SmartMenuContent />
    </TranslationProvider>
  );
};

export default SmartMenu;