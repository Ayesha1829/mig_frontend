import React, { useState } from 'react';
import { AuthService } from '../services/authService';

const StatsTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testRecordWin = async () => {
    setLoading(true);
    setResult('Testing win recording...');
    try {
      const response = await AuthService.recordGameResult('win');
      setResult(`Win recorded: ${response.success ? 'Success' : 'Failed - ' + response.error}`);
    } catch (error) {
      setResult(`Error: ${error}`);
    }
    setLoading(false);
  };




  const testRecordLoss = async () => {
    setLoading(true);
    setResult('Testing loss recording...');
    try {
      const response = await AuthService.recordGameResult('loss');
      setResult(`Loss recorded: ${response.success ? 'Success' : 'Failed - ' + response.error}`);
    } catch (error) {
      setResult(`Error: ${error}`);
    }
    setLoading(false);
  };

  const testGetStats = async () => {
    setLoading(true);
    setResult('Getting stats...');
    try {
      const response = await AuthService.getUserStats();
      if (response.stats) {
        setResult(`Stats: Wins: ${response.stats.wins}, Losses: ${response.stats.losses}, Draws: ${response.stats.draws}, Total: ${response.stats.totalGames}, Win Rate: ${response.stats.winRate}%`);
      } else {
        setResult(`Failed to get stats: ${response.error}`);
      }
    } catch (error) {
      setResult(`Error: ${error}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '2px solid #4A90E2', 
      borderRadius: '8px', 
      padding: '16px', 
      zIndex: 10000,
      maxWidth: '300px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <h3 style={{ margin: '0 0 12px 0', color: '#2d3748' }}>Stats Test</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        <button 
          onClick={testRecordWin}
          disabled={loading}
          style={{
            padding: '8px 12px',
            backgroundColor: '#48bb78',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          Test Record Win
        </button>
        
        <button 
          onClick={testRecordLoss}
          disabled={loading}
          style={{
            padding: '8px 12px',
            backgroundColor: '#f56565',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          Test Record Loss
        </button>
        
        <button 
          onClick={testGetStats}
          disabled={loading}
          style={{
            padding: '8px 12px',
            backgroundColor: '#4A90E2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          Get My Stats
        </button>
      </div>
      
      {result && (
        <div style={{ 
          fontSize: '12px', 
          color: '#4a5568', 
          background: '#f7fafc', 
          padding: '8px', 
          borderRadius: '4px',
          wordBreak: 'break-word'
        }}>
          {result}
        </div>
      )}
    </div>
  );
};

export default StatsTest;

