// src/context/ChatbotContext.js

import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_BASE_URL;

// 1. Create the Context
const ChatbotContext = createContext();

// 2. Create a custom hook for easy consumption
export const useChatbot = () => {
  return useContext(ChatbotContext);
};

// 3. Create the Provider Component
export const ChatbotProvider = ({ children }) => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I help you be more productive today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (inputText) => {
    if (!inputText.trim()) return;

    // Add user's message to the state immediately
    const userMessage = { sender: 'user', text: inputText };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('focusGuardianToken');
      const res = await axios.post(
        `${API_URL}/api/chatbot/query`,
        { query: inputText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const botMessage = { sender: 'bot', text: res.data.response };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      const errorMessage = { sender: 'bot', text: "Sorry, I'm having trouble connecting. Please try again later." };
      setMessages(prev => [...prev, errorMessage]);
      console.error("Chatbot API error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // The value that will be available to all consumer components
  const value = {
    messages,
    isLoading,
    sendMessage,
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
};