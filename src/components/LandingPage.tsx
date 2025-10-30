import React from 'react';
import Sidebar from './Sidebar';
import Hero from './Hero';
import './LandingPage.css';
//this sis the landing page
interface LandingPageProps {
  onPlayClick: () => void;
  onHowToPlayClick: () => void;
  onHomeClick: () => void;
  onAboutClick: () => void;
  onBattleReportClick: () => void;
  onLeaderboardClick: () => void;
  authState: {
    isAuthenticated: boolean;
    user: {
      username: string;
      email: string;
    } | null;
    isGuest: boolean;
  };
  onLogout: () => void;
  onSignInClick: () => void;
  onSignUpClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onPlayClick, onHowToPlayClick, onHomeClick, onAboutClick, onBattleReportClick, onLeaderboardClick, authState, onLogout, onSignInClick, onSignUpClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Force body styles for landing page to enable scrolling
  React.useEffect(() => {
    // Add a style tag to override all CSS and enable scrolling
    const styleTag = document.createElement('style');
    styleTag.id = 'landing-page-scroll-fix';
    styleTag.textContent = `
      html, body {
        height: auto !important;
        min-height: 100vh !important;
        overflow: auto !important;
        overflow-x: hidden !important;
        position: static !important;
        padding: 0 !important;
        margin: 0 !important;
        display: block !important;
        align-items: stretch !important;
      }
      
      body {
        background: #ffffff !important;
      }
      
      .landing-page-wrapper {
        min-height: 100vh !important;
        display: block !important;
        width: 100% !important;
        overflow: visible !important;
        position: relative !important;
      }
    `;
    document.head.appendChild(styleTag);

    // Cleanup on unmount
    return () => {
      const existingStyleTag = document.getElementById('landing-page-scroll-fix');
      if (existingStyleTag) {
        existingStyleTag.remove();
      }
    };
  }, []);

  return (
    <div 
      className="landing-page-wrapper" 
      style={{ 
        minHeight: '100vh', 
        display: 'block',
        width: '100%',
        overflow: 'visible',
        position: 'relative',
        zIndex: 1
      }}
    >
      <Sidebar 
        onPlayClick={onPlayClick}
        onHowToPlayClick={onHowToPlayClick}
        onHomeClick={onHomeClick}
        onAboutClick={onAboutClick}
        authState={authState}
        onLogout={onLogout}
        onSignInClick={onSignInClick}
        onSignUpClick={onSignUpClick}
        isMobileMenuOpen={isMobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        closeMobileMenu={closeMobileMenu}
      />
      <div className="main-content">
        <Hero 
          onPlayClick={onPlayClick} 
          onHowToPlayClick={onHowToPlayClick}
          onBattleReportClick={onBattleReportClick}
          onLeaderboardClick={onLeaderboardClick}
          onYouTubeClick={() => window.open('https://www.youtube.com/channel/UCXqT-GBhTzM_Gw37aG-j8JQ', '_blank')}
          showBattleReportButton={authState.isAuthenticated && !authState.isGuest}
          showLeaderboardButton={true}
          showYouTubeButton={true}
        />
        <div className="copyright-section">
          © 2025 Migoyugo. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
