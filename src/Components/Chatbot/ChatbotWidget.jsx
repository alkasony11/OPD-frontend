import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiChat, HiX, HiPaperAirplane, HiMicrophone, HiStop, HiRefresh, HiExternalLink } from 'react-icons/hi';
import axios from 'axios';
import ChatMessage from './ChatMessage';
import QuickActions from './QuickActions';
import TypingIndicator from './TypingIndicator';
import { API_CONFIG } from '../../config/urls';

const ChatbotWidget = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [quickActions, setQuickActions] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      initializeChatbot();
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const initializeChatbot = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Load quick actions
      const actionsResponse = await axios.get(`${API_CONFIG.BASE_URL}/api/chatbot/quick-actions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuickActions(actionsResponse.data.quickActions || []);

      // Initialize with greeting if no messages
      if (messages.length === 0) {
        const greetingResponse = await sendMessage('Hi');
        if (greetingResponse) {
          setMessages([greetingResponse]);
        }
      }
    } catch (error) {
      console.error('Error initializing chatbot:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (messageText) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return null;
      }

      setIsLoading(true);
      setIsTyping(true);

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/api/chatbot/message`,
        { message: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setConversationId(response.data.conversationId);
        return response.data.response;
      }
      return null;
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        message: "I'm sorry, I couldn't process your request. Please try again or contact support.",
        type: 'error',
        timestamp: new Date().toISOString()
      };
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      message: inputMessage.trim(),
      type: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    const botResponse = await sendMessage(inputMessage.trim());
    if (botResponse) {
      setMessages(prev => [...prev, botResponse]);
    }
  };

  const handleQuickAction = async (action) => {
    if (isLoading) return;

    // For hospital info, don't show the question message, just show the response
    if (action.id !== 'hospital_info') {
      const userMessage = {
        message: action.message,
        type: 'user',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
    }

    const botResponse = await sendMessage(action.message);
    if (botResponse) {
      setMessages(prev => [...prev, botResponse]);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const clearConversation = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.delete(`${API_CONFIG.BASE_URL}/api/chatbot/clear-conversation`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages([]);
      setConversationId(null);
      
      // Reinitialize with greeting
      const greetingResponse = await sendMessage('Hi');
      if (greetingResponse) {
        setMessages([greetingResponse]);
      }
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
  };

  const handleMaximize = () => {
    setIsOpen(false); // Close the floating widget
    navigate('/chatbot');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-xl transition-opacity duration-300 flex items-center justify-center ${
          isOpen 
            ? 'bg-gray-600 hover:opacity-90 text-white transform rotate-180' 
            : 'bg-blue-600 hover:opacity-90 text-white shadow-blue-500/25'
        }`}
        style={{
          boxShadow: isOpen 
            ? '0 10px 25px rgba(0, 0, 0, 0.2)' 
            : '0 10px 25px rgba(59, 130, 246, 0.3)'
        }}
        aria-label={isOpen ? 'Close chatbot' : 'Open chatbot'}
      >
        {isOpen ? <HiX className="w-7 h-7" /> : <HiChat className="w-7 h-7" />}
      </button>

      {/* Chatbot Widget */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 h-[600px] bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden" style={{
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
        }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-black font-bold text-lg">M</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">MediQ Assistant</h3>
                <div className="text-xs text-blue-100 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Online now
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleMaximize}
                className="p-2 hover:opacity-80 rounded-lg transition-opacity duration-200"
                title="Open in full screen"
              >
                <HiExternalLink className="w-5 h-5" />
              </button>
              <button
                onClick={clearConversation}
                className="p-2 hover:opacity-80 rounded-lg transition-opacity duration-200"
                title="Refresh conversation"
              >
                <HiRefresh className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-600 py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <HiChat className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Welcome to MediQ Assistant</h3>
                <p className="text-gray-500">How can I help you today?</p>
              </div>
            )}

            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}

            {isTyping && <TypingIndicator />}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && quickActions.length > 0 && (
            <div className="px-4 pb-2">
              <QuickActions 
                actions={quickActions} 
                onActionClick={handleQuickAction}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  disabled={isLoading}
                />
              </div>
              
              <div className="flex space-x-2">
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={isLoading || !recognitionRef.current}
                  className={`p-3 rounded-xl transition-opacity duration-200 ${
                    isListening
                      ? 'bg-red-500 text-white hover:opacity-90 shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:opacity-80'
                  } ${(!recognitionRef.current || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? <HiStop className="w-5 h-5" /> : <HiMicrophone className="w-5 h-5" />}
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-3 bg-blue-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200"
                  title="Send message"
                >
                  <HiPaperAirplane className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Status */}
            {isLoading && (
              <div className="mt-2 text-xs text-gray-500 flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                MediQ Assistant is typing...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;

