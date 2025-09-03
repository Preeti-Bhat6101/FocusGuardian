import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './navbar.css';

const Navbar = ({ hideLoginButton = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll effect and active section tracking
  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 50);

    if (location.pathname === '/') {
      const sections = ['home', 'features', 'testimonials', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetBottom = offsetTop + element.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(section);
            return; // Exit the loop once an active section is found
          }
        }
      }
      setActiveSection('home'); // Default to home if no section is active
    }
  }, [location.pathname]);

  // Handle scroll when a link is clicked
  const handleScrollToSection = useCallback((sectionId) => {
    if (location.pathname !== '/') {
      // If on a different page, navigate to home with the section ID as state
      navigate(`/#${sectionId}`);
    } else {
      // If already on the home page, scroll directly
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false); // Close mobile menu after click
  }, [location.pathname, navigate]);

  // Effect to handle initial scroll if a hash is in the URL
  useEffect(() => {
    const handleInitialScroll = () => {
      if (location.hash) {
        const id = location.hash.substring(1);
        const element = document.getElementById(id);
        if (element) {
          // Use setTimeout to ensure the element is rendered before scrolling
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    };

    if (location.pathname === '/') {
      handleInitialScroll();
    }
  }, [location.hash, location.pathname]);

  // Attach and clean up scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

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
            className={`nav-link ${activeSection === 'home' && location.pathname === '/' ? 'active' : ''}`}
            onClick={() => handleScrollToSection('home')}
          >
            Home
          </button>
          <button
            className={`nav-link ${activeSection === 'features' && location.pathname === '/' ? 'active' : ''}`}
            onClick={() => handleScrollToSection('features')}
          >
            Features
          </button>
          <button
            className={`nav-link ${activeSection === 'testimonials' && location.pathname === '/' ? 'active' : ''}`}
            onClick={() => handleScrollToSection('testimonials')}
          >
            Testimonials
          </button>
          <button
            className={`nav-link ${activeSection === 'contact' && location.pathname === '/' ? 'active' : ''}`}
            onClick={() => handleScrollToSection('contact')}
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
          className={`mobile-nav-link ${activeSection === 'home' && location.pathname === '/' ? 'active' : ''}`}
          onClick={() => handleScrollToSection('home')}
        >
          Home
        </button>
        <button
          className={`mobile-nav-link ${activeSection === 'features' && location.pathname === '/' ? 'active' : ''}`}
          onClick={() => handleScrollToSection('features')}
        >
          Features
        </button>
        <button
          className={`mobile-nav-link ${activeSection === 'testimonials' && location.pathname === '/' ? 'active' : ''}`}
          onClick={() => handleScrollToSection('testimonials')}
        >
          Testimonials
        </button>
        <button
          className={`mobile-nav-link ${activeSection === 'contact' && location.pathname === '/' ? 'active' : ''}`}
          onClick={() => handleScrollToSection('contact')}
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