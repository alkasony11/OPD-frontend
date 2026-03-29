import React from 'react';
import { HiChat } from 'react-icons/hi';

const TypingIndicator = () => {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0">
            <HiChat className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex-1">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-600">MediQ Assistant is typing</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;

