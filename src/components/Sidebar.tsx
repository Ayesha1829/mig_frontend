import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  onPlayClick: () => void;
  onHowToPlayClick: () => void;
  onHomeClick: () => void;
  onAboutClick: () => void;
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
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onPlayClick, 
  onHowToPlayClick, 
  onHomeClick,
  onAboutClick,
  authState, 
  onLogout, 
  onSignInClick, 
  onSignUpClick,
  isMobileMenuOpen,
  toggleMobileMenu,
  closeMobileMenu
}) => {
 const handleNavClick = (section: string) => {
  if (section === 'home') {
    onHomeClick();
  } else if (section === 'play') {
    onPlayClick();
  } else if (section === 'Tutorial') {
    onHowToPlayClick();
  } else if (section === 'stream') {
    window.open('https://www.twitch.tv/migoyugo', '_blank');
  } else if (section === 'videos') {
    window.open('https://www.youtube.com/channel/UCXqT-GBhTzM_Gw37aG-j8JQ', '_blank');
  } else if (section === 'discord') {
    window.open('https://discord.gg/migoyugo', '_blank');
  } else if (section === 'feedback') {
    window.location.href = 'mailto:feedback@migoyugo.com';
  } else if (section === 'about') {
    onAboutClick();
  }

  closeMobileMenu();
};



  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button 
        className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={toggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
      />

      <div className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <img 
          src="/migoyugo-logo.png" 
          alt="MIGOYUGO" 
          className="sidebar-logo-img"
        />
      </div>

      {/* Navigation Items */}
      {/* Navigation Items */}
<nav className="sidebar-nav">
  <button onClick={() => handleNavClick('home')} className="sidebar-nav-item">
    <span className="nav-icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="currentColor">
        <path d="M304 70.1C313.1 61.9 326.9 61.9 336 70.1L568 278.1C577.9 286.9 578.7 302.1 569.8 312C560.9 321.9 545.8 322.7 535.9 313.8L527.9 306.6L527.9 511.9C527.9 547.2 499.2 575.9 463.9 575.9L175.9 575.9C140.6 575.9 111.9 547.2 111.9 511.9L111.9 306.6L103.9 313.8C94 322.6 78.9 321.8 70 312C61.1 302.2 62 287 71.8 278.1L304 70.1zM320 120.2L160 263.7L160 512C160 520.8 167.2 528 176 528L224 528L224 424C224 384.2 256.2 352 296 352L344 352C383.8 352 416 384.2 416 424L416 528L464 528C472.8 528 480 520.8 480 512L480 263.7L320 120.3zM272 528L368 528L368 424C368 410.7 357.3 400 344 400L296 400C282.7 400 272 410.7 272 424L272 528z"/>
      </svg>
    </span>
    <span className="nav-text">Home</span>
  </button>

  <button onClick={() => handleNavClick('play')} className="sidebar-nav-item">
    <span className="nav-icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="currentColor">
        <path d="M448 128C554 128 640 214 640 320C640 426 554 512 448 512L192 512C86 512 0 426 0 320C0 214 86 128 192 128L448 128zM192 240C178.7 240 168 250.7 168 264L168 296L136 296C122.7 296 112 306.7 112 320C112 333.3 122.7 344 136 344L168 344L168 376C168 389.3 178.7 400 192 400C205.3 400 216 389.3 216 376L216 344L248 344C261.3 344 272 333.3 272 320C272 306.7 261.3 296 248 296L216 296L216 264C216 250.7 205.3 240 192 240zM432 336C414.3 336 400 350.3 400 368C400 385.7 414.3 400 432 400C449.7 400 464 385.7 464 368C464 350.3 449.7 336 432 336zM496 240C478.3 240 464 254.3 464 272C464 289.7 478.3 304 496 304C513.7 304 528 289.7 528 272C528 254.3 513.7 240 496 240z"/>
      </svg>
    </span>
    <span className="nav-text">Play</span>
  </button>

  <button onClick={() => handleNavClick('Tutorial')} className="sidebar-nav-item">
    <span className="nav-icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="currentColor">
        <path d="M80 259.8L289.2 345.9C299 349.9 309.4 352 320 352C330.6 352 341 349.9 350.8 345.9L593.2 246.1C602.2 242.4 608 233.7 608 224C608 214.3 602.2 205.6 593.2 201.9L350.8 102.1C341 98.1 330.6 96 320 96C309.4 96 299 98.1 289.2 102.1L46.8 201.9C37.8 205.6 32 214.3 32 224L32 520C32 533.3 42.7 544 56 544C69.3 544 80 533.3 80 520L80 259.8zM128 331.5L128 448C128 501 214 544 320 544C426 544 512 501 512 448L512 331.4L369.1 390.3C353.5 396.7 336.9 400 320 400C303.1 400 286.5 396.7 270.9 390.3L128 331.4z"/>
      </svg>
    </span>
    <span className="nav-text">Tutorial</span>
  </button>

  <button onClick={() => handleNavClick('videos')} className="sidebar-nav-item">
    <span className="nav-icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="currentColor">
        <path d="M128 128C92.7 128 64 156.7 64 192L64 448C64 483.3 92.7 512 128 512L384 512C419.3 512 448 483.3 448 448L448 192C448 156.7 419.3 128 384 128L128 128zM496 400L569.5 458.8C573.7 462.2 578.9 464 584.3 464C597.4 464 608 453.4 608 440.3L608 199.7C608 186.6 597.4 176 584.3 176C578.9 176 573.7 177.8 569.5 181.2L496 240L496 400z"/>
      </svg>
    </span>
    <span className="nav-text">Videos</span>
  </button>

  <button onClick={() => handleNavClick('stream')} className="sidebar-nav-item">
    <span className="nav-icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="currentColor">
        <path d="M455.4 167.5L416.8 167.5L416.8 277.2L455.4 277.2L455.4 167.5zM349.2 167L310.6 167L310.6 276.8L349.2 276.8L349.2 167zM185 64L88.5 155.4L88.5 484.6L204.3 484.6L204.3 576L300.8 484.6L378.1 484.6L551.9 320L551.9 64L185 64zM513.3 301.8L436.1 374.9L358.9 374.9L291.3 438.9L291.3 374.9L204.4 374.9L204.4 100.6L513.3 100.6L513.3 301.8z"/>
      </svg>
    </span>
    <span className="nav-text">Twitch</span>
  </button>

  <button onClick={() => handleNavClick('discord')} className="sidebar-nav-item">
    <span className="nav-icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="20" height="20" fill="currentColor">
        <path d="M524.5 69.9C479 46.9 428.9 32 377 32c-4.5 8.2-9.2 18.2-12.6 27C318.9 55.6 272.6 55.5 223.5 59c-3.5-8.8-8-18.8-12.5-27C159.2 32 109 46.9 63.5 69.9 7.1 164.1-2.5 255.8 1.6 347.5c53.5 39.3 105.4 63.3 156.2 79.2 12.8-17.7 24.2-36.5 33.9-56.2-18.9-7.2-36.9-16.4-53.7-27.6 4.5-3.3 9.1-6.7 13.5-10.1 101.7 47.7 212 47.7 313.2 0 4.4 3.4 9 6.8 13.5 10.1-16.9 11.2-34.9 20.4-53.9 27.7 9.8 19.7 21.3 38.5 34.1 56.1 50.9-15.9 102.8-39.9 156.4-79.2 4.5-93.2-7.5-184.8-62.3-277.6zM240.3 337.1c-30.6 0-55.6-27.9-55.6-62.3s24.7-62.3 55.6-62.3 56.2 27.9 55.6 62.3-25 62.3-55.6 62.3zm159.4 0c-30.6 0-55.6-27.9-55.6-62.3s24.7-62.3 55.6-62.3 56.2 27.9 55.6 62.3-25 62.3-55.6 62.3z"/>
      </svg>
    </span>
    <span className="nav-text">Discord</span>
  </button>

  <button onClick={() => handleNavClick('feedback')} className="sidebar-nav-item">
    <span className="nav-icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="currentColor">
        <path d="M512 64H128C92.7 64 64 92.7 64 128V512c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64zM256 448h-64v-64h64v64zm192 0h-64v-64h64v64zM256 320h-64v-64h64v64zm192 0h-64v-64h64v64zM256 192h-64v-64h64v64zm192 0h-64v-64h64v64z"/>
      </svg>
    </span>
    <span className="nav-text">Feedback</span>
  </button>

  <button onClick={() => handleNavClick('about')} className="sidebar-nav-item">
  <span className="nav-icon" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
    </svg>
  </span>
  <span className="nav-text">Q&A</span>
</button>
</nav>


      {/* Auth Section */}
      <div className="sidebar-auth">
        {authState.isAuthenticated ? (
          <div className="user-section">
                          <div className="user-info">
                <span className="welcome-text">
                  Welcome, {authState.user?.username}!
                </span>
              </div>
            <button className="sidebar-btn logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button className="sidebar-btn signup-btn" onClick={onSignUpClick}>
              Sign Up
            </button>
            <button className="sidebar-btn signin-btn" onClick={onSignInClick}>
              Sign In
            </button>
          </div>
        )}
      </div>

      {/* Footer Items */}
      {/* <div className="sidebar-footer">
        <button className="sidebar-footer-item">
          <span className="footer-icon">🌐</span>
          <span className="footer-text">English</span>
        </button>
        <button className="sidebar-footer-item">
          <span className="footer-icon">❓</span>
          <span className="footer-text">Support</span>
        </button>
      </div> */}
      </div>
    </>
  );
};

export default Sidebar;
