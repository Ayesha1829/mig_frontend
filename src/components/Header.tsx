import React, { useState, useEffect } from 'react';
import './Header.css';
import AuthModal from './AuthModal';

interface HeaderProps {
  onPlayClick: () => void;
  authState: {
    isAuthenticated: boolean;
    user: {
      username: string;
      email: string;
    } | null;
    isGuest: boolean;
  };
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onPlayClick, authState, onLogout }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = (section: string) => {
    if (section === 'play') {
      onPlayClick();
    }
    // Close mobile menu after clicking
    setIsMobileMenuOpen(false);
  };

  const handleSignUpClick = () => {
    setAuthMode('signup');
    setIsAuthModalOpen(true);
  };

  const handleSignInClick = () => {
    setAuthMode('signin');
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Helper function to extract username from email
  const getUsernameFromEmail = (email: string): string => {
    return email.split('@')[0];
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <nav className="nav">
          {/* Mobile menu toggle - only show on mobile */}
          <button 
            className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </nav>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </header>
  );
};

export default Header;
