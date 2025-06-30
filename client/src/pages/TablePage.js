import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TablePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTableContext = async () => {
      console.log('=== TABLE PAGE DEBUG ===');
      console.log('Current URL:', window.location.href);
      console.log('Token from useParams:', token);
      console.log('Token type:', typeof token);
      console.log('Token length:', token?.length);
      
      if (!token) {
        console.log('❌ No token found - this means the URL pattern might not be matching');
        setError('Invalid QR code - no token provided');
        setLoading(false);
        return;
      }

      try {
        const apiUrl = `https://tablemint.onrender.com/api/tables/context/${token}/`;
        console.log('🚀 Making API call to:', apiUrl);
        
        // Fetch table and restaurant context from backend
        const response = await axios.get(apiUrl);
        
        console.log('✅ API Response received:', response.data);
        
        if (response.data.success) {
          const { table, restaurant } = response.data;
          
          console.log('Table context:', table);
          console.log('Restaurant context:', restaurant);
          
          // Store table context in sessionStorage for use throughout the app
          sessionStorage.setItem('table_context', JSON.stringify({
            token: table.token,
            label: table.label,
            restaurant_id: table.restaurant_id,
            active_subscription: table.active_subscription
          }));
          
          // Store restaurant context if available
          if (restaurant) {
            sessionStorage.setItem('restaurant_context', JSON.stringify({
              id: restaurant.id,
              name: restaurant.name,
              location_id: restaurant.location_id,
              active_menu: restaurant.active_menu,
              currency: restaurant.currency,
              timezone: restaurant.timezone,
              integration_name: restaurant.integration_name,
              access_token: restaurant.access_token, // Encrypted/handled securely on backend
              branding: restaurant.branding,
              active_template: restaurant.active_template
            }));
          }
          
          // Build redirect URL with query parameters
          const params = new URLSearchParams();
          params.append('table_token', table.token);
          params.append('table_label', table.label);
          
          if (restaurant) {
            params.append('restaurant_id', restaurant.id);
            if (restaurant.location_id) {
              params.append('location_id', restaurant.location_id);
            }
            if (restaurant.active_menu) {
              params.append('menu_id', restaurant.active_menu);
            }
          }
          
          // Determine the base route based on subscription type
          const baseRoute = table.active_subscription === 'smart_menu' ? '/smartMenu' : '/QROrderPay';
          const redirectUrl = `${baseRoute}?${params.toString()}`;
          console.log('Redirecting to:', redirectUrl);
          navigate(redirectUrl);
          
        } else {
          console.log('❌ API returned success: false');
          setError(response.data.error || 'Failed to load table information');
        }
      } catch (err) {
        console.error('❌ API call failed:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        
        if (err.response?.status === 404) {
          setError('Table not found - please check your QR code');
        } else {
          setError('Failed to load table information - please try again');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTableContext();
  }, [token, navigate]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <h2>Loading Table Information...</h2>
        <p>Please wait while we set up your dining experience.</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          padding: '20px',
          maxWidth: '400px'
        }}>
          <h2 style={{ color: '#c33', marginTop: 0 }}>Unable to Load Table</h2>
          <p style={{ color: '#666' }}>{error}</p>
          <button
            onClick={() => navigate('/QROrderPay')}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Continue to Menu
          </button>
        </div>
      </div>
    );
  }

  return null; // This should not render as we redirect immediately on success
};

export default TablePage;