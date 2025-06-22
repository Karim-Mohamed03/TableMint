import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Cart action types
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  APPLY_PROMO: 'APPLY_PROMO',
  REMOVE_PROMO: 'REMOVE_PROMO',
  LOAD_FROM_STORAGE: 'LOAD_FROM_STORAGE'
};

// sessionStorage key
const CART_STORAGE_KEY = 'tablemint_cart';

// Helper functions for sessionStorage
const saveToStorage = (state) => {
  try {
    console.group('💾 Saving cart to sessionStorage');
    console.log('Cart state being saved:', state);
    console.log('Total items:', state.items.length);
    console.log('Item count:', state.items.reduce((count, item) => count + item.quantity, 0));
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    console.log('✅ Successfully saved to sessionStorage');
    console.groupEnd();
  } catch (error) {
    console.warn('❌ Failed to save cart to sessionStorage:', error);
  }
};

const loadFromStorage = () => {
  try {
    console.group('📥 Loading cart from sessionStorage');
    const stored = sessionStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('✅ Found saved cart:', parsed);
      console.log('Items loaded:', parsed.items.length);
      console.log('Total quantity:', parsed.items.reduce((count, item) => count + item.quantity, 0));
      console.groupEnd();
      return parsed;
    } else {
      console.log('📭 No saved cart found in sessionStorage');
      console.groupEnd();
      return null;
    }
  } catch (error) {
    console.warn('❌ Failed to load cart from sessionStorage:', error);
    console.groupEnd();
    return null;
  }
};

// Format currency for display
const formatCurrency = (amount, currency = 'GBP') => {
  if (!amount && amount !== 0) return '£0.00';
  
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  });
  
  return formatter.format(amount / 100);
};

// Cart reducer
const cartReducer = (state, action) => {
  console.group(`🔄 Cart Action: ${action.type}`);
  console.log('Previous state:', state);
  console.log('Action payload:', action.payload);
  
  let newState;
  
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const { item } = action.payload;
      const existingItemIndex = state.items.findIndex(cartItem => cartItem.id === item.id);
      
      if (existingItemIndex >= 0) {
        // Item already exists, increase quantity
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        newState = { ...state, items: updatedItems };
        console.log(`➕ Increased quantity for "${item.name}" to ${updatedItems[existingItemIndex].quantity}`);
      } else {
        // New item, add to cart
        newState = {
          ...state,
          items: [...state.items, { ...item, quantity: 1 }]
        };
        console.log(`🆕 Added new item "${item.name}" to cart`);
      }
      break;
    }
    
    case CART_ACTIONS.REMOVE_ITEM: {
      const { id } = action.payload;
      const removedItem = state.items.find(item => item.id === id);
      newState = {
        ...state,
        items: state.items.filter(item => item.id !== id)
      };
      console.log(`🗑️ Removed item "${removedItem?.name || id}" from cart`);
      break;
    }
    
    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { id, quantity } = action.payload;
      const item = state.items.find(item => item.id === id);
      
      if (quantity <= 0) {
        newState = {
          ...state,
          items: state.items.filter(item => item.id !== id)
        };
        console.log(`🗑️ Removed item "${item?.name || id}" (quantity set to 0)`);
      } else {
        const updatedItems = state.items.map(item =>
          item.id === id ? { ...item, quantity } : item
        );
        newState = { ...state, items: updatedItems };
        console.log(`🔢 Updated quantity for "${item?.name || id}" to ${quantity}`);
      }
      break;
    }
    
    case CART_ACTIONS.CLEAR_CART: {
      newState = {
        ...state,
        items: [],
        promoCode: null,
        promoDiscount: 0
      };
      console.log('🧹 Cleared entire cart');
      break;
    }
    
    case CART_ACTIONS.APPLY_PROMO: {
      const { code, discount } = action.payload;
      newState = {
        ...state,
        promoCode: code,
        promoDiscount: discount
      };
      console.log(`🎟️ Applied promo code "${code}" with ${discount}% discount`);
      break;
    }
    
    case CART_ACTIONS.REMOVE_PROMO: {
      newState = {
        ...state,
        promoCode: null,
        promoDiscount: 0
      };
      console.log('🚫 Removed promo code');
      break;
    }
    
    case CART_ACTIONS.LOAD_FROM_STORAGE: {
      newState = action.payload || state;
      console.log('📥 Loaded cart from sessionStorage');
      break;
    }
    
    default:
      console.log('❓ Unknown action type');
      newState = state;
  }
  
  console.log('New state:', newState);
  console.log(`Total items: ${newState.items.reduce((count, item) => count + item.quantity, 0)}`);
  console.groupEnd();
  
  return newState;
};

// Initial cart state
const initialState = {
  items: [],
  promoCode: null,
  promoDiscount: 0
};

// Create cart context
const CartContext = createContext();

// Cart provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
  // Load cart from sessionStorage on mount
  useEffect(() => {
    console.log('🚀 CartProvider mounted, checking for saved cart...');
    const savedCart = loadFromStorage();
    if (savedCart) {
      dispatch({ type: CART_ACTIONS.LOAD_FROM_STORAGE, payload: savedCart });
    } else {
      console.log('📭 Starting with empty cart');
    }
  }, []);
  
  // Save to sessionStorage whenever cart state changes
  useEffect(() => {
    // Skip saving on initial load to avoid overwriting with empty cart
    if (state.items.length > 0 || state.promoCode) {
      saveToStorage(state);
    }
  }, [state]);
  
  // Helper functions
  const addItem = (item) => {
    dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: { item } });
  };
  
  const removeItem = (id) => {
    dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: { id } });
  };
  
  const updateQuantity = (id, quantity) => {
    dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { id, quantity } });
  };
  
  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };
  
  const applyPromo = (code, discount) => {
    dispatch({ type: CART_ACTIONS.APPLY_PROMO, payload: { code, discount } });
  };
  
  const removePromo = () => {
    dispatch({ type: CART_ACTIONS.REMOVE_PROMO });
  };
  
  // Calculate totals
  const subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const promoDiscountAmount = Math.round(subtotal * (state.promoDiscount / 100));
  const discountedSubtotal = subtotal - promoDiscountAmount;
  
  // Constants for restaurant (no delivery, 2% tax)
  const taxRate = 0.02; // 2% tax
  const tax = Math.round(discountedSubtotal * taxRate);
  const total = discountedSubtotal + tax;
  
  // Get cart item count
  const getItemCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };
  
  // Check if item is in cart
  const isInCart = (id) => {
    return state.items.some(item => item.id === id);
  };
  
  // Get item quantity in cart
  const getItemQuantity = (id) => {
    const item = state.items.find(item => item.id === id);
    return item ? item.quantity : 0;
  };
  
  const value = {
    // State
    items: state.items,
    promoCode: state.promoCode,
    promoDiscount: state.promoDiscount,
    
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyPromo,
    removePromo,
    
    // Computed values
    subtotal,
    promoDiscountAmount,
    discountedSubtotal,
    tax,
    total,
    
    // Helper functions
    getItemCount,
    isInCart,
    getItemQuantity,
    formatCurrency
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;