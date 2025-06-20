import React from 'react';

const CategoryFilter = ({ selectedCategory, setSelectedCategory, categories }) => {
  const scrollToCategory = (categoryId) => {
    if (categoryId === 'all') {
      // Scroll to top for "All Items"
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setSelectedCategory('all');
      return;
    }

    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      // Calculate offset to account for the fixed category filter
      const categoryFilterHeight = 80; // Account for the fixed filter height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - categoryFilterHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      setSelectedCategory(categoryId);
    }
  };

  return (
    <div className="category-filter-container">
      <div className="category-filter">
        <button 
          className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => scrollToCategory('all')}
        >
          All Items
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => scrollToCategory(category.id)}
          >
            {category.category_data?.name || 'Unknown Category'}
          </button>
        ))}
      </div>
      
      <style jsx>{`
        .category-filter-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: #fff;
        }

        .category-filter {
          display: flex;
          gap: 0;
          padding: 0;
          overflow-x: auto;
          background: #fff;
          -webkit-overflow-scrolling: touch;
          font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          min-height: 64px;
          max-width: 100vw;
        }

        .category-filter::-webkit-scrollbar {
          display: none;
        }

        .category-btn {
          background: transparent;
          border: none;
          padding: 20px 24px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          white-space: nowrap;
          transition: all 0.3s ease;
          color: #718096;
          position: relative;
          border-bottom: 3px solid rgb(193, 193, 193);
          font-family: 'Satoshi', sans-serif;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .category-btn:hover {
          color: #2d3748;
          background: rgba(45, 55, 72, 0.05);
        }

        .category-btn.active {
          color: #2d3748;
          font-weight: 600;
          border-bottom-color: #2d3748;
          background: rgba(45, 55, 72, 0.08);
        }

        /* Ensure proper spacing on mobile */
        @media (max-width: 768px) {
          .category-btn {
            padding: 16px 20px;
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default CategoryFilter;