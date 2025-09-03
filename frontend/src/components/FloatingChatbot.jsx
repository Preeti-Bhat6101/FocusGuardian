import React, { useState } from 'react';
import Chatbot from './Chatbot'; 
import { FaCommentDots, FaTimes } from 'react-icons/fa';
import { Rnd } from 'react-rnd';
import './FloatingChatbot.css';

// --- Define initial dimensions here ---
const INITIAL_SIZE = { width: 370, height: 540 };

function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [size, setSize] = useState(INITIAL_SIZE);
  
  // Set initial position to be anchored to the bottom-right of the screen
  const [position, setPosition] = useState({ 
    x: window.innerWidth - (INITIAL_SIZE.width + 25),
    y: window.innerHeight - (INITIAL_SIZE.height + 60 + 25)
  });

  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);

  if (!isOpen) {
    return (
      <div className="floating-chatbot-container">
        <button
          onClick={openChat}
          className="chatbot-fab"
          aria-label="Open chat"
        >
          <FaCommentDots />
        </button>
      </div>
    );
  }

  return (
    <Rnd
      size={size}
      position={position}
      onDragStop={(e, d) => {
        setPosition({ x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, newPosition) => {
        setSize({
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        });
        setPosition(newPosition);
      }}
      minWidth={300}
      // --- Use the initial height as the minimum height ---
      minHeight={INITIAL_SIZE.height}
      bounds="window"
      className="chatbot-window"
      dragHandleClassName="chatbot-header"
    >
      <div className="chatbot-header">
        <h3>Productivity Assistant</h3>
        <button onClick={closeChat} className="close-btn" aria-label="Close chat">
          <FaTimes />
        </button>
      </div>
      <div className="chatbot-body">
        {/* This inner Chatbot component will handle its own layout */}
        <Chatbot />
      </div>
    </Rnd>
  );
}

export default FloatingChatbot;