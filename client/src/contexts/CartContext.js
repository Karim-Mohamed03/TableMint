import React, { createContext, useContext, useReducer } from 'react';

// Cart action types
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  APPLY_PROMO: 'APPLY_PROMO',
  REMOVE_PROMO: 'REMOVE_PROMO'
};

// Cart reducer
const cartReducer = (state, action) => {
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
        return { ...state, items: updatedItems };
      } else {
        // New item, add to cart
        return {
          ...state,
          items: [...state.items, { ...item, quantity: 1 }]
        };
      }
    }
    
    case CART_ACTIONS.REMOVE_ITEM: {
      const { id } = action.payload;
      return {
        ...state,
        items: state.items.filter(item => item.id !== id)
      };
    }
    
    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== id)
        };
      }
      
      const updatedItems = state.items.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      return { ...state, items: updatedItems };
    }
    
    case CART_ACTIONS.CLEAR_CART: {
      return {
        ...state,
        items: [],
        promoCode: null,
        promoDiscount: 0
      };
    }
    
    case CART_ACTIONS.APPLY_PROMO: {
      const { code, discount } = action.payload;
      return {
        ...state,
        promoCode: code,
        promoDiscount: discount
      };
    }
    
    case CART_ACTIONS.REMOVE_PROMO: {
      return {
        ...state,
        promoCode: null,
        promoDiscount: 0
      };
    }
    
    default:
      return state;
  }
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
  const promoDiscountAmount = subtotal * (state.promoDiscount / 100);
  const discountedSubtotal = subtotal - promoDiscountAmount;
  
  // Constants for restaurant (no delivery, 2% tax)
  const taxRate = 0.02; // 2% tax
  const tax = discountedSubtotal * taxRate;
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
    getItemQuantity
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