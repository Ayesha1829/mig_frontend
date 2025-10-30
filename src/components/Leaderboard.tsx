import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';
import { UserStats } from '../services/firestoreService';
import './Leaderboard.css';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose }) => {
  const [leaderboard, setLeaderboard] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadLeaderboard();
    }
  }, [isOpen]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await AuthService.getLeaderboard(10);
      if (result.error) {
        setError(result.error);
      } else {
        setLeaderboard(result.leaderboard);
      }
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  const getWinRate = (user: UserStats) => {
    const totalGames = user['total games played'] || 0;
    const wins = user.no?.['of wins'] || 0;
    return totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  };

  if (!isOpen) return null;

  return (
    <div className="leaderboard-modal-overlay" onClick={onClose}>
      <div className="leaderboard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="leaderboard-modal-header">
          <h2>🏆 Leaderboard</h2>
          <button className="leaderboard-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="leaderboard-modal-content">
          {loading && (
            <div className="loading">Loading leaderboard...</div>
          )}

          {error && (
            <div className="error">{error}</div>
          )}

          {!loading && !error && (
            <>
              <div className="leaderboard-stats">
                <p>Top {leaderboard.length} Players</p>
              </div>

              <div className="leaderboard-list">
                {leaderboard.length === 0 ? (
                  <div className="no-data">
                    <p>No players found</p>
                    <p>Be the first to play and appear on the leaderboard!</p>
                  </div>
                ) : (
                  leaderboard.map((user, index) => (
                    <div key={user.uid} className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}>
                      <div className="rank">
                        <span className="rank-icon">{getRankIcon(index)}</span>
                      </div>
                      
                      <div className="leaderboard-player-info">
                        <div className="player-name">{user.username}</div>
                        <div className="player-email">{user.email}</div>
                      </div>
                      
                      <div className="player-stats">
                        <div className="stat">
                          <span className="stat-label">Wins:</span>
                          <span className="stat-value">{user.no?.['of wins'] || 0}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Games:</span>
                          <span className="stat-value">{user['total games played'] || 0}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Win Rate:</span>
                          <span className="stat-value">{getWinRate(user)}%</span>
                        </div>
                      </div>
                      
                      <div className="online-status">
                        <span className={`status-dot ${user.isOnline ? 'online' : 'offline'}`}></span>
                        <span className="status-text">{user.isOnline ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

