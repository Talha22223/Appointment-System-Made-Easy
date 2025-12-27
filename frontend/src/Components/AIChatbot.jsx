import React, { useState, useEffect } from 'react';
import { assets } from '../assets/assets_frontend/assets';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://appointment-backend-fwy2.onrender.com/api';

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Initialize with welcome message
        if (messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: 'Hey! Ask me anything about appointments, lab tests, or health-related questions 😊',
                timestamp: new Date()
            }]);
        }
    }, [messages.length]);

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            role: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            // Get conversation history (last 6 messages to keep context manageable)
            const conversationHistory = messages
                .slice(-6)
                .map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

            const response = await axios.post(`${API_URL}/chatbot`, {
                message: inputMessage,
                conversationHistory
            });

            const botMessage = {
                role: 'assistant',
                content: response.data.reply,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error sending message to chatbot:', error);
            const errorMessage = {
                role: 'assistant',
                content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([{
            role: 'assistant',
            content: 'Chat cleared! How can I help you today? 😊',
            timestamp: new Date()
        }]);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Window */}
            <div className={`absolute bottom-16 right-0 w-80 h-96 bg-white rounded-lg shadow-2xl border transition-all duration-300 ease-in-out ${
                isOpen ? 'opacity-100 transform translate-y-0 scale-100' : 'opacity-0 transform translate-y-4 scale-95 pointer-events-none'
            }`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-semibold text-sm">Medical Assistant</p>
                            <p className="text-xs opacity-90">Online</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={clearChat}
                            className="text-white/80 hover:text-white text-xs bg-white/10 px-2 py-1 rounded"
                        >
                            Clear
                        </button>
                        <button 
                            onClick={toggleChatbot}
                            className="text-white/80 hover:text-white"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="h-64 overflow-y-auto p-4 space-y-3">
                    {messages.map((message, index) => (
                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                                message.role === 'user' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-800'
                            }`}>
                                <p>{message.content}</p>
                                <p className={`text-xs mt-1 ${
                                    message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                                }`}>
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 border-t">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                            disabled={isLoading}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={isLoading || !inputMessage.trim()}
                            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Chat Button */}
            <button
                onClick={toggleChatbot}
                className={`w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center ${
                    isOpen ? 'rotate-180' : ''
                }`}
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                )}
            </button>

            {/* Notification Badge */}
            {!isOpen && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">AI</span>
                </div>
            )}
        </div>
    );
};

export default AIChatbot;