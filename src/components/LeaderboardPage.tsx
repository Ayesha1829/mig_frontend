import React, { useState, useEffect, useCallback } from 'react';
import { AuthService } from '../services/authService';
import { UserStats } from '../services/firestoreService';
import './LeaderboardPage.css';

interface LeaderboardPageProps {
  onBack: () => void;
}

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onBack }) => {
  const [leaderboard, setLeaderboard] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'wins' | 'games' | 'winRate'>('wins');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [migoyugoStats, setMigoyugoStats] = useState({
    totalPlayers: 0,
    gamesToday: 0,
    playingNow: 0,
    mastersPlaying: 0
  });

  const loadMigoyugoStats = useCallback(async (leaderboardData: UserStats[]) => {
    try {
      const { FirestoreService } = await import('../services/firestoreService');
      const allUsers = await FirestoreService.getAllUsers();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const totalPlayers = allUsers.length;
      const playingNow = allUsers.filter(user => user.isOnline).length;
      
      const gamesToday = allUsers.reduce((sum, user) => {
        return sum + Math.floor((user['total games played'] || 0) * 0.1);
      }, 0);
      
      const mastersPlaying = leaderboardData.filter(user => user.isOnline).length;
      
      setMigoyugoStats({
        totalPlayers,
        gamesToday,
        playingNow,
        mastersPlaying
      });
    } catch (err) {
      console.error('Error loading Migoyugo stats:', err);
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await AuthService.getLeaderboard(100);
      if (result.error) {
        setError(result.error);
      } else {
        setLeaderboard(result.leaderboard);
        await loadMigoyugoStats(result.leaderboard);
      }
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [loadMigoyugoStats]);

  const loadCurrentUser = useCallback(async () => {
    try {
      const user = AuthService.getCurrentUser();
      if (user) {
        setCurrentUserId(user.uid);
      }
    } catch (err) {
      console.error('Error loading current user:', err);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
    loadCurrentUser();

    document.body.classList.add('leaderboard-page-open');

    return () => {
      document.body.classList.remove('leaderboard-page-open');
    };
  }, [loadLeaderboard, loadCurrentUser]);

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

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return '#FFD700'; // Gold
      case 1: return '#C0C0C0'; // Silver
      case 2: return '#CD7F32'; // Bronze
      default: return '#4A90E2'; // Blue
    }
  };

  // Add a function to get the ranking text based on active tab
  const getRankingText = () => {
    console.log('Current activeTab:', activeTab); // Debug log
    switch (activeTab) {
      case 'wins':
        return 'Ranked by total victories';
      case 'games':
        return 'Ranked by Most Games';
      case 'winRate':
        return 'Ranked by Win Rate';
      default:
        return 'Ranked by total victories';
    }
  };
  // Sort leaderboard based on active tab
  const getSortedLeaderboard = () => {
    const sorted = [...leaderboard];
    
    switch (activeTab) {
      case 'wins':
        return sorted.sort((a, b) => (b.no?.['of wins'] || 0) - (a.no?.['of wins'] || 0));
      case 'games':
        return sorted.sort((a, b) => (b['total games played'] || 0) - (a['total games played'] || 0));
      case 'winRate':
        return sorted.sort((a, b) => {
          const aRate = getWinRate(a);
          const bRate = getWinRate(b);
          // If win rates are equal, sort by total games as tiebreaker
          if (bRate === aRate) {
            return (b['total games played'] || 0) - (a['total games played'] || 0);
          }
          return bRate - aRate;
        });
      default:
        return sorted;
    }
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container">
        {/* Header */}
        <div className="leaderboard-header">
          <button className="back-btn" onClick={onBack}>
            ← Back to Game
          </button>
          <h1>🏆 LEADERBOARD 🏆</h1>
        </div>

        {/* Content */}
        <div className="leaderboard-content">
          <div className="leaderboard-main">
            {loading ? (
              <div className="loading-section">
                <div className="loading-spinner"></div>
                <p>Loading top players...</p>
              </div>
            ) : error ? (
              <div className="error-section">
                <p>❌ {error}</p>
                <button onClick={loadLeaderboard} className="retry-btn">
                  🔄 Retry
                </button>
              </div>
            ) : (
              <>
                {/* Leaderboard Stats */}
                <div className="leaderboard-stats">
                  <h2>🏆 Top {Math.min(leaderboard.length, 100)} Players</h2>
                  <p>{getRankingText()}</p>
                </div>

                {/* Leaderboard Tabs */}
                <div className="leaderboard-tabs">
                  <button 
                    className={`tab-button ${activeTab === 'wins' ? 'active' : ''}`}
                    onClick={() => setActiveTab('wins')}
                  >
                    <span className="tab-icon">⚔️</span>
                    <span className="tab-label">Most Wins</span>
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'games' ? 'active' : ''}`}
                    onClick={() => setActiveTab('games')}
                  >
                    <span className="tab-icon">🎯</span>
                    <span className="tab-label">Most Games</span>
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'winRate' ? 'active' : ''}`}
                    onClick={() => setActiveTab('winRate')}
                  >
                    <span className="tab-icon">📊</span>
                    <span className="tab-label">Win Rate</span>
                  </button>
                </div>

                {/* Leaderboard List */}
                <div className="leaderboard-list">
                {leaderboard.length === 0 ? (
                  <div className="no-data">
                    <div className="no-data-icon">🎮</div>
                    <h3>No Players Yet!</h3>
                    <p>Be the first to play and appear on the leaderboard!</p>
                    <p>Start playing to climb the ranks! 🚀</p>
                  </div>
                ) : (
                  getSortedLeaderboard().map((user, index) => {
                    const isCurrentUser = currentUserId && user.uid === currentUserId;
                    return (
                      <div 
                        key={user.uid} 
                        className={`leaderboard-item ${index < 3 ? 'top-three' : ''} ${isCurrentUser ? 'current-user' : ''}`}
                      >
                      <div className="rank-section">
                        <div 
                          className="rank-icon"
                          style={{ color: getRankColor(index) }}
                        >
                          {getRankIcon(index)}
                        </div>
                        <div className="rank-number">#{index + 1}</div>
                      </div>
                      
                      <div className="leaderboard-player-info">
                        <div className="player-name">{user.username}</div>
                        <div className="player-email">{user.email}</div>
                        <div className="online-status">
                          <span className={`status-dot ${user.isOnline ? 'online' : 'offline'}`}></span>
                          <span className="status-text">{user.isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                      
                      <div className="player-stats">
                        <div className="stat-item">
                          <div className="stat-icon">⚔️</div>
                          <div className="stat-content">
                            <div className="stat-value">{user.no?.['of wins'] || 0}</div>
                            <div className="stat-label">Wins</div>
                          </div>
                        </div>
                        
                        <div className="stat-item">
                          <div className="stat-icon">🎯</div>
                          <div className="stat-content">
                            <div className="stat-value">{user['total games played'] || 0}</div>
                            <div className="stat-label">Games</div>
                          </div>
                        </div>
                        
                        <div className="stat-item">
                          <div className="stat-icon">📊</div>
                          <div className="stat-content">
                            <div className="stat-value">{getWinRate(user)}%</div>
                            <div className="stat-label">Win Rate</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>

              </>
            )}
          </div>

          {/* Migoyugo Players Sidebar */}
          <div className="migoyugo-sidebar">
            <div className="sidebar-header">
              <h3>🎮 Migoyugo Players</h3>
            </div>
            
            <div className="sidebar-stats">
              <div className="sidebar-stat-item">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-value">{migoyugoStats.totalPlayers}</div>
                  <div className="stat-label">Total Players</div>
                </div>
              </div>
              
              <div className="sidebar-stat-item">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <div className="stat-value">{migoyugoStats.gamesToday}</div>
                  <div className="stat-label">Games Today</div>
                </div>
              </div>
              
              <div className="sidebar-stat-item">
                <div className="stat-icon">🟢</div>
                <div className="stat-content">
                  <div className="stat-value">{migoyugoStats.playingNow}</div>
                  <div className="stat-label">Playing Now</div>
                </div>
              </div>
            </div>
            
            <div className="sidebar-footer">
              <div className="live-indicator">
                <span className="live-dot"></span>
                <span>Live Stats</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Footer */}
        <div style={{
          padding: '20px',
          paddingLeft: '7.5%',
          textAlign: 'left',
          color: '#666',
          fontSize: '14px',
          marginTop: 'auto'
        }}>
          © 2025 Migoyugo. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
