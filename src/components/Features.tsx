import React from 'react';
import './Features.css';

const Features: React.FC = () => {
  return (
    <section className="features-section">
      <div className="features-container">
        <div className="features-header">
          <h2 className="features-title">Why Players Love MIGOYUGO</h2>
          <p className="features-subtitle">
            Experience strategic gameplay that's easy to learn but impossible to master
          </p>
        </div>

        <div className="features-grid">
          {/* Online Multiplayer */}
          <div className="feature-card">
            <div className="feature-icon-wrapper orange-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className="feature-title">Online Multiplayer</h3>
            <p className="feature-description">
              Play against your friends or a random opponent. Test your skill against players from around the world!
            </p>
          </div>

          {/* Multiple AI Levels */}
          <div className="feature-card">
            <div className="feature-icon-wrapper blue-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3 className="feature-title">Multiple AI Levels</h3>
            <p className="feature-description">
              Challenge yourself against 3 different AI difficulties, from beginner-friendly to expert-level opponents.
            </p>
          </div>

          {/* Quick to Learn */}
          <div className="feature-card">
            <div className="feature-icon-wrapper green-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polyline>
              </svg>
            </div>
            <h3 className="feature-title">Quick to Learn</h3>
            <p className="feature-description">
              Simple rules that create endless strategic possibilities. Master the basics in minutes, perfect your strategy over years.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;

