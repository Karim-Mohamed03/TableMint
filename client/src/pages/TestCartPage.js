import React, { useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import CartPage from './CartPage';

const TestCartPage = () => {
  const { addItem, items } = useCart();

  useEffect(() => {
    // Add a test item to the cart if it's empty
    if (items.length === 0) {
      const testItem = {
        id: 'test-item-1',
        name: 'Test Pizza',
        price: 12.99,
        currency: 'GBP'
      };
      addItem(testItem);
    }
  }, [addItem, items.length]);

  return <CartPage />;
};

export default TestCartPage;
