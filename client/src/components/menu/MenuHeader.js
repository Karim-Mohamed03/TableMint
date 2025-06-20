import React, { useState, useEffect, useRef } from 'react';

const MenuHeader = ({ restaurantContext, tableContext, selectedCategory, setSelectedCategory, categories }) => {
  const [showCategories, setShowCategories] = useState(false);
  const categoryFilterRef = useRef(null);

  // Show/hide categories based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // Show categories after scrolling 100px
      setShowCategories(scrollPosition > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to active category button
  useEffect(() => {
    if (showCategories && categoryFilterRef.current) {
      const activeButton = categoryFilterRef.current.querySelector('.category-btn.active');
      if (activeButton) {
        // Calculate the position to scroll to center the active button
        const containerWidth = categoryFilterRef.current.offsetWidth;
        const buttonLeft = activeButton.offsetLeft;
        const buttonWidth = activeButton.offsetWidth;
        const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
        
        categoryFilterRef.current.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        });
      }
    }
  }, [selectedCategory, showCategories]);

  const scrollToCategory = (categoryId) => {
    if (categoryId === 'all') {
      // Scroll to top for "All Items"
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setSelectedCategory('all');
      return;
    }

    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      // Calculate offset - use smaller offset when categories are visible
      const headerHeight = showCategories ? 140 : 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      setSelectedCategory(categoryId);
    }
  };

  return (
    <div className="menu-header-container">
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
      </div>
      
      <div 
        ref={categoryFilterRef}
        className={`category-filter ${showCategories ? 'visible' : 'hidden'}`}
      >
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
        .menu-header-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          
          
          transition: all 0.3s ease;
        }

        .menu-header {
          background: #ffffff;
          padding: 16px;
          
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
          transition: all 0.3s ease;
          transform: translateY(0);
          opacity: 1;
        }

        .category-filter.hidden {
          transform: translateY(-100%);
          opacity: 0;
          min-height: 0;
          max-height: 0;
          overflow: hidden;
        }

        .category-filter.visible {
          transform: translateY(0);
          opacity: 1;
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
          border-bottom: 3px solid transparent;
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
          
        }

        /* Ensure proper spacing on mobile */
        @media (max-width: 768px) {
          .menu-header h1 {
            font-size: 24px;
          }

          .menu-header p {
            font-size: 14px;
          }

          .category-btn {
            padding: 16px 20px;
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default MenuHeader;