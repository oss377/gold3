// components/CategorySelector.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CategorySelector({ categories, initialCategory = 'all' }) {
  // Initialize state without immediately using router
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [isReady, setIsReady] = useState(false);
  
  // Get router instance (but don't use it yet)
  const router = useRouter();

  useEffect(() => {
    // Wait for both component mount AND router readiness
    if (typeof window !== 'undefined') {
      setIsReady(true);
    }
  }, []);

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    
    // Only use router if we're client-side and ready
    if (isReady && typeof window !== 'undefined') {
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, category: categoryId },
        },
        undefined,
        { shallow: true }
      ).catch(e => console.error('Navigation error:', e));
    }
  };

  // Render basic non-interactive version during SSR
  if (!isReady) {
    return (
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-md shadow-sm">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`px-4 py-2 text-sm font-medium bg-white text-gray-700 ${
                category.id === categories[0].id ? 'rounded-l-lg' : ''
              } ${
                category.id === categories[categories.length - 1].id ? 'rounded-r-lg' : ''
              } border border-gray-200`}
            >
              {category.icon} {category.name}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full interactive version for client-side
  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex rounded-md shadow-sm">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={`px-4 py-2 text-sm font-medium ${
              activeCategory === category.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } ${category.id === categories[0].id ? 'rounded-l-lg' : ''} ${
              category.id === categories[categories.length - 1].id ? 'rounded-r-lg' : ''
            } border border-gray-200`}
            disabled={!isReady}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}