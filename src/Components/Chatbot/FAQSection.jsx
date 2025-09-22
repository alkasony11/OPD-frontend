import React, { useState } from 'react';
import { HiChevronDown, HiChevronRight, HiCalendar, HiOfficeBuilding, HiUser, HiPhone } from 'react-icons/hi';

const FAQSection = ({ categories, onQuestionClick }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);


  const getCategoryIcon = (categoryId) => {
    switch (categoryId) {
      case 'appointments':
        return <HiCalendar className="w-4 h-4" />;
      case 'hospital':
        return <HiOfficeBuilding className="w-4 h-4" />;
      case 'account':
        return <HiUser className="w-4 h-4" />;
      case 'emergency':
        return <HiPhone className="w-4 h-4" />;
      default:
        return <HiCalendar className="w-4 h-4" />;
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <HiCalendar className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm">Loading FAQ categories...</p>
        <p className="text-xs text-gray-400 mt-1">If this persists, please refresh the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <div key={category.id} className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleCategory(category.id)}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="text-gray-600">
                {getCategoryIcon(category.id)}
              </div>
              <span className="font-medium text-gray-900">{category.name}</span>
            </div>
            {expandedCategory === category.id ? (
              <HiChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <HiChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          {expandedCategory === category.id && (
            <div className="border-t border-gray-200 bg-gray-50">
              <div className="p-3 space-y-2">
                {category.questions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => onQuestionClick(question)}
                    className="w-full text-left p-2 text-sm text-gray-700 hover:bg-white hover:shadow-sm rounded transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FAQSection;
