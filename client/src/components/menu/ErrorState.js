import React from 'react';

const ErrorState = ({ error }) => {
  return (
    <div className="menu-categories">
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
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

        .error-container {
          text-align: center;
          padding: 40px 20px;
          font-family: 'Satoshi', sans-serif;
        }

        .error-message {
          color: #e74c3c;
          font-size: 16px;
          margin-bottom: 20px;
          font-family: 'Satoshi', sans-serif;
          font-weight: 400;
        }

        .retry-button {
          background: #00ccbc;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Satoshi', sans-serif;
        }

        .retry-button:hover {
          background: #00a693;
        }
      `}</style>
    </div>
  );
};

export default ErrorState;