import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiUser, HiChat, HiCheckCircle, HiExclamationCircle, HiInformationCircle, HiExternalLink, HiOfficeBuilding } from 'react-icons/hi';

const ChatMessage = ({ message }) => {
  const navigate = useNavigate();
  const isUser = message.type === 'user';
  const timestamp = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const getMessageIcon = (type) => {
    switch (type) {
      case 'error':
        return <HiExclamationCircle className="w-4 h-4 text-red-500" />;
      case 'success':
        return <HiCheckCircle className="w-4 h-4 text-green-500" />;
      case 'info':
        return <HiInformationCircle className="w-4 h-4 text-blue-500" />;
      case 'greeting':
        return <HiChat className="w-4 h-4 text-blue-500" />;
      case 'cancel_redirect':
      case 'reschedule_redirect':
        return <HiExternalLink className="w-4 h-4 text-purple-500" />;
      case 'hospital_info':
        return <HiOfficeBuilding className="w-4 h-4 text-green-500" />;
      default:
        return <HiChat className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMessageStyle = (type) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'greeting':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'cancel_redirect':
      case 'reschedule_redirect':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'hospital_info':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const handleLinkClick = (path) => {
    navigate(path);
  };

  const formatMessage = (text) => {
    // Convert markdown-style formatting to HTML and handle clickable links
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, path) => {
        return `<span class="text-blue-600 underline hover:text-blue-800 cursor-pointer font-medium" data-path="${path}">${linkText}</span>`;
      })
      .replace(/\n/g, '<br />');
    
    return formatted;
  };

  const handleMessageClick = (e) => {
    if (e.target.dataset.path) {
      handleLinkClick(e.target.dataset.path);
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-blue-600 text-white rounded-lg px-4 py-2">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0">
              <HiUser className="w-4 h-4 mt-0.5" />
            </div>
            <div className="flex-1">
              <p className="text-sm whitespace-pre-wrap">{message.message}</p>
              <p className="text-xs text-blue-100 mt-1">{timestamp}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0">
            {getMessageIcon(message.type)}
          </div>
          <div className="flex-1">
            <div className={`rounded-lg px-4 py-2 border ${getMessageStyle(message.type)}`}>
              <div 
                className="text-sm whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ 
                  __html: formatMessage(message.message) 
                }}
                onClick={handleMessageClick}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-1">{timestamp}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;

