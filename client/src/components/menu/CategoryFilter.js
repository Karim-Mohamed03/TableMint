import React, { useRef, useEffect } from 'react';
// import { useTranslation } from '../../contexts/TranslationContext';

const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  // const { currentLanguage } = useTranslation();
  const filterRef = useRef(null);

  // Scroll to active category button
  useEffect(() => {
    if (filterRef.current) {
      const activeButton = filterRef.current.querySelector('.category-btn.active');
      if (activeButton) {
        const containerWidth = filterRef.current.offsetWidth;
        const buttonLeft = activeButton.offsetLeft;
        const buttonWidth = activeButton.offsetWidth;
        const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
        
        filterRef.current.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        });
      }
    }
  }, [selectedCategory]);

  const scrollToCategory = (categoryId) => {
    if (categoryId === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onSelectCategory('all');
      return;
    }

    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const headerHeight = 140;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      onSelectCategory(categoryId);
    }
  };

  return (
    <div ref={filterRef} className="category-filter">
      <button 
        className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
        onClick={() => scrollToCategory('all')}
      >
        All Items
      </button>
      {categories.map(category => {
        const categoryId = category.name;
        return (
          <button
            key={categoryId}
            className={`category-btn ${selectedCategory === categoryId ? 'active' : ''}`}
            onClick={() => scrollToCategory(categoryId)}
          >
            {category.name}
          </button>
        );
      })}

      <style jsx>{`
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