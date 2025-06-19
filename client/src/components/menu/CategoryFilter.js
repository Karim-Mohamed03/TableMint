import React from 'react';

const CategoryFilter = ({ selectedCategory, setSelectedCategory, categories }) => {
  return (
    <div className="category-filter">
      <button 
        className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
        onClick={() => setSelectedCategory('all')}
      >
        All Items
      </button>
      {categories.map(category => (
        <button
          key={category.id}
          className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
          onClick={() => setSelectedCategory(category.id)}
        >
          {category.category_data?.name || 'Unknown Category'}
        </button>
      ))}
      
      <style jsx>{`
        .category-filter {
          display: flex;
          gap: 0;
          padding: 0;
          overflow-x: auto;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          -webkit-overflow-scrolling: touch;
          font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .category-filter::-webkit-scrollbar {
          display: none;
        }

        .category-btn {
          background: transparent;
          border: none;
          padding: 16px 24px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 400;
          white-space: nowrap;
          transition: all 0.2s ease;
          color: #a0aec0;
          position: relative;
          border-bottom: 2px solid transparent;
          font-family: 'Satoshi', sans-serif;
        }

        .category-btn:hover {
          color: #4a5568;
        }

        .category-btn.active {
          color: #2d3748;
          font-weight: 600;
          border-bottom-color: #2d3748;
        }
      `}</style>
    </div>
  );
};

export default CategoryFilter;