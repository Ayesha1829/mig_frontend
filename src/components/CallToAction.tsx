import React from 'react';
import './CallToAction.css';

interface CallToActionProps {
  onPlayClick: () => void;
}

const CallToAction: React.FC<CallToActionProps> = ({ onPlayClick }) => {
  return (
    <section className="cta-section">
      <div className="cta-container">
        <h2 className="cta-title">Ready to Test Your Strategic Mind?</h2>
        <p className="cta-subtitle">
          Join thousands of players worldwide in the ultimate battle of wits and strategy.
        </p>
        <button className="cta-button" onClick={onPlayClick}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Start Playing Now
        </button>
      </div>
    </section>
  );
};

export default CallToAction;

