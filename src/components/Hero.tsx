import React, { useEffect, useRef } from 'react';
import './Hero.css';

interface HeroProps {
  onPlayClick: () => void;
  onHowToPlayClick?: () => void;
  onBattleReportClick?: () => void;
  onLeaderboardClick?: () => void;
  onYouTubeClick?: () => void;
  showBattleReportButton?: boolean;
  showLeaderboardButton?: boolean;
  showYouTubeButton?: boolean;
}

const Hero: React.FC<HeroProps> = ({ onPlayClick, onHowToPlayClick, onBattleReportClick, onLeaderboardClick, onYouTubeClick, showBattleReportButton, showLeaderboardButton, showYouTubeButton }) => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="home" className="hero">
      <div className="container">
        <div className="hero-content fade-in" ref={heroRef}>
          <div className="hero-logo">
            <img 
              src="/migoyugo-logo.png" 
              alt="MIGOYUGO" 
              className="hero-logo-image"
            />
          </div>
          
          <div className="hero-slogan">
            <h1 className="slogan-text">
              Deceptively simple. Diabolically deep. Disturbingly addictive.
            </h1>
          </div>
          
          <div className="hero-actions">
          <button className="btn btn-play" onClick={onPlayClick}>
              <span className="play-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="currentColor"><path d="M187.2 100.9C174.8 94.1 159.8 94.4 147.6 101.6C135.4 108.8 128 121.9 128 136L128 504C128 518.1 135.5 531.2 147.6 538.4C159.7 545.6 174.8 545.9 187.2 539.1L523.2 355.1C536 348.1 544 334.6 544 320C544 305.4 536 291.9 523.2 284.9L187.2 100.9z"/></svg>
              </span>
              Play Now
            </button>
            <button className="btn btn-how" onClick={onHowToPlayClick}>
              <span className="book-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="currentColor"><path d="M480 576L192 576C139 576 96 533 96 480L96 160C96 107 139 64 192 64L496 64C522.5 64 544 85.5 544 112L544 400C544 420.9 530.6 438.7 512 445.3L512 512C529.7 512 544 526.3 544 544C544 561.7 529.7 576 512 576L480 576zM192 448C174.3 448 160 462.3 160 480C160 497.7 174.3 512 192 512L448 512L448 448L192 448zM224 216C224 229.3 234.7 240 248 240L424 240C437.3 240 448 229.3 448 216C448 202.7 437.3 192 424 192L248 192C234.7 192 224 202.7 224 216zM248 288C234.7 288 224 298.7 224 312C224 325.3 234.7 336 248 336L424 336C437.3 336 448 325.3 448 312C448 298.7 437.3 288 424 288L248 288z"/></svg>
              </span>
              How to Play
            </button>
            {showBattleReportButton && onBattleReportClick && (
  <button className="btn btn-battle-report" onClick={onBattleReportClick}>
    <span className="battle-icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="currentColor"><path d="M208.3 64L432.3 64C458.8 64 480.4 85.8 479.4 112.2C479.2 117.5 479 122.8 478.7 128L528.3 128C554.4 128 577.4 149.6 575.4 177.8C567.9 281.5 514.9 338.5 457.4 368.3C441.6 376.5 425.5 382.6 410.2 387.1C390 415.7 369 430.8 352.3 438.9L352.3 512L416.3 512C434 512 448.3 526.3 448.3 544C448.3 561.7 434 576 416.3 576L224.3 576C206.6 576 192.3 561.7 192.3 544C192.3 526.3 206.6 512 224.3 512L288.3 512L288.3 438.9C272.3 431.2 252.4 416.9 233 390.6C214.6 385.8 194.6 378.5 175.1 367.5C121 337.2 72.2 280.1 65.2 177.6C63.3 149.5 86.2 127.9 112.3 127.9L161.9 127.9C161.6 122.7 161.4 117.5 161.2 112.1C160.2 85.6 181.8 63.9 208.3 63.9zM165.5 176L113.1 176C119.3 260.7 158.2 303.1 198.3 325.6C183.9 288.3 172 239.6 165.5 176zM444 320.8C484.5 297 521.1 254.7 527.3 176L475 176C468.8 236.9 457.6 284.2 444 320.8z"/></svg>
    </span>
    Personal Stats
  </button>
)}
            {showLeaderboardButton && onLeaderboardClick && (
  <button className="btn btn-leaderboard" onClick={onLeaderboardClick}>
    <span className="leaderboard-icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="currentColor"><path d="M341.9 38.1C328.5 29.9 311.6 29.9 298.2 38.1C273.8 53 258.7 57 230.1 56.4C214.4 56 199.8 64.5 192.2 78.3C178.5 103.4 167.4 114.5 142.3 128.2C128.5 135.7 120.1 150.4 120.4 166.1C121.1 194.7 117 209.8 102.1 234.2C93.9 247.6 93.9 264.5 102.1 277.9C117 302.3 121 317.4 120.4 346C120 361.7 128.5 376.3 142.3 383.9C164.4 396 175.6 406 187.4 425.4L138.7 522.5C132.8 534.4 137.6 548.8 149.4 554.7L235.4 597.7C246.9 603.4 260.9 599.1 267.1 587.9L319.9 492.8L372.7 587.9C378.9 599.1 392.9 603.5 404.4 597.7L490.4 554.7C502.3 548.8 507.1 534.4 501.1 522.5L452.5 425.3C464.2 405.9 475.5 395.9 497.6 383.8C511.4 376.3 519.8 361.6 519.5 345.9C518.8 317.3 522.9 302.2 537.8 277.8C546 264.4 546 247.5 537.8 234.1C522.9 209.7 518.9 194.6 519.5 166C519.9 150.3 511.4 135.7 497.6 128.1C472.5 114.4 461.4 103.3 447.7 78.2C440.2 64.4 425.5 56 409.8 56.3C381.2 57 366.1 52.9 341.7 38zM320 160C373 160 416 203 416 256C416 309 373 352 320 352C267 352 224 309 224 256C224 203 267 160 320 160z"/></svg>
    </span>
    Leaderboard
  </button>
)}
            {showYouTubeButton && onYouTubeClick && (
  <button className="btn btn-youtube" onClick={onYouTubeClick}>
    <span className="youtube-icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="currentColor"><path d="M581.7 188.1C575.5 164.4 556.9 145.8 533.4 139.5C490.9 128 320.1 128 320.1 128C320.1 128 149.3 128 106.7 139.5C83.2 145.8 64.7 164.4 58.4 188.1C47 231 47 320.4 47 320.4C47 320.4 47 409.8 58.4 452.7C64.7 476.3 83.2 494.2 106.7 500.5C149.3 512 320.1 512 320.1 512C320.1 512 490.9 512 533.5 500.5C557 494.2 575.5 476.3 581.8 452.7C593.2 409.8 593.2 320.4 593.2 320.4C593.2 320.4 593.2 231 581.8 188.1zM264.2 401.6L264.2 239.2L406.9 320.4L264.2 401.6z"/></svg>
    </span>
      Watch on YouTube
  </button>
)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
