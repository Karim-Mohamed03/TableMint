import React from 'react';

const LoadingState = () => {
  return (
    <div className="menu-categories">
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading menu...</p>
      </div>
      
      <style jsx>{`
        .menu-categories {
          max-width: 100%;
          margin: 0;
          padding: 0;
          font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #fff;
          min-height: 100vh;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          padding: 20px;
          font-family: 'Satoshi', sans-serif;
        }

        .loading-container p {
          font-family: 'Satoshi', sans-serif;
          font-weight: 400;
          color: #718096;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #00ccbc;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingState;