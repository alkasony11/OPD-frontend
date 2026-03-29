import React, { useState, useEffect, useRef } from 'react';
import { HiArrowLeft, HiChat, HiRefresh, HiMicrophone, HiStop, HiPaperAirplane } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ChatMessage from './ChatMessage';
import QuickActions from './QuickActions';
import TypingIndicator from './TypingIndicator';
import { API_CONFIG } from '../../config/urls';

const ChatbotPage = () => {
  const navigate = useNavigate();
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
    initializeChatbot();
    inputRef.current?.focus();
  }, []);

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

      // Load quick actions and FAQ categories
      try {
        const [actionsResponse, faqResponse] = await Promise.all([
          axios.get(`${API_CONFIG.BASE_URL}/api/chatbot/quick-actions`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_CONFIG.BASE_URL}/api/chatbot/faq-categories`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setQuickActions(actionsResponse.data.quickActions || []);
        setFaqCategories(faqResponse.data.categories || []);
      } catch (error) {
        console.error('Error loading FAQ data:', error);
        // Set default FAQ data if API fails
        setFaqCategories([
          {
            id: 'appointments',
            name: 'Appointments',
            questions: [
              'How do I book an appointment?',
              'How do I reschedule my appointment?',
              'How do I cancel my appointment?',
              'What documents should I bring?'
            ]
          },
          {
            id: 'hospital',
            name: 'Hospital Information',
            questions: [
              'What are the OPD timings?',
              'What departments do you have?',
              'Where is the hospital located?',
              'Is parking available?'
            ]
          },
          {
            id: 'account',
            name: 'Account & Profile',
            questions: [
              'How do I update my profile?',
              'How do I add family members?',
              'I forgot my Patient ID',
              'How do I change my password?'
            ]
          },
          {
            id: 'emergency',
            name: 'Emergency',
            questions: [
              'What is the emergency number?',
              'Is emergency service available 24/7?',
              'How do I contact ambulance?'
            ]
          }
        ]);
      }

      // Initialize with greeting
      const greetingResponse = await sendMessage('Hi');
      if (greetingResponse) {
        setMessages([greetingResponse]);
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-white hover:opacity-80 transition-opacity"
              >
                <HiArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-black font-bold text-xl">M</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">MediQ Assistant</h1>
                  <p className="text-blue-100 flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    Your AI healthcare assistant
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={clearConversation}
                className="p-3 text-white hover:opacity-80 rounded-xl transition-opacity duration-200"
                title="Refresh conversation"
              >
                <HiRefresh className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
          {/* Main Chat Area */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 h-[600px] flex flex-col overflow-hidden" style={{
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)'
            }}>
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.length === 0 && (
                  <div className="text-center text-gray-600 py-16">
                    <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <HiChat className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Welcome to MediQ Assistant</h3>
                    <p className="text-lg text-gray-500 mb-2">I'm here to help you with appointments, hospital information, and more.</p>
                    <p className="text-sm text-gray-400">Start by typing a message or using the quick actions below.</p>
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
                <div className="px-6 pb-4">
                  <QuickActions 
                    actions={quickActions} 
                    onActionClick={handleQuickAction}
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Input Area */}
              <div className="p-6 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex items-end space-x-4">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message here..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200"
                      rows={1}
                      style={{ minHeight: '52px', maxHeight: '120px' }}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="flex space-x-3">
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
                      {isListening ? <HiStop className="w-6 h-6" /> : <HiMicrophone className="w-6 h-6" />}
                    </button>

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isLoading}
                      className="p-3 bg-blue-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200"
                      title="Send message"
                    >
                      <HiPaperAirplane className="w-6 h-6" />
                    </button>
                  </div>
                </form>

                {/* Status */}
                {isLoading && (
                  <div className="mt-3 text-sm text-gray-500 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    MediQ Assistant is typing...
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;

