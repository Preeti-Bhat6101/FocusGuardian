// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Import Page components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SessionHistory from './pages/SessionHistory';

// --- IMPORT THE NEW COMPONENT ---
import FloatingChatbot from './components/FloatingChatbot';

import './config/chartjs-setup';
import './App.css';

// A helper component to conditionally render the chatbot
const AppLayout = () => {
  const location = useLocation();
  
  // List of paths where you DON'T want the chatbot to appear
  const noChatbotPaths = ['/', '/login', '/register'];
  
  const showChatbot = !noChatbotPaths.includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/session" element={<SessionHistory />} />
      </Routes>
      
      {/* Conditionally render the FloatingChatbot */}
      {showChatbot && <FloatingChatbot />}
    </>
  );
};


function App() {
  return (
    <Router>
      <div className="App">
        {/* Use the new layout component */}
        <AppLayout />
      </div>
    </Router>
  );
}

export default App;