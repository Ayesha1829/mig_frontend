import React from 'react';
import './Stats.css';

const Stats: React.FC = () => {
  return (
    <section className="stats-section">
      <div className="stats-container">
        <div className="stat-item">
          <div className="stat-value">10,000+</div>
          <div className="stat-label">Games Played Daily</div>
        </div>

        <div className="stat-item">
          <div className="stat-value">50+</div>
          <div className="stat-label">Countries</div>
        </div>

        <div className="stat-item">
          <div className="stat-value">4.8★</div>
          <div className="stat-label">Player Rating</div>
        </div>

        <div className="stat-item">
          <div className="stat-value">2min</div>
          <div className="stat-label">Average Game Time</div>
        </div>
      </div>
    </section>
  );
};

export default Stats;

