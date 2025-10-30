import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';
import './UserStats.css';

interface UserStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StatsData {
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winRate: number;
}

const UserStats: React.FC<UserStatsProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await AuthService.getUserStats();
      if (result.error) {
        setError(result.error);
      } else {
        setStats(result.stats);
      }
    } catch (err) {
      setError('Failed to load statistics');
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="stats-modal-overlay" onClick={onClose}>
      <div className="stats-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stats-modal-header">
          <h2>Your Statistics</h2>
          <button className="stats-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="stats-modal-content">
          {loading && (
            <div className="loading">Loading statistics...</div>
          )}

          {error && (
            <div className="error">{error}</div>
          )}

          {!loading && !error && stats && (
            <div className="stats-grid">
              <div className="stat-card wins">
                <div className="stat-icon">🏆</div>
                <div className="stat-value">{stats.wins}</div>
                <div className="stat-label">Wins</div>
              </div>

              <div className="stat-card losses">
                <div className="stat-icon">💔</div>
                <div className="stat-value">{stats.losses}</div>
                <div className="stat-label">Losses</div>
              </div>

              <div className="stat-card draws">
                <div className="stat-icon">🤝</div>
                <div className="stat-value">{stats.draws}</div>
                <div className="stat-label">Draws</div>
              </div>

              <div className="stat-card total">
                <div className="stat-icon">🎮</div>
                <div className="stat-value">{stats.totalGames}</div>
                <div className="stat-label">Total Games</div>
              </div>

              <div className="stat-card winrate">
                <div className="stat-icon">📊</div>
                <div className="stat-value">{stats.winRate}%</div>
                <div className="stat-label">Win Rate</div>
              </div>
            </div>
          )}

          {!loading && !error && !stats && (
            <div className="no-stats">
              <p>No statistics available yet.</p>
              <p>Play some games to see your stats!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserStats;

