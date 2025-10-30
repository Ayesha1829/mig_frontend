import React from 'react';
import './Cards.css';

const Cards: React.FC = () => {
  return (
    <section className="cards-section">
      <div className="cards-container">
        <div className="cards-header">
          <h2 className="cards-title">Watch, Learn & Challenge the Creator</h2>
          <p className="cards-subtitle">
            Get better at MIGOYUGO by watching strategy videos and challenging me live on stream
          </p>
        </div>

        <div className="cards-grid">
          {/* YouTube Card */}
          <div className="card youtube-card">
            <div className="card-header">
              <div className="card-icon youtube-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div className="card-title-section">
                <h3 className="card-title">YouTube Channel</h3>
                <p className="card-description">Strategy videos & game analysis</p>
              </div>
            </div>

            <div className="card-content">
              <p className="card-text">
                Watch in-depth strategy videos, game breakdowns, and tutorials to master the art of MIGOYUGO. Learn from winning positions and avoid common mistakes.
              </p>
            </div>

            <button className="card-button youtube-button">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Visit YouTube Channel
            </button>
          </div>

          {/* Twitch Card */}
          <div className="card twitch-card">
            <div className="card-header">
              <div className="card-icon twitch-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                </svg>
              </div>
              <div className="card-title-section">
                <h3 className="card-title">Twitch</h3>
                <p className="card-description">Challenge me directly!</p>
              </div>
            </div>

            <div className="card-content">
              <div className="live-stream-info">
                <div className="live-badge">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <circle cx="12" cy="12" r="8"/>
                  </svg>
                  <span>Daily Live Stream</span>
                </div>
                <p className="stream-time">Every evening at 6:00 PM Pacific</p>
                <p className="stream-description">
                  Come challenge me to a game and test your skills live!
                </p>
              </div>

              <p className="card-text">
                Join the live stream where I take on all challengers. Get real-time strategy tips and see how different approaches work in practice.
              </p>
            </div>

            <button className="card-button twitch-button">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
              </svg>
              Watch on Twitch
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cards;

