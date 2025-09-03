// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Page components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

function App() {

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} /> {/* Route for Login Page */}
          <Route path="/register" element={<RegisterPage />} /> {/* Route for Register Page */}
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;