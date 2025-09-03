import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './navbar.css';

const Navbar = ({ hideLoginButton = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      // Update active section based on scroll position
      const sections = ['home', 'features', 'testimonials', 'contact'];
      const scrollPosition = window.scrollY + 100;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetBottom = offsetTop + element.offsetHeight;
          
          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    } else if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>      
      <div className="nav-content container">
        <div className="logo-container" onClick={() => navigate('/')}>
          <div className="logo-circle">
            <img src="/images/logo.png" alt="Focus Guardian Logo" className="logo-image" />
          </div>
          <span className="brand-name">Focus Guardian</span>
        </div>
        
        <div className="desktop-nav">
          <button 
            className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}
            onClick={() => scrollToSection('home')}
          >
            Home
          </button>
          <button 
            className={`nav-link ${activeSection === 'features' ? 'active' : ''}`}
            onClick={() => scrollToSection('features')}
          >
            Features
          </button>
          <button 
            className={`nav-link ${activeSection === 'testimonials' ? 'active' : ''}`}
            onClick={() => scrollToSection('testimonials')}
          >
            Testimonials
          </button>
          <button 
            className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}
            onClick={() => scrollToSection('contact')}
          >
            Contact
          </button>
          {!hideLoginButton && (
            <button 
              className="nav-login-btn"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
          )}
        </div>
        
        <button
          className={`mobile-menu-btn ${isMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <span className="menu-line top" />
          <span className="menu-line middle" />
          <span className="menu-line bottom" />
        </button>
      </div>
      
      <div className={`mobile-nav ${isMenuOpen ? 'open' : ''}`}>
        <button 
          className={`mobile-nav-link ${activeSection === 'home' ? 'active' : ''}`}
          onClick={() => scrollToSection('home')}
        >
          Home
        </button>
        <button 
          className={`mobile-nav-link ${activeSection === 'features' ? 'active' : ''}`}
          onClick={() => scrollToSection('features')}
        >
          Features
        </button>
        <button 
          className={`mobile-nav-link ${activeSection === 'testimonials' ? 'active' : ''}`}
          onClick={() => scrollToSection('testimonials')}
        >
          Testimonials
        </button>
        <button 
          className={`mobile-nav-link ${activeSection === 'contact' ? 'active' : ''}`}
          onClick={() => scrollToSection('contact')}
        >
          Contact
        </button>
        {!hideLoginButton && (
          <button 
            className="mobile-nav-link"
            onClick={() => {
              navigate('/login');
              setIsMenuOpen(false);
            }}
          >
            Login
          </button>
        )}
      </div>
      
      {/* Overlay when mobile menu is open */}
      {isMenuOpen && (
        <div 
          className="mobile-nav-overlay"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;