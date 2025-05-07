import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TablePage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch orders when component mounts
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Using the proxy configuration from package.json
      const response = await axios.get('/orders');
      setOrders(response.data.orders || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    if (!amount || !amount.amount || !amount.currency) return 'N/A';
    
    const value = parseInt(amount.amount) / 100; // Convert cents to dollars
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: amount.currency
    }).format(value);
  };

  if (loading) return <div className="loading">Loading orders...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="table-page">
      <h1>Table Orders</h1>
      <button onClick={fetchOrders} className="refresh-btn">
        Refresh Orders
      </button>
      
      {orders.length === 0 ? (
        <div className="no-orders">No active orders found</div>
      ) : (
        <div className="orders-container">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h3>Order {order.id.slice(-6)}</h3>
                <span className="table-number">
                  {order.tableNumber ? `Table ${order.tableNumber}` : 'No Table Assigned'}
                </span>
              </div>
              
              <div className="order-details">
                <p>Created: {new Date(order.createdAt).toLocaleString()}</p>
                <p>Status: {order.state}</p>
                <p>Total: {formatCurrency(order.totalMoney)}</p>
              </div>
              
              {order.lineItems && order.lineItems.length > 0 && (
                <div className="line-items">
                  <h4>Items:</h4>
                  <ul>
                    {order.lineItems.map((item, index) => (
                      <li key={index}>
                        {item.quantity}x {item.name} - {formatCurrency(item.totalMoney)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TablePage;