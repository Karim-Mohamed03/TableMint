import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate, useParams } from 'react-router-dom';
import CartConfirmationModal from '../components/CartConfirmationModal';

// Import the new components from the menu folder
import MenuHeader from '../components/menu/MenuHeader';
import MenuItemsGrid from '../components/menu/MenuItemsGrid';
import BottomCartButton from '../components/menu/BottomCartButton';
import LoadingState from '../components/menu/LoadingState';
import ErrorState from '../components/menu/ErrorState';
import ItemDetailModal from '../components/menu/ItemDetailModal';

// Helper functions for catalog and inventory data
const getCatalogData = async (locationId = null, menuId = null) => {
  try {
    const url = new URL('http://localhost:8000/api/pos/catalog/');
    if (locationId) url.searchParams.append('location_id', locationId);
    if (menuId) url.searchParams.append('menu_id', menuId);
    
    const response = await fetch(url.toString(), { method: 'GET' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    if (data.success) {
      const processedData = processCatalogWithImages(data.objects);
      return { ...data, objects: processedData.objects, imageMap: processedData.imageMap };
    } else {
      console.error('Failed to fetch catalog:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Error calling get_catalog:', error);
    return null;
  }
};

const processCatalogWithImages = (catalogObjects) => {
  const images = catalogObjects.filter(obj => obj.type === 'IMAGE');
  const items = catalogObjects.filter(obj => obj.type === 'ITEM');
  const categories = catalogObjects.filter(obj => obj.type === 'CATEGORY');
  const otherObjects = catalogObjects.filter(obj => !['IMAGE', 'ITEM', 'CATEGORY'].includes(obj.type));
  
  const imageMap = {};
  images.forEach(imageObj => {
    if (imageObj.image_data?.url) {
      imageMap[imageObj.id] = {
        url: imageObj.image_data.url,
        name: imageObj.image_data.name,
        caption: imageObj.image_data.caption
      };
    }
  });

  const itemsWithImages = items.map(item => {
    const itemData = { ...item };
    if (item.item_data?.image_ids?.length > 0) {
      const itemImages = item.item_data.image_ids
        .map(imageId => imageMap[imageId])
        .filter(image => image);
      
      if (itemImages.length > 0) {
        itemData.item_data = {
          ...item.item_data,
          images: itemImages,
          primaryImage: itemImages[0]
        };
      }
    }
    return itemData;
  });

  return {
    objects: [...itemsWithImages, ...categories, ...otherObjects],
    imageMap: imageMap
  };
};

const getItemInventory = async (catalogObjectId, locationId = null) => {
  try {
    const url = new URL('http://localhost:8000/api/orders/inventory/');
    url.searchParams.append('catalog_object_id', catalogObjectId);
    if (locationId) url.searchParams.append('location_ids', locationId);

    const response = await fetch(url.toString(), { method: 'GET' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    
    if (data.hasOwnProperty('errors') && data.hasOwnProperty('counts')) {
      if (data.errors?.length > 0) {
        return { success: false, errors: data.errors, counts: [] };
      }
      return { success: true, errors: [], counts: data.counts };
    } else if (data.success) {
      return data;
    }
    return { success: false, errors: [data.error || 'Unknown error'], counts: [] };
  } catch (error) {
    console.error('Error in getItemInventory:', error);
    return { success: false, errors: [error.message], counts: [] };
  }
};

const getInventoryData = async (itemVariationMap, locationId = null) => {
  try {
    const inventoryPromises = itemVariationMap.map(mapping => 
      getItemInventory(mapping.variationId, locationId)
    );
    
    const inventoryResults = await Promise.all(inventoryPromises);
    const counts = [];

    inventoryResults.forEach((result, index) => {
      const mapping = itemVariationMap[index];
      if (result?.success && result.counts?.length > 0) {
        counts.push({
          catalog_object_id: result.counts[0].catalog_object_id,
          quantity: result.counts[0].quantity || '0',
          state: result.counts[0].state || 'IN_STOCK',
          location_id: result.counts[0].location_id
        });
      } else {
        counts.push({
          catalog_object_id: mapping.variationId,
          quantity: '1',
          state: 'IN_STOCK',
          location_id: locationId
        });
      }
    });

    return { success: true, counts };
  } catch (error) {
    console.error('Error in getInventoryData:', error);
    return { success: false, counts: [] };
  }
};

// Helper function to fetch available locations
const getLocations = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/pos/locations/', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
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

// Helper function for location availability
const isItemAvailableAtLocation = (item, locationId) => {
  if (!locationId) return true;

  if (item.present_at_all_locations) return true;

  if (item.present_at_location_ids?.includes(locationId)) return true;

  const variations = item.item_data?.variations || [];
  for (const variation of variations) {
    if (variation.present_at_all_locations) return true;
    if (variation.present_at_location_ids?.includes(locationId)) return true;
  }

  return false;
};

// Helper function for sold out status
const isItemSoldOutAtLocation = (item, locationId) => {
  if (!locationId) return false;

  const variations = item.item_data?.variations || [];
  for (const variation of variations) {
    const locationOverrides = variation.item_variation_data?.location_overrides || [];
    const locationOverride = locationOverrides.find(override => override.location_id === locationId);
    if (locationOverride?.sold_out === true) return true;
  }
  return false;
};

// Main MenuCategories component
const MenuCategories = () => {
  const navigate = useNavigate();
  const { locationId } = useParams();
  const { addItem, getItemCount, getItemQuantity, updateQuantity, removeItem, clearCart } = useCart();
  
  // State for menu data
  const [catalogData, setCatalogData] = useState(null);
  const [imageMap, setImageMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inventoryData, setInventoryData] = useState({});
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for restaurant and table context
  const [tableContext, setTableContext] = useState(null);
  const [restaurantContext, setRestaurantContext] = useState(null);
  const [effectiveLocationId, setEffectiveLocationId] = useState(null);

  // New state for item detail modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);

  // State for dynamic header height
  const [showCategories, setShowCategories] = useState(false);

  // Track scroll position to adjust padding
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowCategories(scrollPosition > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll spy functionality to update active category
  useEffect(() => {
    const handleScroll = () => {
      const categoryElements = document.querySelectorAll('[id^="category-"]');
      const scrollPosition = window.scrollY + 150; // Offset for sticky header
      
      let currentCategory = 'all';
      
      categoryElements.forEach((element) => {
        const elementTop = element.offsetTop;
        const elementBottom = elementTop + element.offsetHeight;
        
        if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
          currentCategory = element.id.replace('category-', '');
        }
      });
      
      if (currentCategory !== selectedCategory) {
        setSelectedCategory(currentCategory);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedCategory]);

  // Load context from sessionStorage and URL parameters
  useEffect(() => {
    // Get table context from sessionStorage
    const storedTableContext = sessionStorage.getItem('table_context');
    if (storedTableContext) {
      try {
        const tableData = JSON.parse(storedTableContext);
        setTableContext(tableData);
      } catch (e) {
        console.error('Failed to parse table context:', e);
      }
    }

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

    // Determine effective location ID from multiple sources
    const urlParams = new URLSearchParams(window.location.search);
    const urlLocationId = urlParams.get('location_id');
    const urlRestaurantId = urlParams.get('restaurant_id');
    
    // Priority order: URL param > restaurant context > URL param from path
    let finalLocationId = urlLocationId || 
                          (storedRestaurantContext ? JSON.parse(storedRestaurantContext).location_id : null) || 
                          locationId;
    
    setEffectiveLocationId(finalLocationId);
  }, [locationId]);

// Fetch catalog data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      // Use restaurant-specific location ID if available
      const locationIdToUse = effectiveLocationId || restaurantContext?.location_id;
      
      // Get active menu ID from restaurant context or URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const urlMenuId = urlParams.get('menu_id');
      const menuIdToUse = urlMenuId || restaurantContext?.active_menu;
      
      // Fetch catalog data with location_id and menu_id
      const catalogResponse = await getCatalogData(locationIdToUse, menuIdToUse);
      
      if (catalogResponse && catalogResponse.success) {
        setCatalogData(catalogResponse.objects);
        
        // Set image map if available
        if (catalogResponse.imageMap) {
          setImageMap(catalogResponse.imageMap);
        }
        
        // Extract item variation IDs for inventory check, but keep mapping to item IDs
        const items = catalogResponse.objects.filter(obj => obj.type === 'ITEM');
        
        const itemVariationMap = []; // Array of {itemId, variationId} objects
        
        items.forEach((item) => {
          if (item.item_data?.variations && item.item_data.variations.length > 0) {
            // Use the first variation (most common case)
            const variation = item.item_data.variations[0];
            itemVariationMap.push({
              itemId: item.id,
              variationId: variation.id
            });
          }
        });
        
        if (itemVariationMap.length > 0) {
          setInventoryLoading(true);
          
          // Pass the location_id to the inventory fetch
          const inventoryResponse = await getInventoryData(itemVariationMap, locationIdToUse);
          
          if (inventoryResponse && inventoryResponse.success) {
            // Convert inventory array to object for easier lookup
            // Map variation inventory back to item IDs for UI consistency
            const inventoryMap = {};
            inventoryResponse.counts.forEach((count) => {
              // Find the item ID that corresponds to this variation ID
              const itemVariation = itemVariationMap.find(mapping => mapping.variationId === count.catalog_object_id);
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
          setInventoryLoading(false);
        }
      } else {
        setError('Failed to load menu items');
      }
      
      setLoading(false);
    };

    // Only fetch data when we have an effective location ID or when restaurant context is loaded
    if (effectiveLocationId !== null || restaurantContext) {
      fetchData();
    }
  }, [effectiveLocationId, restaurantContext]); // Add dependencies for restaurant-specific data

  // Handle adding item to cart
  const handleAddToCart = (item) => {
    const itemData = item.item_data;
    const variation = itemData?.variations?.[0];
    const price = variation?.item_variation_data?.price_money;
    
    const cartItem = {
      id: variation?.id || item.id, // Use variation ID for Square API compatibility
      name: itemData?.name || 'Unknown Item',
      description: itemData?.description,
      price: price?.amount, // Convert cents to dollars
      currency: price?.currency || 'USD',
      item_data: {
        ...itemData,
        primaryImage: itemData.primaryImage
      }
    };
    
    addItem(cartItem);
  };

  // Handle incrementing item quantity
  const handleIncrement = (item) => {
    const itemData = item.item_data;
    const variation = itemData?.variations?.[0];
    const itemId = variation?.id || item.id;
    
    const currentQuantity = getItemQuantity(itemId);
    if (currentQuantity === 0) {
      // Item not in cart, add it
      handleAddToCart(item);
    } else {
      // Item already in cart, increment quantity
      updateQuantity(itemId, currentQuantity + 1);
    }
  };

  // Handle decrementing item quantity
  const handleDecrement = (item) => {
    const itemData = item.item_data;
    const variation = itemData?.variations?.[0];
    const itemId = variation?.id || item.id;
    
    const currentQuantity = getItemQuantity(itemId);
    if (currentQuantity > 1) {
      updateQuantity(itemId, currentQuantity - 1);
    } else if (currentQuantity === 1) {
      removeItem(itemId);
    }
  };

  // Navigate to cart
  const goToCart = () => {
    setIsModalOpen(true);
  };

  // Modal handlers
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirmOrder = async () => {
    try {
      // Step 1: Retrieve cart from sessionStorage using the correct key
      const cartData = sessionStorage.getItem("tablemint_cart");
      
      // Step 2: Check if cart exists and is not empty
      if (!cartData) {
        alert("Your cart is empty. Please add items before confirming your order.");
        setIsModalOpen(false);
        return;
      }

      // Step 3: Parse the cart data
      let parsedCart;
      try {
        parsedCart = JSON.parse(cartData);
      } catch (parseError) {
        console.error("Error parsing cart data:", parseError);
        alert("There was an error reading your cart. Please try again.");
        setIsModalOpen(false);
        return;
      }

      // Step 4: Check if parsed cart has items
      if (!parsedCart || !parsedCart.items || parsedCart.items.length === 0) {
        alert("Your cart is empty. Please add items before confirming your order.");
        setIsModalOpen(false);
        return;
      }

      // Step 5: Create line items for the order
      const lineItems = parsedCart.items.map(item => ({
        catalog_object_id: item.id, // Square expects catalog_object_id
        quantity: item.quantity.toString(), // Convert to string as required by Square API
        base_price_money: { // Square expects base_price_money object
          amount: Math.round(item.price * 100), // Convert to cents
          currency: item.currency || 'GBP'
        }
      }));

      // Validate that all items have valid catalog_object_ids
      const invalidItems = lineItems.filter(item => 
        !item.catalog_object_id || 
        item.catalog_object_id.length < 10 || // Square IDs are typically much longer
        item.catalog_object_id.includes('test') // Filter out test items
      );

      if (invalidItems.length > 0) {
        console.error("Invalid catalog items found:", invalidItems);
        alert("Some items in your cart are invalid or from test data. Please add items from the menu instead.");
        setIsModalOpen(false);
        return;
      }

      // Step 6: Get restaurant context from session storage
      let restaurantId = null;
      let tableToken = null;
      let location_id = null;

      // Try to get restaurant context
      const storedRestaurantContext = sessionStorage.getItem('restaurant_context');
      if (storedRestaurantContext) {
        try {
          const restaurantData = JSON.parse(storedRestaurantContext);
          restaurantId = restaurantData.id;
          location_id = restaurantData.location_id;
        } catch (e) {
          console.error('Failed to parse restaurant context:', e);
        }
      }

      // Try to get table context
      const storedTableContext = sessionStorage.getItem('table_context');
      if (storedTableContext) {
        try {
          const tableData = JSON.parse(storedTableContext);
          tableToken = tableData.token;
          // If we don't have restaurant_id from restaurant context, try to get it from table context
          if (!restaurantId && tableData.restaurant_id) {
            restaurantId = tableData.restaurant_id;
          }
        } catch (e) {
          console.error('Failed to parse table context:', e);
        }
      }

      // Validate that we have restaurant context
      if (!restaurantId && !tableToken) {
        console.error("No restaurant context found in session storage");
        alert("Restaurant context is missing. Please scan the QR code again or refresh the page.");
        setIsModalOpen(false);
        return;
      }

      // Step 7: Prepare order data for creation (now including restaurant context)
      const orderData = {
        line_items: lineItems,
        idempotency_key: `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Unique key to prevent duplicates
        // Include restaurant context - backend requires either restaurant_id or table_token
        restaurant_id: restaurantId,
        table_token: tableToken,
        location_id: location_id, // Use effective location ID if available
      };
      
      // Step 8: Create the order via API call
      const response = await fetch('http://localhost:8000/api/orders/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        // Store the created order ID for later use in payment
        const orderId = responseData.order?.id;
        if (orderId) {
          sessionStorage.setItem("current_order_id", orderId);
        }

        // Also store order data for potential external payment creation later
        sessionStorage.setItem("pending_square_order", JSON.stringify(orderData));
        
        // Clear the cart since order has been created
        clearCart(); // This will clear both React context and sessionStorage
        
        // Close modal and redirect to cart page with order ID
        setIsModalOpen(false);
        
        // Navigate to cart page with the order ID
        if (orderId) {
          navigate(`/cart?order_id=${orderId}`);
        } else {
          navigate('/cart');
        }

      } else {
        alert(`Failed to create order: ${responseData.error || 'Unknown error'}`);
        setIsModalOpen(false);
      }

    } catch (error) {
      console.error("Error creating order:", error);
      alert("There was an error creating your order. Please try again.");
      setIsModalOpen(false);
    }
  };

  // Parse and organize catalog data
  const organizedData = React.useMemo(() => {
    if (!catalogData) return { categories: [], items: [] };

    const categories = catalogData.filter(obj => obj.type === 'CATEGORY');
    const items = catalogData.filter(obj => obj.type === 'ITEM');

    return { categories, items };
  }, [catalogData]);

  // Format currency using restaurant's currency preference
  const formatCurrency = (amount, currency = null) => {
    if (!amount) return '£0.00';
    
    // Use restaurant's currency if available, otherwise default
    const currencyToUse = currency || restaurantContext?.currency || 'GBP';
    
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currencyToUse
    }).format(amount / 100);
  };

  // Check if item is in stock
  const isItemInStock = (itemId) => {
    const inventory = inventoryData[itemId];
    if (!inventory) return true;
    
    return inventory.quantity > 0 && inventory.state !== 'SOLD_OUT';
  };

  // Get all items (no filtering by category anymore since we show all)
  const getAllItems = () => {
    let items = organizedData.items;
    
    if (effectiveLocationId) {
      items = items.filter(item => isItemAvailableAtLocation(item, effectiveLocationId));
    }
    
    return items;
  };

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} />;
  }

  // Handle item click for modal
  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleCloseItemModal = () => {
    setShowItemModal(false);
    setSelectedItem(null);
  };

  return (
    <div className="menu-categories">
      <MenuHeader 
        restaurantContext={restaurantContext} 
        tableContext={tableContext}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={organizedData.categories}
      />

      <div className="menu-content">
        <MenuItemsGrid 
          items={getAllItems()}
          categories={organizedData.categories}
          formatCurrency={formatCurrency}
          isItemInStock={isItemInStock}
          isItemSoldOutAtLocation={isItemSoldOutAtLocation}
          getItemQuantity={getItemQuantity}
          handleIncrement={handleIncrement}
          handleDecrement={handleDecrement}
          locationId={locationId}
          onItemClick={handleItemClick}
        />
      </div>

      <BottomCartButton 
        itemCount={getItemCount()}
        onCartClick={goToCart}
      />

      {/* Item Detail Modal */}
      <ItemDetailModal
        isOpen={showItemModal}
        onClose={handleCloseItemModal}
        item={selectedItem}
        formatCurrency={formatCurrency}
        isItemInStock={isItemInStock}
      />

      {console.log('Menu items being passed to CartConfirmationModal:', organizedData.items)}
      <CartConfirmationModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmOrder}
        menuItems={organizedData.items}
      />

      <style jsx>{`
        .menu-categories {
          max-width: 100%;
          margin: 0;
          padding: 0;
          font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #fff;
          min-height: 100vh;
          padding-bottom: 100px;
        }

        .menu-content {
          padding-top: ${showCategories ? '160px' : '100px'};
          transition: padding-top 0.3s ease;
        }
      `}</style>
    </div>
  );
};

// Export the component and utility functions
export default MenuCategories;
export { getCatalogData, getInventoryData, processCatalogWithImages };