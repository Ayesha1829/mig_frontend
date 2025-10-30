// Advanced position evaluation
//import React from 'react';

// Types
interface Cell {
  color: 'white' | 'black' | null;
  isYugo: boolean;
  yugoType?: 'standard' | 'double' | 'triple' | 'quadruple';
}

// Helper functions that need to be imported from App.tsx
declare function countYugos(board: (Cell | null)[][], playerColor: 'white' | 'black'): number;
declare function isValidMove(board: (Cell | null)[][], row: number, col: number, playerColor: 'white' | 'black'): boolean;
declare function copyBoard(board: (Cell | null)[][]): (Cell | null)[][];
declare function checkForYugos(board: (Cell | null)[][], row: number, col: number, playerColor: 'white' | 'black'): any[];
declare function checkForIgo(board: (Cell | null)[][], row: number, col: number, playerColor: 'white' | 'black'): any;

const evaluatePosition = (board: (Cell | null)[][], playerColor: 'white' | 'black'): number => {
    const opponentColor = playerColor === 'white' ? 'black' : 'white';
    let score = 0;
    
    // 1. Material evaluation (yugos and their point values)
    const playerYugos = countYugos(board, playerColor);
    const opponentYugos = countYugos(board, opponentColor);
    score += (playerYugos - opponentYugos) * 100;
    
    // 2. Immediate threats (igo and yugo formations)
    score += evaluateThreats(board, playerColor);
    
    // 3. Positional factors
    score += evaluatePositional(board, playerColor);
    
    // 4. Strategic factors
    score += evaluateStrategic(board, playerColor);
    
    // 5. Tactical patterns
    score += evaluateTactical(board, playerColor);
    
    // 6. yugo building: reward longer yugos of own color
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const cell = board[row][col];
        if (cell && cell.color === playerColor) {
          // Check in all 4 directions for yugos
          const directions = [[1,0],[0,1],[1,1],[1,-1]];
          for (const [dr,dc] of directions) {
            let length = 1;
            let r = row + dr, c = col + dc;
            while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c]?.color === playerColor) {
              length++;
              r += dr; c += dc;
            }
            if (length >= 2) score += length * 12; // reward longer yugo
          }
        }
      }
    }
    
    return score;
  };
  
  const evaluateThreats = (board: (Cell | null)[][], playerColor: 'white' | 'black'): number => {
    let score = 0;
    const opponentColor = playerColor === 'white' ? 'black' : 'white';
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (!isValidMove(board, row, col, playerColor)) continue;
        
        // Test move for player
        const testBoard = copyBoard(board);
        testBoard[row][col] = { color: playerColor, isYugo: false };
        
        // Check for yugos
        const yugos = checkForYugos(testBoard, row, col, playerColor);
        if (yugos.length > 0) {
          score += 1000 * yugos.length; // Yugo formation bonus
        }
        
        // Check for igo (with yugo)
        testBoard[row][col] = { color: playerColor, isYugo: true, yugoType: 'standard' };
        const igo = checkForIgo(testBoard, row, col, playerColor);
        if (igo) {
          score += 10000; // Instant win
        }
        
        // Check blocking opponent threats
        const opponentTestBoard = copyBoard(board);
        opponentTestBoard[row][col] = { color: opponentColor, isYugo: false };
        const opponentYugos = checkForYugos(opponentTestBoard, row, col, opponentColor);
        if (opponentYugos.length > 0) {
          score += 800 * opponentYugos.length; // Block opponent yugos
        }
        
        opponentTestBoard[row][col] = { color: opponentColor, isYugo: true, yugoType: 'standard' };
        const opponentIgo = checkForIgo(opponentTestBoard, row, col, opponentColor);
        if (opponentIgo) {
          score += 9000; // Block opponent igo
        }
      }
    }
    
    return score;
  };
  
  const evaluatePositional = (board: (Cell | null)[][], playerColor: 'white' | 'black'): number => {
    let score = 0;
    const opponentColor = playerColor === 'white' ? 'black' : 'white';
    
    // Center control evaluation
    const centerSquares = [[3,3], [3,4], [4,3], [4,4]];
    for (const [row, col] of centerSquares) {
      const cell = board[row][col];
      if (cell?.color === playerColor) {
        score += 50;
      } else if (cell?.color === opponentColor) {
        score -= 50;
      }
    }
    
    // Extended center control
    const extendedCenter = [[2,2], [2,3], [2,4], [2,5], [3,2], [3,5], [4,2], [4,5], [5,2], [5,3], [5,4], [5,5]];
    for (const [row, col] of extendedCenter) {
      const cell = board[row][col];
      if (cell?.color === playerColor) {
        score += 20;
      } else if (cell?.color === opponentColor) {
        score -= 20;
      }
    }
    
    // Piece activity and mobility
    score += evaluateMobility(board, playerColor) - evaluateMobility(board, opponentColor);
    
    return score;
  };
  
  const evaluateMobility = (board: (Cell | null)[][], playerColor: 'white' | 'black'): number => {
    let mobility = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (isValidMove(board, row, col, playerColor)) {
          mobility++;
        }
      }
    }
    return mobility * 5; // Each possible move is worth 5 points
  };
  
  const evaluateStrategic = (board: (Cell | null)[][], playerColor: 'white' | 'black'): number => {
    let score = 0;
    
    // Connectivity bonus - pieces supporting each other
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const cell = board[row][col];
        if (cell?.color === playerColor) {
          let connections = 0;
          const directions = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
          
          for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
              const adjCell = board[newRow][newCol];
              if (adjCell?.color === playerColor) {
                connections++;
              }
            }
          }
          
          score += connections * 15; // Connectivity bonus
          
          // Yugo protection bonus
          if (cell.isYugo) {
            score += connections * 25; // Extra bonus for protecting yugos
          }
        }
      }
    }
    
    return score;
  };
  
  const evaluateTactical = (board: (Cell | null)[][], playerColor: 'white' | 'black'): number => {
    let score = 0;
    
    // Look for fork opportunities (moves that create multiple threats)
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (!isValidMove(board, row, col, playerColor)) continue;
        
        const testBoard = copyBoard(board);
        testBoard[row][col] = { color: playerColor, isYugo: false };
        
        let threats = 0;
        
        // Count potential yugos from this position
        const yugos = checkForYugos(testBoard, row, col, playerColor);
        threats += yugos.length;
        
        // Check if this move creates multiple line possibilities
        const directions = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
        for (const [dr, dc] of directions) {
          let lineLength = 1;
          
          // Count in positive direction
          let r = row + dr, c = col + dc;
          while (r >= 0 && r < 8 && c >= 0 && c < 8 && testBoard[r][c]?.color === playerColor) {
            lineLength++;
            r += dr;
            c += dc;
          }
          
          // Count in negative direction
          r = row - dr;
          c = col - dc;
          while (r >= 0 && r < 8 && c >= 0 && c < 8 && testBoard[r][c]?.color === playerColor) {
            lineLength++;
            r -= dr;
            c -= dc;
          }
          
          if (lineLength >= 3) {
            threats++;
          }
        }
        
        if (threats >= 2) {
          score += 200 * threats; // Fork bonus
        }
      }
    }
    
    return score;
  };

// Export all evaluation functions
export {
  evaluatePosition,
  evaluateThreats,
  evaluatePositional,
  evaluateMobility,
  evaluateStrategic,
  evaluateTactical
};