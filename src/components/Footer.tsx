import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <img src="/migoyugo-logo.png" alt="MIGOYUGO" />
          </div>
          <p className="footer-tagline">
            The strategic board game that challenges your tactical thinking.
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h3>Game</h3>
            <ul>
              <li><a href="#play">Play Online</a></li>
              <li><a href="#computer">vs Computer</a></li>
              <li><a href="#tournaments">Tournaments</a></li>
              <li><a href="#leaderboards">Leaderboards</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Learn</h3>
            <ul>
              <li><a href="#how-to-play">How to Play</a></li>
              <li><a href="#strategies">Strategies</a></li>
              <li><a href="#tutorials">Video Tutorials</a></li>
              <li><a href="#livestream">Live Stream (6PM PT)</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Community</h3>
            <ul>
              <li><a href="#forums">Forums</a></li>
              <li><a href="#discord">Discord</a></li>
              <li><a href="#reddit">Reddit</a></li>
              <li><a href="#contact">Contact Us</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2024 MIGOYUGO. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 