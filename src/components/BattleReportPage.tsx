import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';
import { FirestoreService, type GameRecord } from '../services/firestoreService';
import Sidebar from './Sidebar';
import './BattleReportPage.css';

interface BattleReportPageProps {
  user: {
    username: string;
    email: string;
  };
  onBack: () => void;
  onPlayClick: () => void;
  onHowToPlayClick: () => void;
  onHomeClick: () => void;
  onAboutClick?: () => void;  // Made optional since modal doesn't need it
  authState: {
    isAuthenticated: boolean;
    user: {
      username: string;
      email: string;
    } | null;
    isGuest: boolean;
  };
  onLogout: () => void;
  onSignInClick: () => void;
  onSignUpClick: () => void;
  isModal?: boolean;
}

interface BattleStats {
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winRate: number;
  winPercentage: number;
  winStreak: number;
}

const BattleReportPage: React.FC<BattleReportPageProps> = ({ 
  user, 
  onBack,
  onPlayClick,
  onHowToPlayClick,
  onHomeClick,
  onAboutClick,
  authState,
  onLogout,
  onSignInClick,
  onSignUpClick,
  isModal
}) => {
  const [stats, setStats] = useState<BattleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);

  useEffect(() => {
    fetchBattleStats();
  }, []);

  const fetchBattleStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { stats: userStats, error: statsError } = await AuthService.getUserStats();
      
      if (statsError) {
        setError(statsError);
        return;
      }

      if (userStats) {
        setStats(userStats);
      }

      // Fetch game history
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        const history = await FirestoreService.getGameHistory(currentUser.uid, 10);
        setGameHistory(history);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load battle stats');
    } finally {
      setLoading(false);
    }
  };

  const getWinRateColor = (percentage: number) => {
    if (percentage >= 80) return '#28a745'; // Green for high win rate
    if (percentage >= 60) return '#ffc107'; // Yellow for medium win rate
    if (percentage >= 40) return '#fd7e14'; // Orange for low win rate
    return '#dc3545'; // Red for very low win rate
  };

  const getWinRateEmoji = (percentage: number) => {
    if (percentage >= 80) return '🏆';
    if (percentage >= 60) return '🥇';
    if (percentage >= 40) return '🥈';
    return '🥉';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div 
      className="battle-report-page"
      style={isModal ? { 
        display: 'flex', 
        flexDirection: 'column',
        padding: 0, 
        maxWidth: 860, 
        width: '100%', 
        margin: '0 auto',
        height: '90vh',
        maxHeight: '90vh',
        overflow: 'hidden'
      } : undefined}
    >
      {!isModal && (
        <Sidebar 
          onPlayClick={onPlayClick}
          onHowToPlayClick={onHowToPlayClick}
          onHomeClick={onHomeClick}
          onAboutClick={onAboutClick || (() => {})}
          authState={authState}
          onLogout={onLogout}
          onSignInClick={onSignInClick}
          onSignUpClick={onSignUpClick}
          isMobileMenuOpen={isMobileMenuOpen}
          toggleMobileMenu={toggleMobileMenu}
          closeMobileMenu={closeMobileMenu}
        />
      )}
      <div className="battle-report-container" style={isModal ? { 
        marginLeft: 0, 
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      } : undefined}>
        {/* Header */}
        <div className="battle-report-header" style={isModal ? {
          padding: '10px 16px',
          marginBottom: '8px',
          flex: '0 0 auto'
        } : undefined}>
          {!isModal && (
            <button className="back-btn" onClick={onBack}>
              ← Back to Home
            </button>
          )}
          <h1 style={isModal ? { fontSize: '1.1rem', margin: 0 } : undefined}>
            <img 
              src="https://img.icons8.com/?size=100&id=iMOL8BuPplly&format=png&color=FFFFFF" 
              alt="Trophy" 
              style={isModal ? { width: '24px', height: '24px', verticalAlign: 'middle', marginRight: '8px', display: 'inline-block' } : { width: '40px', height: '40px', verticalAlign: 'middle', marginRight: '12px', display: 'inline-block' }}
            />
            STATISTICS
            <img 
              src="https://img.icons8.com/?size=100&id=iMOL8BuPplly&format=png&color=FFFFFF" 
              alt="Trophy" 
              style={isModal ? { width: '24px', height: '24px', verticalAlign: 'middle', marginLeft: '8px', display: 'inline-block' } : { width: '40px', height: '40px', verticalAlign: 'middle', marginLeft: '12px', display: 'inline-block' }}
            />
          </h1>
        </div>

        {/* Content */}
        <div className="battle-report-content" style={isModal ? {
          padding: '8px 12px',
          flex: '1 1 auto',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        } : undefined}>
          {loading ? (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <p>Analyzing battle data...</p>
            </div>
          ) : error ? (
            <div className="error-section">
              <p>❌ {error}</p>
              <button onClick={fetchBattleStats} className="retry-btn">
                🔄 Retry
              </button>
            </div>
          ) : stats ? (
            <>
              {/* Player Info */}
              <div className="stats-player-info" style={isModal ? {
                padding: '6px 10px',
                marginBottom: '8px',
                flex: '0 0 auto'
              } : undefined}>
                
                <h2 style={isModal ? { fontSize: '0.95rem', margin: 0 } : undefined}>🎮 Player: {user.username}</h2>
              </div>

              {/* Main Stats Grid */}
              <div className="stats-grid" style={isModal ? {
                gap: '8px',
                marginBottom: '8px',
                flex: '0 0 auto'
              } : undefined}>
                <div className="stat-card total-games" style={isModal ? { padding: '8px 10px' } : undefined}>
                  <div className="stat-icon" style={isModal ? { fontSize: '18px', marginBottom: '4px' } : undefined}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Add-Circle-Bold--Streamline-Ultimate" height={isModal ? "18" : "24"} width={isModal ? "18" : "24"}>
                      <desc>
                        Add Circle Bold Streamline Icon: https://streamlinehq.com
                      </desc>
                      <path fill="#c9f7ca" d="M11.9999 23.2044c6.1881 0 11.2045 -5.0164 11.2045 -11.2044S18.188 0.7956 11.9999 0.7956C5.812 0.7956 0.7956 5.812 0.7956 12S5.812 23.2044 11.9999 23.2044Z" stroke-width="1"></path>
                      <path fill="#78eb7b" d="M11.9999 20.1486c2.7074 0.0007 5.3236 -0.979 7.3645 -2.7578 2.041 -1.7789 3.369 -4.2366 3.7381 -6.9187 0.2064 1.5202 0.0985 3.0665 -0.3173 4.5433 -0.4157 1.4768 -1.1303 2.8524 -2.0994 4.0417 -0.9692 1.1892 -2.1722 2.167 -3.5345 2.8722 -1.3623 0.7053 -2.8551 1.1233 -4.3856 1.2282 -1.5307 0.1048 -3.0664 -0.1057 -4.5123 -0.6188 -1.4458 -0.5129 -2.7709 -1.3174 -3.8931 -2.3635 -1.1222 -1.046 -2.0177 -2.3113 -2.6308 -3.7176C1.1163 15.0514 0.7984 13.5342 0.7956 12c-0.0007 -0.5111 0.0334 -1.0214 0.1019 -1.5279 0.3692 2.6822 1.697 5.1399 3.738 6.9187 2.041 1.7788 4.6571 2.7585 7.3644 2.7578Z" stroke-width="1"></path>
                      <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M11.9999 23.2044c6.1881 0 11.2045 -5.0164 11.2045 -11.2044S18.188 0.7956 11.9999 0.7956C5.812 0.7956 0.7956 5.812 0.7956 12S5.812 23.2044 11.9999 23.2044Z" stroke-width="1"></path>
                      <path fill="#ffffff" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M19.1304 10.9813c0 -0.2701 -0.1074 -0.5292 -0.2984 -0.7202 -0.1909 -0.1909 -0.45 -0.2984 -0.7201 -0.2984h-4.0744V5.8884c0 -0.2701 -0.1073 -0.5292 -0.2983 -0.7202 -0.191 -0.191 -0.4502 -0.2983 -0.7203 -0.2983h-2.0371c-0.2701 0 -0.5293 0.1073 -0.7203 0.2983s-0.2983 0.4501 -0.2983 0.7202v4.0743H5.8889c-0.2702 0 -0.5293 0.1075 -0.7203 0.2984 -0.191 0.191 -0.2983 0.4501 -0.2983 0.7202v2.0372c0 0.2701 0.1073 0.5292 0.2983 0.7202 0.191 0.191 0.4501 0.2984 0.7203 0.2984h4.0743v4.0743c0 0.2702 0.1073 0.5293 0.2983 0.7203 0.191 0.1909 0.4501 0.2982 0.7203 0.2982h2.0371c0.2701 0 0.5292 -0.1073 0.7203 -0.2982 0.191 -0.191 0.2983 -0.4501 0.2983 -0.7203v-4.0743h4.0744c0.2701 0 0.5292 -0.1074 0.7201 -0.2984 0.191 -0.191 0.2984 -0.4501 0.2984 -0.7202v-2.0372Z" stroke-width="1"></path>
                    </svg>
                  </div>
                  <div className="stat-value" style={isModal ? { fontSize: '16px', marginBottom: '2px' } : undefined}>{stats.totalGames}</div>
                  <div className="stat-label" style={isModal ? { fontSize: '10px' } : undefined}>Total Games</div>
                </div>

                <div className="stat-card wins" style={isModal ? { padding: '8px 10px' } : undefined}>
                  <div className="stat-icon" style={isModal ? { fontSize: '18px', marginBottom: '4px' } : undefined}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Ranking-People-First--Streamline-Ultimate" height="24" width="24">
                      <desc>
                        Ranking People First Streamline Icon: https://streamlinehq.com
                      </desc>
                      <path fill="#ffbc44" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M22.5217 17.0317h-7.1739v-4.7826c0 -0.1268 -0.0504 -0.2485 -0.1401 -0.3381 -0.0896 -0.0897 -0.2113 -0.1401 -0.3381 -0.1401H9.13043c-0.12684 0 -0.24849 0.0504 -0.33818 0.1401 -0.08969 0.0896 -0.14008 0.2113 -0.14008 0.3381v4.7826H1.47826c-0.12684 0 -0.24849 0.0504 -0.33818 0.1401C1.05039 17.2615 1 17.3832 1 17.51v4.7826c0 0.1269 0.05039 0.2485 0.14008 0.3382 0.08969 0.0897 0.21134 0.1401 0.33818 0.1401H22.5217c0.1269 0 0.2485 -0.0504 0.3382 -0.1401S23 22.4195 23 22.2926V17.51c0 -0.1268 -0.0504 -0.2485 -0.1401 -0.3382s-0.2113 -0.1401 -0.3382 -0.1401Z" strokeWidth="1"></path>
                      <path fill="#e3e3e3" d="M7.69629 9.37965c0.01817 -0.52608 0.14443 -1.04261 0.37304 -1.518 0.264 -0.528 1.36592 -0.89339 2.74997 -1.40608 0.374 -0.1387 0.3138 -1.012 0.1473 -1.19374 -0.2635 -0.28618 -0.4637 -0.62481 -0.5873 -0.99372 -0.1237 -0.3689 -0.168 -0.75976 -0.1301 -1.14698 -0.0187 -0.24134 0.0127 -0.48395 0.0922 -0.7126 0.0795 -0.22864 0.2054 -0.43838 0.3698 -0.61604 0.1644 -0.17767 0.3638 -0.31942 0.5856 -0.41637 0.2218 -0.09695 0.4613 -0.14699 0.7034 -0.14699 0.242 0 0.4815 0.05004 0.7033 0.14699 0.2218 0.09695 0.4212 0.2387 0.5856 0.41637 0.1644 0.17766 0.2903 0.3874 0.3698 0.61604 0.0795 0.22865 0.1109 0.47126 0.0922 0.7126 0.0378 0.38721 -0.0066 0.77804 -0.1302 1.14693 -0.1236 0.36888 -0.3237 0.70752 -0.5872 0.99377 -0.1655 0.18269 -0.2267 1.05217 0.1473 1.19374 1.3841 0.51269 2.4869 0.87808 2.75 1.40608 0.2295 0.47444 0.3558 0.99192 0.374 1.518" strokeWidth="1"></path>
                      <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M7.69629 9.37965c0.01817 -0.52608 0.14443 -1.04261 0.37304 -1.518 0.264 -0.528 1.36592 -0.89339 2.74997 -1.40608 0.374 -0.1387 0.3138 -1.012 0.1473 -1.19374 -0.2635 -0.28618 -0.4637 -0.62481 -0.5873 -0.99372 -0.1237 -0.3689 -0.168 -0.75976 -0.1301 -1.14698 -0.0187 -0.24134 0.0127 -0.48395 0.0922 -0.7126 0.0795 -0.22864 0.2054 -0.43838 0.3698 -0.61604 0.1644 -0.17767 0.3638 -0.31942 0.5856 -0.41637 0.2218 -0.09695 0.4613 -0.14699 0.7034 -0.14699 0.242 0 0.4815 0.05004 0.7033 0.14699 0.2218 0.09695 0.4212 0.2387 0.5856 0.41637 0.1644 0.17766 0.2903 0.3874 0.3698 0.61604 0.0795 0.22865 0.1109 0.47126 0.0922 0.7126 0.0378 0.38721 -0.0066 0.77804 -0.1302 1.14693 -0.1236 0.36888 -0.3237 0.70752 -0.5872 0.99377 -0.1655 0.18269 -0.2267 1.05217 0.1473 1.19374 1.3841 0.51269 2.4869 0.87808 2.75 1.40608 0.2295 0.47444 0.3558 0.99192 0.374 1.518" strokeWidth="1"></path>
                      <path fill="#e3e3e3" d="M5.98539 14.1622c-0.4113 -0.1684 -0.89435 -0.3405 -1.41469 -0.5338 -0.374 -0.1387 -0.31374 -1.012 -0.14731 -1.1937 0.26359 -0.2862 0.46375 -0.6248 0.58737 -0.9937 0.12363 -0.3689 0.16794 -0.7598 0.13002 -1.147 0.02268 -0.2411 -0.00604 -0.48422 -0.08426 -0.71338 -0.07821 -0.22916 -0.20415 -0.43913 -0.36948 -0.61604 -0.16534 -0.1769 -0.36632 -0.31673 -0.58967 -0.41024 -0.22336 -0.09352 -0.46401 -0.13859 -0.70607 -0.13225 -0.24221 -0.00662 -0.48308 0.03825 -0.70666 0.13164 -0.22359 0.0934 -0.4248 0.23318 -0.59035 0.41012 -0.16555 0.17694 -0.29165 0.387 -0.36998 0.6163 -0.07833 0.2293 -0.10709 0.47265 -0.0844 0.71385 -0.03791 0.3872 0.00639 0.7781 0.13002 1.147 0.12363 0.3689 0.32379 0.7075 0.58737 0.9937 0.16548 0.1827 0.2267 1.0522 -0.1473 1.1937 -0.43809 0.1617 -0.84652 0.3099 -1.21 0.4525" strokeWidth="1"></path>
                      <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M5.98539 14.1622c-0.4113 -0.1684 -0.89435 -0.3405 -1.41469 -0.5338 -0.374 -0.1387 -0.31374 -1.012 -0.14731 -1.1937 0.26359 -0.2862 0.46375 -0.6248 0.58737 -0.9937 0.12363 -0.3689 0.16794 -0.7598 0.13002 -1.147 0.02268 -0.2411 -0.00604 -0.48422 -0.08426 -0.71338 -0.07821 -0.22916 -0.20415 -0.43913 -0.36948 -0.61604 -0.16534 -0.1769 -0.36632 -0.31673 -0.58967 -0.41024 -0.22336 -0.09352 -0.46401 -0.13859 -0.70607 -0.13225 -0.24221 -0.00662 -0.48308 0.03825 -0.70666 0.13164 -0.22359 0.0934 -0.4248 0.23318 -0.59035 0.41012 -0.16555 0.17694 -0.29165 0.387 -0.36998 0.6163 -0.07833 0.2293 -0.10709 0.47265 -0.0844 0.71385 -0.03791 0.3872 0.00639 0.7781 0.13002 1.147 0.12363 0.3689 0.32379 0.7075 0.58737 0.9937 0.16548 0.1827 0.2267 1.0522 -0.1473 1.1937 -0.43809 0.1617 -0.84652 0.3099 -1.21 0.4525" strokeWidth="1"></path>
                      <path fill="#e3e3e3" d="M18.0127 14.1623c0.4113 -0.1684 0.8943 -0.3405 1.4147 -0.5338 0.374 -0.1387 0.3137 -1.012 0.1473 -1.1937 -0.2636 -0.2862 -0.4638 -0.6248 -0.5874 -0.9937 -0.1236 -0.3689 -0.1679 -0.7598 -0.13 -1.147 -0.0187 -0.2413 0.0127 -0.48395 0.0922 -0.71259 0.0795 -0.22864 0.2054 -0.43838 0.3698 -0.61605 0.1644 -0.17766 0.3638 -0.31942 0.5856 -0.41637 0.2218 -0.09695 0.4612 -0.14699 0.7033 -0.14699 0.2421 0 0.4815 0.05004 0.7034 0.14699 0.2218 0.09695 0.4211 0.23871 0.5855 0.41637 0.1645 0.17767 0.2904 0.38741 0.3699 0.61605 0.0795 0.22864 0.1109 0.47129 0.0921 0.71259 0.0378 0.3872 -0.0065 0.778 -0.1302 1.1469 -0.1236 0.3689 -0.3237 0.7076 -0.5872 0.9938 -0.1654 0.1827 -0.2267 1.0522 0.1473 1.1937 0.4381 0.1617 0.8466 0.31 1.211 0.4525" strokeWidth="1"></path>
                      <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M18.0127 14.1623c0.4113 -0.1684 0.8943 -0.3405 1.4147 -0.5338 0.374 -0.1387 0.3137 -1.012 0.1473 -1.1937 -0.2636 -0.2862 -0.4638 -0.6248 -0.5874 -0.9937 -0.1236 -0.3689 -0.1679 -0.7598 -0.13 -1.147 -0.0187 -0.2413 0.0127 -0.48395 0.0922 -0.71259 0.0795 -0.22864 0.2054 -0.43838 0.3698 -0.61605 0.1644 -0.17766 0.3638 -0.31942 0.5856 -0.41637 0.2218 -0.09695 0.4612 -0.14699 0.7033 -0.14699 0.2421 0 0.4815 0.05004 0.7034 0.14699 0.2218 0.09695 0.4211 0.23871 0.5855 0.41637 0.1645 0.17767 0.2904 0.38741 0.3699 0.61605 0.0795 0.22864 0.1109 0.47129 0.0921 0.71259 0.0378 0.3872 -0.0065 0.778 -0.1302 1.1469 -0.1236 0.3689 -0.3237 0.7076 -0.5872 0.9938 -0.1654 0.1827 -0.2267 1.0522 0.1473 1.1937 0.4381 0.1617 0.8466 0.31 1.211 0.4525" strokeWidth="1"></path>
                    </svg>
                  </div>
                  <div className="stat-value" style={isModal ? { fontSize: '16px', marginBottom: '2px' } : undefined}>{stats.wins}</div>
                  <div className="stat-label" style={isModal ? { fontSize: '10px' } : undefined}>Wins</div>
                </div>

                <div className="stat-card losses" style={isModal ? { padding: '8px 10px' } : undefined}>
                  <div className="stat-icon" style={isModal ? { fontSize: '18px', marginBottom: '4px' } : undefined}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Graph-Stats-Descend--Streamline-Ultimate" height="24" width="24">
                      <desc>
                        Graph Stats Descend Streamline Icon: https://streamlinehq.com
                      </desc>
                      <path fill="#ffbfc5" d="M11.9998 22.9319c6.0376 0 10.9319 -4.8943 10.9319 -10.9319 0 -6.0375 -4.8943 -10.9318 -10.9319 -10.9318C5.9623 1.0682 1.068 5.9625 1.068 12c0 6.0376 4.8943 10.9319 10.9318 10.9319Z" stroke-width="1"></path>
                      <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="m0.8079 5.4929 7.6377 8.5893c0.1868 0.2063 0.4457 0.3328 0.7232 0.3536 0.2775 0.0208 0.5523 -0.066 0.7677 -0.2422l4.6476 -3.873c0.2152 -0.1761 0.4901 -0.2625 0.7674 -0.2412 0.2773 0.0214 0.5356 0.1488 0.7215 0.3557l7.1191 8.0688" stroke-width="1"></path>
                      <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M15.9683 18.5071h7.2235v-6.225" stroke-width="1"></path>
                    </svg>
                  </div>
                  <div className="stat-value" style={isModal ? { fontSize: '16px', marginBottom: '2px' } : undefined}>{stats.losses}</div>
                  <div className="stat-label" style={isModal ? { fontSize: '10px' } : undefined}>Defeats</div>
                </div>

                <div className="stat-card draws" style={isModal ? { padding: '8px 10px' } : undefined}>
                  <div className="stat-icon" style={isModal ? { fontSize: '18px', marginBottom: '4px' } : undefined}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Cursor-Hand-2--Streamline-Ultimate" height="24" width="24">
                      <desc>
                        Cursor Hand 2 Streamline Icon: https://streamlinehq.com
                      </desc>
                      <path fill="#ffdda1" d="M17.533 12.2602v-4.685c0 -0.4142 0.1644 -0.8114 0.4573 -1.1043 0.2928 -0.2929 0.6901 -0.4574 1.1044 -0.4574 0.4141 0 0.8114 0.1645 1.1042 0.4574 0.2929 0.2929 0.4574 0.6901 0.4574 1.1043v10.4112c0 1.3807 -0.5484 2.7047 -1.5247 3.6809 -0.9762 0.9763 -2.3003 1.5247 -3.6809 1.5247h-3.4722c-0.8769 -0.0005 -1.7396 -0.222 -2.5081 -0.6444 -0.7686 -0.4224 -1.4181 -1.0319 -1.8885 -1.772 -1.7929 -2.8235 -4.0157 -7.4743 -4.0157 -7.4743 -0.1726 -0.2489 -0.2488 -0.5522 -0.2145 -0.8533 0.0344 -0.3011 0.1769 -0.5793 0.4012 -0.7831 0.2243 -0.2037 0.5149 -0.319 0.8179 -0.3245 0.3029 -0.0053 0.5975 0.0995 0.8289 0.2951l2.7652 3.2275V4.4518c0 -0.4142 0.1645 -0.8114 0.4574 -1.1043 0.2929 -0.2928 0.6901 -0.4574 1.1043 -0.4574s0.8114 0.1646 1.1043 0.4574c0.2928 0.2929 0.4574 0.6901 0.4574 1.1043V2.3696c0 -0.4142 0.1645 -0.8114 0.4574 -1.1043S12.4358 0.8079 12.85 0.8079s0.8114 0.1645 1.1043 0.4574c0.2928 0.2929 0.4574 0.6901 0.4574 1.1043v2.0822c0 -0.4142 0.1644 -0.8114 0.4574 -1.1043 0.2929 -0.2928 0.69 -0.4574 1.1043 -0.4574s0.8114 0.1646 1.1043 0.4574c0.2928 0.2929 0.4574 0.6901 0.4574 1.1043v7.8084h-0.0021Z" stroke-width="1"></path>
                      <path fill="#ffdda1" d="M11.2863 10.4008V4.4519c0 -0.4142 -0.1645 -0.8114 -0.4575 -1.1043 -0.2928 -0.2929 -0.69 -0.4574 -1.1042 -0.4574 -0.4142 0 -0.8114 0.1645 -1.1043 0.4574 -0.2928 0.2929 -0.4574 0.6901 -0.4574 1.1043v6.8819c1 -0.4352 2.0487 -0.7484 3.1234 -0.933Z" stroke-width="1"></path>
                      <path fill="#ffdda1" d="M13.8891 10.178c2.3618 -0.0272 4.6913 0.5499 6.7673 1.6762v-4.279c0.0007 -0.2051 -0.039 -0.4083 -0.1168 -0.598 -0.0779 -0.1898 -0.1924 -0.3623 -0.3369 -0.5078 -0.1446 -0.1455 -0.3163 -0.2611 -0.5055 -0.3402 -0.1892 -0.0791 -0.3922 -0.1202 -0.5972 -0.1209 -0.2051 -0.0007 -0.4083 0.039 -0.5981 0.1169 -0.1897 0.0778 -0.3623 0.1923 -0.5078 0.3368 -0.1455 0.1446 -0.2611 0.3163 -0.3402 0.5055 -0.0791 0.1893 -0.1201 0.3922 -0.1208 0.5973v-3.113c0 -0.4142 -0.1646 -0.8114 -0.4575 -1.1043 -0.2928 -0.2928 -0.6901 -0.4574 -1.1042 -0.4574 -0.4142 0 -0.8114 0.1646 -1.1043 0.4574 -0.2929 0.2929 -0.4574 0.6901 -0.4574 1.1043V2.3696c0 -0.4142 -0.1646 -0.8114 -0.4575 -1.1043 -0.2928 -0.2929 -0.6901 -0.4574 -1.1042 -0.4574 -0.4142 0 -0.8114 0.1645 -1.1043 0.4574s-0.4574 0.6901 -0.4574 1.1043v8.0312c0.8596 -0.1485 1.7304 -0.2232 2.6027 -0.2228Z" stroke-width="1"></path>
                      <path stroke="#191919" stroke-linecap="round" stroke-linejoin="round" d="M11.2874 4.4518V2.3696c0 -0.4142 0.1645 -0.8114 0.4574 -1.1043 0.2928 -0.2929 0.6901 -0.4574 1.1042 -0.4574 0.4143 0 0.8116 0.1645 1.1044 0.4574 0.2929 0.2929 0.4573 0.6901 0.4573 1.1043v2.0822" stroke-width="1"></path>
                      <path stroke="#191919" stroke-linecap="round" stroke-linejoin="round" d="M14.4107 10.6986V4.4519c0 -0.4142 0.1646 -0.8114 0.4575 -1.1043 0.2928 -0.2929 0.6901 -0.4574 1.1042 -0.4574 0.4142 0 0.8115 0.1645 1.1043 0.4574 0.2929 0.2929 0.4574 0.6901 0.4574 1.1043v3.1233" stroke-width="1"></path>
                      <path stroke="#191919" stroke-linecap="round" stroke-linejoin="round" d="M17.533 12.2603V7.5752c0 -0.4141 0.1644 -0.8114 0.4573 -1.1042 0.2928 -0.2929 0.6901 -0.4574 1.1044 -0.4574 0.4141 0 0.8114 0.1645 1.1042 0.4574 0.2929 0.2928 0.4574 0.69 0.4574 1.1042v10.4113c0 1.3806 -0.5484 2.7046 -1.5247 3.681 -0.9762 0.9762 -2.3003 1.5246 -3.6809 1.5246h-3.4722c-0.8769 -0.0004 -1.7396 -0.2221 -2.5081 -0.6445 -0.7686 -0.4224 -1.4181 -1.0319 -1.8885 -1.772 -1.7929 -2.8235 -4.0157 -7.4741 -4.0157 -7.4741 -0.1726 -0.2491 -0.2488 -0.5524 -0.2145 -0.8534 0.0344 -0.301 0.1769 -0.5794 0.4012 -0.7832 0.2243 -0.2036 0.5149 -0.319 0.8179 -0.3243 0.3029 -0.0055 0.5975 0.0993 0.8289 0.295l2.7652 3.2276V4.4519c0 -0.4142 0.1645 -0.8114 0.4574 -1.1043 0.2929 -0.2929 0.6901 -0.4574 1.1043 -0.4574s0.8114 0.1645 1.1043 0.4574c0.2928 0.2929 0.4574 0.6901 0.4574 1.1043v6.2467" stroke-width="1"></path>
                    </svg>
                  </div>
                  <div className="stat-value" style={isModal ? { fontSize: '16px', marginBottom: '2px' } : undefined}>{stats.draws}</div>
                  <div className="stat-label" style={isModal ? { fontSize: '10px' } : undefined}>Draws</div>
                </div>
              </div>

              {/* Win Rate Section */}
              <div className="win-rate-section" style={isModal ? { marginBottom: '8px', flex: '0 0 auto' } : undefined}>
                <div className="win-rate-card" style={isModal ? { padding: '10px 14px' } : undefined}>
                  <div className="win-rate-header" style={isModal ? { marginBottom: '6px' } : undefined}>
                    <span className="win-rate-emoji" style={isModal ? { fontSize: '18px' } : undefined}>{getWinRateEmoji(stats.winPercentage)}</span>
                    <h3 style={isModal ? { fontSize: '0.95rem', margin: 0 } : undefined}>Victory Rate</h3>
                  </div>
                  <div 
                    className="win-rate-value"
                    style={isModal ? { 
                      fontSize: '20px', 
                      marginBottom: '6px', 
                      color: getWinRateColor(stats.winPercentage) 
                    } : { color: getWinRateColor(stats.winPercentage) }}
                  >
                    {stats.winPercentage.toFixed(1)}%
                  </div>
                  <div className="win-rate-bar" style={isModal ? { height: '10px' } : undefined}>
                    <div 
                      className="win-rate-fill"
                      style={{ 
                        width: `${Math.min(stats.winPercentage, 100)}%`,
                        backgroundColor: getWinRateColor(stats.winPercentage)
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Recent Match History */}
              {gameHistory.length > 0 && (
                <div className="game-history-section" style={isModal ? {
                  marginTop: '8px',
                  flex: '0 0 auto',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '180px',
                  minHeight: 0
                } : { marginTop: '20px' }}>
                  <h3 style={isModal ? { 
                    color: '#2c3e50', 
                    marginBottom: '6px',
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                    flex: '0 0 auto'
                  } : { 
                    color: '#2c3e50', 
                    marginBottom: '15px',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}>
                    📜 Recent Matches
                  </h3>
                  <div className="game-history-list" style={isModal ? {
                    overflowY: 'auto',
                    flex: '1 1 auto',
                    minHeight: 0,
                    maxHeight: '150px',
                    paddingRight: '4px'
                  } : undefined}>
                    {gameHistory.map((game, index) => (
                      <div 
                        key={game.gameId || index} 
                        className="game-history-item"
                        style={isModal ? {
                          background: game.result === 'win' ? '#e8f5e8' : 
                                     game.result === 'loss' ? '#f8d7da' : '#fff3cd',
                          border: `2px solid ${game.result === 'win' ? '#c3e6cb' : 
                                               game.result === 'loss' ? '#f1b0b7' : '#ffeaa7'}`,
                          borderRadius: '6px',
                          padding: '6px 8px',
                          marginBottom: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        } : {
                          background: game.result === 'win' ? '#e8f5e8' : 
                                     game.result === 'loss' ? '#f8d7da' : '#fff3cd',
                          border: `2px solid ${game.result === 'win' ? '#c3e6cb' : 
                                               game.result === 'loss' ? '#f1b0b7' : '#ffeaa7'}`,
                          borderRadius: '8px',
                          padding: '12px 15px',
                          marginBottom: '10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={isModal ? { 
                            fontWeight: 'bold', 
                            color: game.result === 'win' ? '#155724' : 
                                   game.result === 'loss' ? '#721c24' : '#856404',
                            marginBottom: '2px',
                            fontSize: '0.85rem'
                          } : { 
                            fontWeight: 'bold', 
                            color: game.result === 'win' ? '#155724' : 
                                   game.result === 'loss' ? '#721c24' : '#856404',
                            marginBottom: '4px'
                          }}>
                            {game.result === 'win' ? '🏆 Victory' : 
                             game.result === 'loss' ? '💔 Defeat' : '🤝 Draw'}
                          </div>
                          <div style={isModal ? { fontSize: '0.75rem', color: '#666' } : { fontSize: '0.9rem', color: '#666' }}>
                            vs <strong>{game.opponent}</strong>
                          </div>
                          <div style={isModal ? { fontSize: '0.7rem', color: '#888', marginTop: '1px' } : { fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>
                            Played as {game.playerColor === 'white' ? '⚪ White' : '⚫ Black'}
                          </div>
                        </div>
                        <div style={isModal ? { 
                          fontSize: '0.65rem', 
                          color: '#999',
                          textAlign: 'right'
                        } : { 
                          fontSize: '0.75rem', 
                          color: '#999',
                          textAlign: 'right'
                        }}>
                          {game.timestamp?.toDate ? 
                            game.timestamp.toDate().toLocaleDateString() : 
                            'Recent'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Game Summary */}
              <div className="battle-summary" style={isModal ? { 
                padding: '8px 10px', 
                marginTop: '8px',
                flex: '0 0 auto'
              } : undefined}>
                <h3 style={isModal ? { fontSize: '0.9rem', margin: '0 0 6px 0' } : undefined}>📊 Game Summary</h3>
                <div className="summary-stats">
                  <div className="summary-item" style={isModal ? { padding: '6px 8px' } : undefined}>
                    <span className="summary-label" style={isModal ? { fontSize: '0.8rem' } : undefined}>Current Win Streak:</span>
                    <span className="summary-value" style={isModal ? { fontSize: '0.8rem' } : undefined}>
                      {stats.winStreak > 0 ? `🔥 ${stats.winStreak} in a row!` : '💪 Start your streak!'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-stats">
              <p>🎮 No battle data yet!</p>
              <p>Start playing to build your battle report!</p>
            </div>
          )}
        </div>

        {/* Copyright Footer */}
        {!isModal && (
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
        )}
      </div>
    </div>
  );
};

export default BattleReportPage;
