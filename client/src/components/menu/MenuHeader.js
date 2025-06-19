import React from 'react';

const MenuHeader = ({ restaurantContext, tableContext }) => {
  return (
    <div className="menu-header">
      <div className="header-content">
        <div className="header-text">
          <h1>{restaurantContext?.name || 'Menu'}</h1>
          <p>
            {tableContext ? `Table ${tableContext.label} • ` : ''}
            Choose from our delicious selection
          </p>
        </div>
      </div>
      
      <style jsx>{`
        .menu-header {
          background: #ffffff;
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
          position: sticky;
          top: 0;
          z-index: 100;
          font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .menu-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #000000;
          margin: 0;
          font-family: 'Satoshi', sans-serif;
        }

        .menu-header p {
          color: #555555;
          font-size: 16px;
          margin: 0;
          font-family: 'Satoshi', sans-serif;
          font-weight: 400;
        }
      `}</style>
    </div>
  );
};

export default MenuHeader;