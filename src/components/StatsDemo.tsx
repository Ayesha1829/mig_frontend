import React, { useState } from 'react';
import UserStats from './UserStats';
import Leaderboard from './Leaderboard';

const StatsDemo: React.FC = () => {
  const [showUserStats, setShowUserStats] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <button 
        onClick={() => setShowUserStats(true)}
        style={{
          padding: '12px 24px',
          backgroundColor: '#4A90E2',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '600'
        }}
      >
        📊 View My Stats
      </button>
      
      <button 
        onClick={() => setShowLeaderboard(true)}
        style={{
          padding: '12px 24px',
          backgroundColor: '#48bb78',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '600'
        }}
      >
        🏆 Leaderboard
      </button>

      <UserStats 
        isOpen={showUserStats} 
        onClose={() => setShowUserStats(false)} 
      />
      
      <Leaderboard 
        isOpen={showLeaderboard} 
        onClose={() => setShowLeaderboard(false)} 
      />
    </div>
  );
};

export default StatsDemo;

