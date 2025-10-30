'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
//import { getDatabase } from 'firebase/database';
//import { app } from './firebase';
//import io, { Socket } from 'socket.io-client';
import io from 'socket.io-client';
import TutorialDemo from './components/Demo';
import LandingPage from './components/LandingPage';
import BattleReportPage from './components/BattleReportPage';
import LeaderboardPage from './components/LeaderboardPage';
import AboutPage from './components/AboutPage';
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';
import { AuthService } from './services/authService';
import { FirestoreService } from './services/firestoreService';
//import { collection, addDoc, getFirestore } from 'firebase/firestore';
//import { getAuth } from "firebase/auth"
import { 
  handleLogin, 
  handleSignup, 
  handlePlayAsGuest, 
  handleViewStats,
  getApiUrl 
} from './components/Authentication';
import {
  evaluatePosition,
 
  
} from './components/Evaluation';
import './migoyugo-styles.css';

// Types
interface Cell {
  color: 'white' | 'black' | null;
  isYugo: boolean;
  yugoType?: 'standard' | 'double' | 'triple' | 'quadruple';
}

interface GameState {
  board: (Cell | null)[][];
  currentPlayer: 'white' | 'black';
  scores: { white: number; black: number };
  gameStatus: 'waiting' | 'active' | 'finished';
  lastMove: { row: number; col: number; player: 'white' | 'black' } | null;
  players: { white: string; black: string };
  igoLine?: { row: number; col: number }[] | null;
}

interface MoveHistoryEntry {
  row: number;
  col: number;
  player: 'white' | 'black';
  yugos: number;
  moveNumber: number;
}

// Authentication types
interface User {
  id: string;
  username: string;
  email: string;
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
  };
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isGuest: boolean;
}

//const db = getDatabase(app);

//const auth = getAuth(app);
//demo function forchecking authorization
// const signupuser=()=>{
//   createUserWithEmailAndPassword(auth, 'test@test.com', 'password123')
//   .then((userCredential) => {
//     const user = userCredential.user;
//     console.log(user);
//   })
// }


//const db = getFirestore(app);
// const writedata=async()=>{
//   const result = await addDoc(collection(db, 'players'), {
//     username: 'John Doe',
//     email: 'john.doe@example.com',
//     password: 'password123'
//   });
  // setDoc(doc(db, 'users', '1'), {
  //   username: 'John Doe',
  //   email: 'john.doe@example.com',
  //   password: 'password123'
  // });
//   console.log(result);
// }
const INITIAL_BOARD: (Cell | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

//demo function for checking realtime db
// const putDatav=()=>{
//   set(ref(db, 'users/1'), {
//     username: 'John Doe',
//     email: 'john.doe@example.com',
//     password: 'password123'
//   });
// }
// Local game logic functions
const isValidMove = (board: (Cell | null)[][], row: number, col: number, playerColor: 'white' | 'black'): boolean => {
  if (row < 0 || row >= 8 || col < 0 || col >= 8) return false;
  if (board[row][col] !== null) return false;
  return !wouldCreateLineTooLong(board, row, col, playerColor);
};

const wouldCreateLineTooLong = (board: (Cell | null)[][], row: number, col: number, playerColor: 'white' | 'black'): boolean => {
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  for (const [dr, dc] of directions) {
    let count = 1;
    
    // Count in positive direction
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && 
           board[r][c] && board[r][c]!.color === playerColor) {
      count++;
      r += dr;
      c += dc;
    }
    
    // Count in negative direction
    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && 
           board[r][c] && board[r][c]!.color === playerColor) {
      count++;
      r -= dr;
      c -= dc;
    }
    
    if (count > 4) return true;
  }
  
  return false;
};

const checkForYugos = (board: (Cell | null)[][], row: number, col: number, playerColor: 'white' | 'black') => {
  const directions = [
    [-1, 0],  // up
    [-1, 1],  // up-right diagonal  
    [0, 1],   // right
    [1, 1]    // down-right diagonal
  ];
  
  const yugos = [];
  
  for (const [dr, dc] of directions) {
    const line = [{row, col}];
    
    // Collect in positive direction
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && 
           board[r][c] && board[r][c]!.color === playerColor) {
      line.push({row: r, col: c});
      r += dr;
      c += dc;
    }
    
    // Collect in negative direction
    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && 
           board[r][c] && board[r][c]!.color === playerColor) {
      line.unshift({row: r, col: c});
      r -= dr;
      c -= dc;
    }
    
    if (line.length === 4) {
      yugos.push(line);
    }
  }
  
  return yugos;
};

const processYugos = (board: (Cell | null)[][], yugos: any[], row: number, col: number) => {
  if (yugos.length === 0) return { yugoType: null, removedCells: [] };
  
  const removedCells: {row: number, col: number}[] = [];
  
        // Remove dots from yugos (except yugos and the new placement)
  yugos.forEach(yugo => {
    yugo.forEach((cell: {row: number, col: number}) => {
      if (!(cell.row === row && cell.col === col) && 
          board[cell.row][cell.col] && 
          !board[cell.row][cell.col]!.isYugo) {
        removedCells.push({row: cell.row, col: cell.col});
        board[cell.row][cell.col] = null;
      }
    });
  });
  
  // Determine yugo type based on number of yugos
  let yugoType: 'standard' | 'double' | 'triple' | 'quadruple' = 'standard';
  if (yugos.length === 2) yugoType = 'double';
  else if (yugos.length === 3) yugoType = 'triple';
  else if (yugos.length === 4) yugoType = 'quadruple';
  
  return { yugoType, removedCells };
};

const checkForIgo = (board: (Cell | null)[][], row: number, col: number, playerColor: 'white' | 'black') => {
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  for (const [dr, dc] of directions) {
    const line = [{row, col}];
    
    // Collect in positive direction
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && 
           board[r][c] && board[r][c]!.isYugo && board[r][c]!.color === playerColor) {
      line.push({row: r, col: c});
      r += dr;
      c += dc;
    }
    
    // Collect in negative direction
    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && 
           board[r][c] && board[r][c]!.isYugo && board[r][c]!.color === playerColor) {
      line.unshift({row: r, col: c});
      r -= dr;
      c -= dc;
    }
    
    if (line.length === 4) {
      return line;
    }
  }
  
  return null;
};

const hasLegalMoves = (board: (Cell | null)[][], playerColor: 'white' | 'black'): boolean => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (isValidMove(board, row, col, playerColor)) {
        return true;
      }
    }
  }
  return false;
};

const countYugos = (board: (Cell | null)[][], playerColor: 'white' | 'black'): number => {
  let count = 0;
  console.log(`DEBUG: Counting yugos for ${playerColor}`);
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board[row][col];
      if (cell && cell.isYugo && cell.color === playerColor) {
        // Count yugo value based on its type
        let yugoValue = 1; // default
        switch (cell.yugoType) {
          case 'standard':
            yugoValue = 1;
            break;
          case 'double':
            yugoValue = 2;
            break;
          case 'triple':
            yugoValue = 3;
            break;
          case 'quadruple':
            yugoValue = 4;
            break;
          default:
            yugoValue = 1; // fallback for yugos without yugoType
        }
        console.log(`DEBUG: Yugo at ${row},${col} type=${cell.yugoType} value=${yugoValue}`);
        count += yugoValue;
      }
    }
  }
  console.log(`DEBUG: Total count for ${playerColor}: ${count}`);
  return count;
};

// Transposition Table for position caching
interface TranspositionEntry {
  hash: string;
  depth: number;
  score: number;
  flag: 'exact' | 'lowerbound' | 'upperbound';
  bestMove: {row: number, col: number} | null;
  age: number;
}

class TranspositionTable {
  private table = new Map<string, TranspositionEntry>();
  private maxSize = 100000; // Limit memory usage
  private currentAge = 0;

  get(hash: string): TranspositionEntry | null {
    return this.table.get(hash) || null;
  }

  set(hash: string, entry: TranspositionEntry): void {
    entry.age = this.currentAge;
    
    if (this.table.size >= this.maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.table.entries());
      entries.sort((a, b) => a[1].age - b[1].age);
      const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.1));
      toRemove.forEach(([key]) => this.table.delete(key));
    }
    
    this.table.set(hash, entry);
  }

  clear(): void {
    this.table.clear();
    this.currentAge++;
  }
}

// Helper functions
const copyBoard = (board: (Cell | null)[][]) => board.map(r => [...r]);

const getAllValidMoves = (board: (Cell | null)[][], playerColor: 'white' | 'black'): {row: number, col: number}[] => {
  const moves = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (isValidMove(board, row, col, playerColor)) {
        moves.push({row, col});
      }
    }
  }
  return moves;
};

const makeMove = (board: (Cell | null)[][], row: number, col: number, playerColor: 'white' | 'black'): (Cell | null)[][] => {
  const newBoard = board.map(r => [...r]);
  newBoard[row][col] = { color: playerColor, isYugo: false };
  
  // Process yugos if any
  const yugos = checkForYugos(newBoard, row, col, playerColor);
  if (yugos.length > 0) {
    const result = processYugos(newBoard, yugos, row, col);
    if (result.yugoType) {
      newBoard[row][col] = { color: playerColor, isYugo: true, yugoType: result.yugoType };
    }
  }
  
  return newBoard;
};

// Minimax with Alpha-Beta Pruning
const minimax = (
  board: (Cell | null)[][], 
  depth: number, 
  alpha: number, 
  beta: number, 
  isMaximizing: boolean, 
  playerColor: 'white' | 'black',
  transTable: TranspositionTable
): {score: number, bestMove: {row: number, col: number} | null} => {
  console.log('minimax: starting at depth', depth);
  // Generate position hash for transposition table
  const positionHash = JSON.stringify(board);
  const ttEntry = transTable.get(positionHash);
  
  if (ttEntry && ttEntry.depth >= depth) {
    if (ttEntry.flag === 'exact') {
      return {score: ttEntry.score, bestMove: ttEntry.bestMove};
    } else if (ttEntry.flag === 'lowerbound' && ttEntry.score >= beta) {
      return {score: ttEntry.score, bestMove: ttEntry.bestMove};
    } else if (ttEntry.flag === 'upperbound' && ttEntry.score <= alpha) {
      return {score: ttEntry.score, bestMove: ttEntry.bestMove};
    }
  }
  
  // Base case -> use quiescence search to resolve tactical volatility
  if (depth === 0) {
    const currentColorAtYugo = isMaximizing ? playerColor : (playerColor === 'white' ? 'black' : 'white');
    const q = quiescence(board, alpha, beta, currentColorAtYugo, playerColor, isMaximizing, 0, 4);
    return {score: q.score, bestMove: null};
  }
  
  const currentColor = isMaximizing ? playerColor : (playerColor === 'white' ? 'black' : 'white');
  const moves = getAllValidMoves(board, currentColor);
  
  if (moves.length === 0) {
    const score = evaluatePosition(board, playerColor);
    return {score, bestMove: null};
  }
  
  // Move ordering - prioritize center moves and high-value squares
  moves.sort((a, b) => {
    const aScore = evaluateMove(board, a.row, a.col, currentColor, 'ai-4');
    const bScore = evaluateMove(board, b.row, b.col, currentColor, 'ai-4');
    return bScore - aScore;
  });
  
  let bestMove: {row: number, col: number} | null = null;
  let bestScore = isMaximizing ? -Infinity : Infinity;
  
  for (const move of moves) {
    const newBoard = makeMove(board, move.row, move.col, currentColor);
    const result = minimax(newBoard, depth - 1, alpha, beta, !isMaximizing, playerColor, transTable);
    
    if (isMaximizing) {
      if (result.score > bestScore) {
        bestScore = result.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, result.score);
    } else {
      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = move;
      }
      beta = Math.min(beta, result.score);
    }
    
    if (beta <= alpha) {
      break; // Alpha-beta pruning
    }
  }
  
  // Store in transposition table
  const flag = bestScore <= alpha ? 'upperbound' : bestScore >= beta ? 'lowerbound' : 'exact';
  transTable.set(positionHash, {
    hash: positionHash,
    depth,
    score: bestScore,
    flag,
    bestMove,
    age: 0
  });
  
  return {score: bestScore, bestMove};
};

// Global transposition table instance
const globalTransTable = new TranspositionTable();

// --- Quiescence Search & Tactical Move Generation for AI-4 ---
function quiescence(
  board: (Cell | null)[][],
  alpha: number,
  beta: number,
  currentTurnColor: 'white' | 'black',
  evalColor: 'white' | 'black',
  isMaximizing: boolean,
  qDepth: number,
  maxQDepth: number
): { score: number } {
  // Stand-pat evaluation
  const standPat = evaluatePosition(board, evalColor);

  if (isMaximizing) {
    if (standPat >= beta) return { score: standPat };
    if (standPat > alpha) alpha = standPat;
  } else {
    if (standPat <= alpha) return { score: standPat };
    if (standPat < beta) beta = standPat;
  }

  if (qDepth >= maxQDepth) return { score: standPat };

  const tacticalMoves = getTacticalMoves(board, currentTurnColor);
  if (tacticalMoves.length === 0) return { score: standPat };

  let best = standPat;
  for (const move of tacticalMoves) {
    const newBoard = makeMove(board, move.row, move.col, currentTurnColor);
    const nextColor: 'white' | 'black' = currentTurnColor === 'white' ? 'black' : 'white';
    const child = quiescence(newBoard, alpha, beta, nextColor, evalColor, !isMaximizing, qDepth + 1, maxQDepth);

    if (isMaximizing) {
      if (child.score > best) best = child.score;
      if (best > alpha) alpha = best;
    } else {
      if (child.score < best) best = child.score;
      if (best < beta) beta = best;
    }
    if (beta <= alpha) break;
  }
  return { score: best };
}

function getTacticalMoves(
  board: (Cell | null)[][],
  playerColor: 'white' | 'black'
): { row: number; col: number }[] {
  const opponentColor: 'white' | 'black' = playerColor === 'white' ? 'black' : 'white';
  const all = getAllValidMoves(board, playerColor);
  const result: { row: number; col: number }[] = [];

  // Precompute opponent immediate Igo threats to allow blocking
  const opponentThreatSquares = new Set<string>();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (!isValidMove(board, r, c, opponentColor)) continue;
      const oppBoard = copyBoard(board);
      oppBoard[r][c] = { color: opponentColor, isYugo: true, yugoType: 'standard' };
      if (checkForIgo(oppBoard, r, c, opponentColor)) {
        opponentThreatSquares.add(`${r},${c}`);
      }
    }
  }
  

  for (const move of all) {
    const testBoard = copyBoard(board);
    // 1) Creating unbroken line of 4 (yugos) is tactical
    testBoard[move.row][move.col] = { color: playerColor, isYugo: false };
    const vecs = checkForYugos(testBoard, move.row, move.col, playerColor);
    if (vecs.length > 0) {
      result.push(move);
      continue;
    }

    // 2) Immediate Igo by making this cell a yugo
    testBoard[move.row][move.col] = { color: playerColor, isYugo: true, yugoType: 'standard' };
    if (checkForIgo(testBoard, move.row, move.col, playerColor)) {
      result.push(move);
      continue;
    }

    // 3) Blocks opponent immediate Igo (if opponent could win by playing here)
    if (opponentThreatSquares.has(`${move.row},${move.col}`)) {
      result.push(move);
      continue;
    }
  }
  return result;
}

// Helper function: Detects if placing a piece at (row, col) for playerColor creates three connected yugos with open ends
// const createsDoubleEndedYugoThreat = (board: (Cell | null)[][], row: number, col: number, playerColor: 'white' | 'black'): boolean => {
//   const directions = [
//     [0, 1], [1, 0], [1, 1], [1, -1]
//   ];
//   for (const [dr, dc] of directions) {
//     let count = 1;
//     let ends = [false, false];
//     // Forward direction
//     let r = row + dr, c = col + dc;
//     while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c]?.color === playerColor && board[r][c]?.isYugo) {
//       count++;
//       r += dr;
//       c += dc;
//     }
//     if (r >= 0 && r < 8 && c >= 0 && c < 8 && !board[r][c]) ends[0] = true;
//     // Backward direction
//     r = row - dr; c = col - dc;
//     while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c]?.color === playerColor && board[r][c]?.isYugo) {
//       count++;
//       r -= dr;
//       c -= dc;
//     }
//     if (r >= 0 && r < 8 && c >= 0 && c < 8 && !board[r][c]) ends[1] = true;
//     if (count === 3 && ends[0] && ends[1]) {
//       return true;
//     }
//   }
//   return false;
// };

// ===== TACTICAL PATTERN DETECTION FOR AI-3 =====

// Helper function to check if a cell is "empty" (no yugo present, even if migo exists)
const isEmptyCell = (board: (Cell | null)[][], row: number, col: number): boolean => {
  return !board[row][col] || !board[row][col]?.isYugo;
};

// 1. THREE YUGO THREAT: Detect if opponent has 3 connected yugos with 1 empty gap
const detectThreeYugoThreat = (board: (Cell | null)[][], opponentColor: 'white' | 'black'): {row: number, col: number}[] => {
  const threats: {row: number, col: number}[] = [];
  const directions = [[-1, 0], [0, 1], [1, 1], [1, 0]]; // All 4 main directions
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      for (const [dr, dc] of directions) {
        // Check for pattern: Yugo-Yugo-Empty-Yugo or Yugo-Empty-Yugo-Yugo or Empty-Yugo-Yugo-Yugo
        const positions = [];
        for (let i = 0; i < 4; i++) {
          const r = row + i * dr;
          const c = col + i * dc;
          if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            positions.push({row: r, col: c, cell: board[r][c]});
          }
        }
        
        if (positions.length === 4) {
          const yugos = positions.filter(p => p.cell?.color === opponentColor && p.cell?.isYugo);
          const empties = positions.filter(p => isEmptyCell(board, p.row, p.col));
          
          // Check if we have exactly 3 yugos and 1 empty in the line
          if (yugos.length === 3 && empties.length === 1) {
            threats.push({row: empties[0].row, col: empties[0].col});
          }
        }
      }
    }
  }
  
  return threats;
};

// 2. IGO FORK: Detect if opponent can create double threat by placing yugo in center
const detectIgoFork = (board: (Cell | null)[][], opponentColor: 'white' | 'black'): {row: number, col: number}[] => {
  const forkThreats: {row: number, col: number}[] = [];
  const directions = [[-1, 0], [0, 1], [1, 1], [1, 0]];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (!isEmptyCell(board, row, col)) continue;
      
      for (const [dr, dc] of directions) {
        // Check for pattern: Yugo-Empty-Yugo-Empty-[THIS CELL]-Empty-Yugo
        // This would create two threats if opponent places yugo here
        
        let yugosOnLeft = 0;
        let yugosOnRight = 0;
        
        // Check left side (2 positions)
        for (let i = 1; i <= 2; i++) {
          const r = row - i * dr;
          const c = col - i * dc;
          if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const cell = board[r][c];
            if (cell?.color === opponentColor && cell?.isYugo) {
              yugosOnLeft++;
            }
          }
        }
        
        // Check right side (2 positions)
        for (let i = 1; i <= 2; i++) {
          const r = row + i * dr;
          const c = col + i * dc;
          if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const cell = board[r][c];
            if (cell?.color === opponentColor && cell?.isYugo) {
              yugosOnRight++;
            }
          }
        }
        
        // If placing a yugo here would connect with yugos on both sides
        // and create 3+ connected yugos, it's a fork threat
        if (yugosOnLeft >= 1 && yugosOnRight >= 1 && (yugosOnLeft + yugosOnRight >= 2)) {
          forkThreats.push({row, col});
        }
      }
    }
  }
  
  return forkThreats;
};

// 2b. YUGO-TO-FORK THREAT: Detect if opponent can create fork by first forming yugo
const detectYugoToForkThreat = (board: (Cell | null)[][], opponentColor: 'white' | 'black'): {row: number, col: number}[] => {
  const yugoToForkThreats: {row: number, col: number}[] = [];
  const directions = [[-1, 0], [0, 1], [1, 1], [1, 0]];
  
  // For each empty cell, check if opponent placing there creates a yugo that leads to fork
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (!isEmptyCell(board, row, col)) continue;
      
      // Simulate opponent placing a piece here
      const testBoard = copyBoard(board);
      testBoard[row][col] = { color: opponentColor, isYugo: false };
      
      // Check if this creates any yugos
      const yugos = checkForYugos(testBoard, row, col, opponentColor);
      
      if (yugos.length > 0) {
        // Simulate the yugo formation (piece becomes yugo, others removed)
        const postYugoBoard = copyBoard(testBoard);
        
        // Process each yugo
        for (const yugo of yugos) {
          // The placed piece becomes a yugo
          postYugoBoard[row][col] = { color: opponentColor, isYugo: true, yugoType: 'standard' };
          
          // Remove other pieces in the yugo (except the new yugo)
          for (const pos of yugo) {
            if (pos.row !== row || pos.col !== col) {
              postYugoBoard[pos.row][pos.col] = null;
            }
          }
        }
        
        // Now check if this results in an igo fork situation
        // Look for 2+ connected yugos with empty cells on both ends
        for (const [dr, dc] of directions) {
          const line = [];
          
          // Build line in this direction starting from the new yugo
          for (let i = -3; i <= 3; i++) {
            const r = row + i * dr;
            const c = col + i * dc;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
              line.push({
                row: r, 
                col: c, 
                cell: postYugoBoard[r][c],
                isEmpty: isEmptyCell(postYugoBoard, r, c)
              });
            }
          }
          
          // Look for patterns like: Empty-Yugo-Yugo-Empty or Empty-Yugo-Yugo-Yugo-Empty
          for (let start = 0; start < line.length - 3; start++) {
            const segment = line.slice(start, start + 4);
            const yugos = segment.filter(p => p.cell?.color === opponentColor && p.cell?.isYugo);
           // const empties = segment.filter(p => p.isEmpty);
            
            // If we have 2+ yugos with empties on both ends, it's a fork threat
            if (yugos.length >= 2 && segment[0].isEmpty && segment[segment.length - 1].isEmpty) {
              yugoToForkThreats.push({row, col});
              break;
            }
          }
        }
      }
    }
  }
  
  return yugoToForkThreats;
};

// 3. YUGO TRAP: Check if forming yugo removes defending ions
const detectYugoTrap = (board: (Cell | null)[][], row: number, col: number, playerColor: 'white' | 'black'): boolean => {
  const opponentColor = playerColor === 'white' ? 'black' : 'white';
  
  // Simulate placing the piece and forming yugos
  const testBoard = copyBoard(board);
  testBoard[row][col] = { color: playerColor, isYugo: false };
  
  const yugos = checkForYugos(testBoard, row, col, playerColor);
  
  if (yugos.length === 0) return false; // No yugo formed, no trap
  
  // For each yugo, check what ions would be removed
  for (const yugo of yugos) {
    for (const pos of yugo) {
      if (pos.row === row && pos.col === col) continue; // Skip the new piece
      
      // This migo would be removed - check if it was defending anything critical
      const migoRow = pos.row;
      const migoCol = pos.col;
      
      // Temporarily remove this migo and check for new threats
      const boardWithoutMigo = copyBoard(testBoard);
      boardWithoutMigo[migoRow][migoCol] = null;
      
      // Check if removing this migo exposes us to Three Yugo Threat
      const threeYugoThreats = detectThreeYugoThreat(boardWithoutMigo, opponentColor);
      if (threeYugoThreats.some(threat => threat.row === migoRow && threat.col === migoCol)) {
        return true; // This is a trap!
      }
      
      // Check if removing this migo exposes us to Igo Fork
      const igoForksExposed = detectIgoFork(boardWithoutMigo, opponentColor);
      if (igoForksExposed.some(fork => fork.row === migoRow && fork.col === migoCol)) {
        return true; // This is a trap!
      }
    }
  }
  
  return false;
};

// Simple AI logic
// AI Helper Functions
const evaluateMove = (board: (Cell | null)[][], row: number, col: number, playerColor: 'white' | 'black', difficulty: 'ai-1' | 'ai-2' | 'ai-3' | 'ai-4'): number => {
  // For AI-4, use the advanced evaluation
  if (difficulty === 'ai-4') {
    const testBoard = makeMove(board, row, col, playerColor);
    return evaluatePosition(testBoard, playerColor);
  }
  
  // Original evaluation for AI-1, AI-2, AI-3
  let score = 0;
  const opponentColor = playerColor === 'white' ? 'black' : 'white';
  
  // ABSOLUTE PRIORITY 0: Immediate Igo Win (check if this move wins the game)
  // Create a fresh copy for this check to prevent state corruption
  const igoTestBoard = copyBoard(board);
  igoTestBoard[row][col] = { color: playerColor, isYugo: true, yugoType: 'standard' };
  const immediateIgo = checkForIgo(igoTestBoard, row, col, playerColor);
  if (immediateIgo) {
    score += 100000; // MASSIVE BONUS - ALWAYS TAKE WINNING MOVES!
  }
  
  // PRIORITY 1: Yugo Formation (immediate win condition)
  // Create a fresh copy for this check to prevent state corruption
  const yugoTestBoard = copyBoard(board);
  yugoTestBoard[row][col] = { color: playerColor, isYugo: false };
  
  const yugos = checkForYugos(yugoTestBoard, row, col, playerColor);
  if (yugos.length > 0) {
    score += 1000 * yugos.length; // Massive bonus for forming yugos
  }
  
  // ENHANCED PRIORITY 2: Advanced Threat Detection for AI-3
  if (difficulty === 'ai-3') {
    // Check for Three Yugo Threats (MUST BLOCK)
    const threeYugoThreats = detectThreeYugoThreat(board, opponentColor);
    if (threeYugoThreats.some(threat => threat.row === row && threat.col === col)) {
      score += 15000; // CRITICAL: Must block three yugo threat immediately
    }
    
    // Check for Igo Forks (MUST BLOCK)
    const igoForks = detectIgoFork(board, opponentColor);
    if (igoForks.some(fork => fork.row === row && fork.col === col)) {
      score += 12000; // CRITICAL: Must block igo fork
    }
    
    // Check for Yugo-to-Fork Threats (MUST BLOCK) - NEW!
    const yugoToForkThreats = detectYugoToForkThreat(board, opponentColor);
    if (yugoToForkThreats.some(threat => threat.row === row && threat.col === col)) {
      score += 13000; // CRITICAL: Must block yugo-to-fork setup
    }
    
    // Check for Yugo Trap (MUST AVOID)
    if (detectYugoTrap(board, row, col, playerColor)) {
      score -= 20000; // CRITICAL: Avoid yugo traps at all costs
    }
  }
  
  // PRIORITY 2: Block Opponent Threats (prevent opponent from winning)
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isValidMove(board, r, c, opponentColor)) {
        const opponentTestBoard = copyBoard(board);
        opponentTestBoard[r][c] = { color: opponentColor, isYugo: false };
        const opponentYugos = checkForYugos(opponentTestBoard, r, c, opponentColor);
        
        // Check for igo threat (opponent can win immediately)
        opponentTestBoard[r][c] = { color: opponentColor, isYugo: true, yugoType: 'standard' };
        const opponentIgo = checkForIgo(opponentTestBoard, r, c, opponentColor);
        
        if ((opponentYugos.length > 0 || opponentIgo) && r === row && c === col) {
          score += opponentIgo ? 9000 : 800; // Massive bonus for blocking igo, high for yugos
        }
      }
    }
  }
  
  // PRIORITY 3: Check for Igo Formation (game winner)
  // Create a fresh copy for this check to prevent state corruption
  const igoTestBoard2 = copyBoard(board);
  igoTestBoard2[row][col] = { color: playerColor, isYugo: true, yugoType: 'standard' };
  const igo = checkForIgo(igoTestBoard2, row, col, playerColor);
  if (igo) {
    score += 10000; // Instant win
  }
  
  // PRIORITY 4: Yugo Building (scoring opportunities)
  if (yugos.length > 0) {
    const yugoValue = yugos.length === 1 ? 1 : yugos.length === 2 ? 2 : yugos.length === 3 ? 3 : 4;
    score += yugoValue * 100; // Bonus based on yugo type
  }
  
  // PRIORITY 5: Center Control (general good play)
  const centerDistance = Math.abs(row - 3.5) + Math.abs(col - 3.5);
  score += (7 - centerDistance) * 10; // Prefer center positions
  
  // PRIORITY 6: Support Structures (set up future yugos)
  let supportCount = 0;
  const directions = [[-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]];
  for (const [dr, dc] of directions) {
    const adjRow = row + dr;
    const adjCol = col + dc;
    if (adjRow >= 0 && adjRow < 8 && adjCol >= 0 && adjCol < 8) {
      if (board[adjRow][adjCol] && board[adjRow][adjCol]!.color === playerColor) {
        supportCount++;
      }
    }
  }
  score += supportCount * 20; // Bonus for connecting with own pieces
  
  // Level 1 specific: Add some small evaluation noise to make it less perfect
  if (difficulty === 'ai-1') {
    score += Math.random() * 40 - 20; // ±20 point variation
  }
  
  return score;
};

// Advanced AI evaluation for Level 3 - Minimax with lookahead
// Simplified AI evaluation - removed complex alpha-beta for performance
// --- MCTS for AI-3 ---
// function mcts(
//   board: (Cell | null)[][],
//   playerColor: 'white' | 'black',
//   iterations: number = 200,
//   rolloutDepth: number = 8
// ): { row: number; col: number } | null {
//   const validMoves = getAllValidMoves(board, playerColor);
//   if (validMoves.length === 0) return null;
//   const moveStats = validMoves.map(move => ({
//     move,
//     wins: 0,
//     playouts: 0
//   }));

//   for (let i = 0; i < iterations; i++) {
//     const moveIdx = Math.floor(Math.random() * validMoves.length);
//     const { row, col } = validMoves[moveIdx];
//     let simBoard = makeMove(board, row, col, playerColor);
//     let simPlayer: 'white' | 'black' = playerColor === 'white' ? 'black' : 'white';
//     let winner: 'white' | 'black' | 'draw' | null = null;
//     let depth = 0;
//    // let lastMove = { row, col, player: playerColor };
//     while (depth < rolloutDepth) {
//       const moves = getAllValidMoves(simBoard, simPlayer);
//       if (moves.length === 0) {
//         // Yugo count tiebreak
//         const whiteYugos = countYugos(simBoard, 'white');
//         const blackYugos = countYugos(simBoard, 'black');
//         if (whiteYugos > blackYugos) winner = 'white';
//         else if (blackYugos > whiteYugos) winner = 'black';
//         else winner = 'draw';
//         break;
//       }
//       // Pick best move by evaluateMove (greedy rollout)
//       let bestScore = -Infinity;
//       let best = moves[0];
//       for (const m of moves) {
//         const score = evaluateMove(simBoard, m.row, m.col, simPlayer, 'ai-3');
//         if (score > bestScore) {
//           bestScore = score;
//           best = m;
//         }
//       }
//       simBoard = makeMove(simBoard, best.row, best.col, simPlayer);
//       //lastMove = { row: best.row, col: best.col, player: simPlayer };
//       // Check for igo win
//       if (checkForIgo(simBoard, best.row, best.col, simPlayer)) {
//         winner = simPlayer;
//         break;
//       }
//       simPlayer = simPlayer === 'white' ? 'black' : 'white';
//       depth++;
//     }
//     // Score for black (AI)
//     if (winner === 'black') moveStats[moveIdx].wins++;
//     moveStats[moveIdx].playouts++;
//   }
//   // Pick move with highest win rate
//   moveStats.sort((a, b) => (b.wins / b.playouts) - (a.wins / a.playouts));
//   return moveStats[0].move;
// }

const App: React.FC = () => {
  // Helper function to get winner name for personalized messages
  const getWinnerName = (winner: 'white' | 'black' | 'draw', gameMode: string, authState: any, gameState: any, opponentName?: string) => {
    if (winner === 'draw') return 'Draw';
    
    if (gameMode === 'online') {
      // For online games, determine names based on player color and opponent
      const currentUsername = authState.user?.username || 'Player';
      
      // Use opponentNameRef.current instead of the opponentName parameter
      const opponentName = opponentNameRef.current || 'Opponent';
      
      // Determine which player is which based on the current user's color
      const whiteName = playerColorRef.current === 'white' ? currentUsername : opponentName;
      const blackName = playerColorRef.current === 'black' ? currentUsername : opponentName;
      
      return winner === 'white' ? whiteName : blackName;
    } else if (gameMode.startsWith('ai-')) {
      // For AI games, show logged-in user vs AI
      if (winner === 'white') {
        return authState.user?.username || 'White';
      } else {
        return 'AI';
      }
    } else {
      // For local games, show logged-in user vs Human
      if (winner === 'white') {
        return authState.user?.username || 'White';
      } else {
        return 'Human';
      }
    }
  };

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    board: copyBoard(INITIAL_BOARD),
    currentPlayer: 'white',
    scores: { white: 0, black: 0 },
    gameStatus: 'waiting',
    lastMove: null,
    players: { white: 'Player 1', black: 'Player 2' },
    igoLine: null
  });

  // Page navigation state
  const [currentPage, setCurrentPage] = useState<'landing' | 'game' | 'battle-report' | 'leaderboard' | 'about'>('landing');

  // UI state
  const [showTutorial, setShowTutorial] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [showMatchmaking, setShowMatchmaking] = useState(false);
  const [showStatsAuth, setShowStatsAuth] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showBattleReportModal, setShowBattleReportModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showPWABanner, setShowPWABanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Mobile detection state
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Settings state
  const [currentTheme, setCurrentTheme] = useState('classic');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [customColors, setCustomColors] = useState({
    whiteMigo: '#ecf0f1',
    blackMigo: '#2c3e50',
    yugoColor: '#e74c3c',
    boardColor: '#d1e6f9',
    hoverColor: '#a8c3e8', // classic hover color (darker than board)
    lastMoveColor: 'rgba(46, 204, 113, 0.2)' // classic last move color
  });

  // Review mode state
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [currentReviewMove, setCurrentReviewMove] = useState(0);
  const [moveHistory, setMoveHistory] = useState<MoveHistoryEntry[]>([]);
  const [isProcessingMove, setIsProcessingMove] = useState(false);


  //const [boardHistory, setBoardHistory] = useState<(Cell | null)[][][]>([]);
  const [holdScrollInterval, setHoldScrollInterval] = useState<NodeJS.Timeout | null>(null);

  // Timer state
  const [timers, setTimers] = useState({ white: 600, black: 600 });
  const [activeTimer, setActiveTimer] = useState<'white' | 'black' | null>(null);

  // Game mode state
  const [gameMode, setGameMode] = useState<'local' | 'ai-1' | 'ai-2' | 'ai-3' | 'ai-4' | 'online'>('local');
 // const [waitingForAI, setWaitingForAI] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    primaryButton?: string;
    secondaryButton?: string;
    onPrimary?: () => void;
    onSecondary?: () => void;
  }>({ show: false, title: '', message: '' });

  // Authentication state
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isGuest: false
  });

  // Online game state
  const [socket, setSocket] = useState<any>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
  const playerColorRef = useRef<'white' | 'black' | null>(null); // Ref to avoid closure issues
  const [opponentName, setOpponentName] = useState<string>('');
  const opponentNameRef = useRef<string>(''); // Ref to avoid closure issues
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [minutesPerPlayer, setMinutesPerPlayer] = useState(10);
  const [incrementSeconds, setIncrementSeconds] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [rematchState, setRematchState] = useState<{
    requested: boolean;
    fromPlayer: string | null;
    requestedBy?: string;
    waitingForResponse?: boolean;
  }>({ requested: false, fromPlayer: null });
  const [toast, setToast] = useState<string>('');
  const [showResignConfirmation, setShowResignConfirmation] = useState(false);
  const [showResignDrawModal, setShowResignDrawModal] = useState(false);
  const [showDrawOffer, setShowDrawOffer] = useState(false);
  const [pendingDrawFrom, setPendingDrawFrom] = useState<string | null>(null);
  const [originalGameState, setOriginalGameState] = useState<GameState | null>(null);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [gameResultRecorded, setGameResultRecorded] = useState(false);

  // Centralized function to record game results
  // Around line 1091-1131 - Replace the entire recordGameEnd function

const recordGameEnd = useCallback((winner: 'white' | 'black' | 'draw', reason: string) => {
  const currentPlayerColor = playerColorRef.current;
  console.log('🎯 recordGameEnd called:', {
    winner,
    reason,
    currentPlayerColor,
    isAuthenticated: authState.isAuthenticated,
    hasUser: !!authState.user,
    gameResultRecorded
  });
  // Defensive check for playerColor
  if (!currentPlayerColor) {
    console.log('🚫 No playerColor available, cannot record game result');
    return;
  }
  if (authState.isAuthenticated && authState.user && !gameResultRecorded) {
    // Use currentPlayerColor from ref to determine opponent
    const opponentName = opponentNameRef.current;
    
    console.log('✅ Recording for:', {
      username: authState.user?.username,
      myColor: currentPlayerColor,
      opponent: opponentName,
      winner
    });
    import('./services/authService').then(({ AuthService }) => {
      // Determine result based on currentPlayerColor and winner
      const resultType = winner === 'draw' ? 'draw' : 
                        winner === currentPlayerColor ? 'win' : 'loss';
      
      console.log(`📈 Final result: ${resultType} (I am ${currentPlayerColor}, winner is ${winner})`);
      
      AuthService.recordGameResult(resultType, opponentName, currentPlayerColor, 'online').then(result => {
        console.log(`✅ ${resultType} recorded successfully:`, result);
        setGameResultRecorded(true);
      }).catch(err => {
        console.error(`❌ Failed to record ${resultType}:`, err);
      });
    }).catch((error) => {
      console.error('❌ Error importing AuthService:', error);
    });
  } else {
    console.log('🚫 Not recording:', {
      isAuthenticated: authState.isAuthenticated,
      hasUser: !!authState.user,
      gameResultRecorded
    });
  }
}, [authState.isAuthenticated, authState.user, gameState.players, gameResultRecorded]);
// IMPORTANT: playerColor is NOT in dependencies - we use playerColorRef instead

  // Room-based multiplayer state
  const [currentRoom, setCurrentRoom] = useState<{
    code: string;
    isHost: boolean;
    hostName: string;
    guestName?: string;
    status: 'waiting' | 'ready' | 'active';
  } | null>(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');

  // Tutorial animation ref
 // const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Animation state for migo placement and removal
  const [newlyPlacedDots, setNewlyPlacedDots] = useState<Set<string>>(new Set());
  const [fadingDots, setFadingDots] = useState<Set<string>>(new Set());

  // Load settings from localStorage on component mount
  useEffect(() => {
    setCurrentTheme('classic'); // Always force classic theme
    loadSavedSettings();
  }, []);

  // Keep playerColorRef in sync with playerColor to avoid closure issues
  useEffect(() => {
    playerColorRef.current = playerColor;
    console.log('🎨 playerColorRef updated:', playerColor);
  }, [playerColor]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 600 || 
                      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobileDevice(isMobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Manage body class for landing page and game page
  useEffect(() => {
    if (currentPage === 'landing') {
      document.body.classList.add('landing-page');
      document.body.classList.remove('game-page');
    } else {
      document.body.classList.remove('landing-page');
      document.body.classList.add('game-page');
    }
    
    return () => {
      document.body.classList.remove('landing-page', 'game-page');
    };
  }, [currentPage]);

  // Cleanup: Clear inGame flag when page closes or component unmounts
  useEffect(() => {
    const handleBeforeUnload = async () => {
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        // Use navigator.sendBeacon for reliable cleanup on page close
        const userRef = `users/${currentUser.uid}`;
        navigator.sendBeacon(
          `https://firestore.googleapis.com/v1/projects/migoyugo-e248a/databases/(default)/documents/${userRef}`,
          JSON.stringify({ inGame: false })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        FirestoreService.setUserInGame(currentUser.uid, false);
      }
    };
  }, []);
 
  // Load saved settings from localStorage
  const loadSavedSettings = () => {
    // Always set theme to classic, ignore saved theme
    setCurrentTheme('classic');

    const savedSoundEnabled = localStorage.getItem('migoyugoSoundEnabled');
    const savedCustomColors = localStorage.getItem('migoyugoCustomColors');

    if (savedSoundEnabled) {
      setSoundEnabled(JSON.parse(savedSoundEnabled));
    }
    if (savedCustomColors) {
      setCustomColors(JSON.parse(savedCustomColors));
    }
  };

  // Apply custom colors to CSS variables
  const applyCustomColors = useCallback((colors: typeof customColors) => {
    const root = document.documentElement;
    root.style.setProperty('--white-migo', colors.whiteMigo);
    root.style.setProperty('--black-migo', colors.blackMigo);
    root.style.setProperty('--yugo-color', colors.yugoColor);
    root.style.setProperty('--board-color', colors.boardColor);
    root.style.setProperty('--hover-color', colors.hoverColor);
    root.style.setProperty('--last-move-color', colors.lastMoveColor);
  }, []);

  // Clear custom colors from CSS variables
  const clearCustomColors = useCallback(() => {
    const root = document.documentElement;
    root.style.removeProperty('--white-migo');
    root.style.removeProperty('--black-migo');
    root.style.removeProperty('--yugo-color');
    root.style.removeProperty('--board-color');
    root.style.removeProperty('--hover-color');
    root.style.removeProperty('--last-move-color');
  }, []);

  // Apply theme to document
  const applyTheme = useCallback((theme: string) => {
    document.documentElement.setAttribute('data-theme', theme);
    
    // If it's a custom theme, apply custom colors
    if (theme === 'custom') {
      applyCustomColors(customColors);
    } else {
      // Clear custom colors when switching away from custom theme
      clearCustomColors();
    }
  }, [customColors, applyCustomColors, clearCustomColors]);


   // Apply theme when currentTheme changes
   useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme, applyTheme]);



  // Handle theme change
  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem('migoyugoTheme', theme);
  };

  // Handle sound toggle
  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('migoyugoSoundEnabled', JSON.stringify(enabled));
  };

  // Handle custom color change
  const handleCustomColorChange = (colorType: keyof typeof customColors, color: string) => {
    const newColors = { ...customColors, [colorType]: color };
    setCustomColors(newColors);
    localStorage.setItem('migoyugoCustomColors', JSON.stringify(newColors));
  };

  // Reset settings to defaults
  const resetSettings = () => {
    // Reset state to default values
    setCurrentTheme('classic');
    setSoundEnabled(true);
    setCustomColors({
      whiteMigo: '#ecf0f1',
      blackMigo: '#2c3e50',
      yugoColor: '#e74c3c',
      boardColor: '#d1e6f9',
      hoverColor: '#a8c3e8',
      lastMoveColor: 'rgba(46, 204, 113, 0.2)'
    });
  
    // Remove from localStorage
    localStorage.removeItem('migoyugoTheme');
    localStorage.removeItem('migoyugoSoundEnabled');
    localStorage.removeItem('migoyugoCustomColors');
  
    // Show confirmation
    showToast('Settings have been reset to default.');
  };

  // Sound function
  const playSound = useCallback((soundName: 'migo' | 'yugo' | 'igo') => {
    // Check if sound is enabled before playing
    if (!soundEnabled) {
      console.log(`Sound disabled - ${soundName} not played`);
      return;
    }
    
    try {
      const audio = new Audio(`/sounds/${soundName}.mp3`);
      // Set volume based on sound type
      if (soundName === 'igo') {
        audio.volume = 0.168; // Reduced igo volume by additional 30% (from 24% to 16.8%)
      } else {
        audio.volume = 0.3; // Standard volume for migo and yugo sounds
      }
      console.log(`Playing sound: ${soundName}.mp3 at volume ${audio.volume}`);
      audio.play().catch(e => console.log(`Sound play failed for ${soundName}:`, e));
    } catch (e) {
      console.log(`Sound loading failed for ${soundName}:`, e);
    }
  }, [soundEnabled]);

    // PWA installation detection
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('PWA: beforeinstallprompt event fired');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show our custom banner after a short delay
      setTimeout(() => {
        // Only show if not already installed and not dismissed recently
        const dismissed = localStorage.getItem('pwa-banner-dismissed');
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        if (!dismissedTime || dismissedTime < oneDayAgo) {
          setShowPWABanner(true);
        }
        }, 5000); // Show after 5 seconds on mobile (longer delay)
    };

    const handleAppInstalled = () => {
      console.log('PWA: App installed');
      setShowPWABanner(false);
      setDeferredPrompt(null);
    };

    // Enhanced mobile/iOS detection and debugging
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    console.log('PWA: Device detection', {
      userAgent,
      isIOS,
      isStandalone,
      isMobile,
      maxTouchPoints: navigator.maxTouchPoints,
      platform: navigator.platform
    });
    
         // Show PWA banner for mobile devices (iOS or Android) that aren't already installed
    if (isMobile && !isStandalone) {
      console.log('PWA: Mobile device detected (not standalone), will show banner after 5 seconds');
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-banner-dismissed');
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        console.log('PWA: Checking if should show banner', {
          dismissed,
          dismissedTime,
          oneDayAgo,
          shouldShow: !dismissedTime || dismissedTime < oneDayAgo
        });
        
        if (!dismissedTime || dismissedTime < oneDayAgo) {
          console.log('PWA: Showing mobile banner');
          setShowPWABanner(true);
        }
      }, 5000);
    } else if (isMobile && isStandalone) {
      console.log('PWA: Running in standalone mode - no banner needed');
    } else if (!isMobile) {
      console.log('PWA: Desktop device - will rely on beforeinstallprompt event');
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // PWA banner actions
  const handleInstallPWA = async () => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    console.log('PWA: Install button clicked', { isIOS, deferredPrompt: !!deferredPrompt });
    
    if (isIOS) {
      // iOS doesn't support programmatic install, show instructions
      alert('To install: Tap the Share button in Safari, then select "Add to Home Screen"');
      setShowPWABanner(false);
      return;
    }
    
    if (!deferredPrompt) {
      console.log('PWA: No deferred prompt available - showing manual instructions');
      alert('To install: Use your browser menu to "Install App" or "Add to Home Screen"');
      setShowPWABanner(false);
      return;
    }
    
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('PWA: User choice:', outcome);
      
      if (outcome === 'accepted') {
        setShowPWABanner(false);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWA: Error during install prompt', error);
      alert('To install: Use your browser menu to "Install App" or "Add to Home Screen"');
      setShowPWABanner(false);
    }
  };

  const dismissPWABanner = () => {
    setShowPWABanner(false);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  // Dynamic viewport height detection for mobile
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set initial value
    setVH();

    // Update on resize and orientation change
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', () => {
      // Delay to allow for browser UI changes
      setTimeout(setVH, 100);
    });

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check Firebase Auth first
      const { AuthService } = await import('./services/authService');
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        console.log('🔥 Firebase user found:', currentUser);
        try {
          const { FirestoreService } = await import('./services/firestoreService');

          // Retry a few times in case Firestore write is still propagating right after signup
          let userData = await FirestoreService.getUserData(currentUser.uid);
          for (let i = 0; i < 5 && (!userData || !userData.username); i++) {
            await new Promise((r) => setTimeout(r, 300));
            userData = await FirestoreService.getUserData(currentUser.uid);
          }

          setAuthState({
            isAuthenticated: true,
            user: {
              id: currentUser.uid,
              // Do NOT fall back to email-based username; use Firestore (or displayName if available)
              username: userData?.username || currentUser.displayName || 'User',
              email: currentUser.email || '',
              stats: {
                gamesPlayed: 0,
                wins: 0,
                losses: 0
              }
            },
            isGuest: false
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          setAuthState({
            isAuthenticated: true,
            user: {
              id: currentUser.uid,
              // No email fallback here either
              username: currentUser.displayName || 'User',
              email: currentUser.email || '',
              stats: {
                gamesPlayed: 0,
                wins: 0,
                losses: 0
              }
            },
            isGuest: false
          });
        }
      } else {
        // Check custom API token as fallback
        const token = localStorage.getItem('authToken');
        if (token) {
          try {
            const response = await fetch(`${getApiUrl()}/api/auth/profile`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              setAuthState({
                isAuthenticated: true,
                user: data.user,
                isGuest: false
              });
              
              // Check if user has an active game to reconnect to
              // This will trigger socket connection and potential reconnection
              setGameMode('online');
            } else {
              // Token is invalid, remove it
              localStorage.removeItem('authToken');
            }
          } catch (error) {
            // Connection error, keep token but don't authenticate yet
          }
        }
      }
    };
    
    checkAuth();
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupAuthListener = async () => {
      const { AuthService } = await import('./services/authService');
      
      unsubscribe = AuthService.onAuthStateChanged((user) => {
        console.log('🔥 Firebase Auth state changed:', user, 'Email verified:', user?.emailVerified);
        if (user && user.emailVerified) {
          // Only set as authenticated if email is verified
          (async () => {
            try {
              const { FirestoreService } = await import('./services/firestoreService');

              // Retry a few times to avoid showing email-derived name immediately after signup
              let userData = await FirestoreService.getUserData(user.uid);
              for (let i = 0; i < 5 && (!userData || !userData.username); i++) {
                await new Promise((r) => setTimeout(r, 300));
                userData = await FirestoreService.getUserData(user.uid);
              }

              setAuthState({
                isAuthenticated: true,
                user: {
                  id: user.uid,
                  // Only Firestore username (or displayName); no email fallback
                  username: userData?.username || user.displayName || 'User',
                  email: user.email || '',
                  stats: {
                    gamesPlayed: 0,
                    wins: 0,
                    losses: 0
                  }
                },
                isGuest: false
              });
            } catch (error) {
              console.error('Error fetching user data on auth change:', error);
              setAuthState({
                isAuthenticated: true,
                user: {
                  id: user.uid,
                  // No email fallback
                  username: user.displayName || 'User',
                  email: user.email || '',
                  stats: {
                    gamesPlayed: 0,
                    wins: 0,
                    losses: 0
                  }
                },
                isGuest: false
              });
            }
          })();
        } else if (user && !user.emailVerified) {
          // User exists but email not verified - treat as signed out
          console.log('📧 User email not verified, treating as signed out');
          setAuthState({
            isAuthenticated: false,
            user: null,
            isGuest: false
          });
        } else {
          // User signed out - set online status to false if we have user data
          if (authState.isAuthenticated && authState.user) {
            import('./services/firestoreService').then(({ FirestoreService }) => {
              FirestoreService.updateUserOnlineStatus(authState.user!.id, false).catch(console.error);
              console.log('📴 User online status set to false on signout');
            });
          }
          
          setAuthState({
            isAuthenticated: false,
            user: null,
            isGuest: false
          });
        }
      });
    };
    
    setupAuthListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Helper functions for animation management
  const addNewDotAnimation = useCallback((row: number, col: number) => {
    // Don't animate in review mode
    if (isReviewMode) return;
    
    const cellKey = `${row}-${col}`;
    setNewlyPlacedDots(prev => new Set([...Array.from(prev), cellKey]));
    
    // Remove the animation class after 200ms (duration of bounce-in animation)
    setTimeout(() => {
      setNewlyPlacedDots(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    }, 200);
  }, [isReviewMode]);

  const addFadeOutAnimation = useCallback((cellsToFade: {row: number, col: number}[]) => {
    // Don't animate in review mode
    if (isReviewMode) return;
    
    const cellKeys = cellsToFade.map(({row, col}) => `${row}-${col}`);
    setFadingDots(prev => new Set([...Array.from(prev), ...cellKeys]));
    
    // Remove the animation class after 200ms (duration of fade-out animation)
    setTimeout(() => {
      setFadingDots(prev => {
        const newSet = new Set(prev);
        cellKeys.forEach(key => newSet.delete(key));
        return newSet;
      });
    }, 200);
  }, [isReviewMode]);

  const showToast = useCallback((message: string, duration: number = 4000) => {
    setToast(message);
    setTimeout(() => setToast(''), duration);
  }, []);

  // Initialize socket connection for online play
  useEffect(() => {
    console.log('Socket effect triggered with gameMode:', gameMode);
    if (gameMode === 'online') {
      const token = localStorage.getItem('authToken');
      console.log('Creating socket connection...', {
        production: process.env.NODE_ENV === 'production',
        connectionURL: process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3002',
        hasToken: !!token,
        authState
      });
      
      // Determine socket URL based on environment variables
      const socketUrl =
  (process.env.REACT_APP_SOCKET_URL || '').trim() ||
  (process.env.NODE_ENV === 'production'
    ? 'https://mig-backend-2hpo.onrender.com'
    : 'http://localhost:3002');
      
      console.log('Connecting to socket:', socketUrl, 'NODE_ENV:', process.env.NODE_ENV);
      
      const newSocket = io(socketUrl, {
        auth: {
          token: token,
          isGuest: authState.isGuest,
          user: authState.user
        },
        // Production-optimized connection settings
        timeout: process.env.NODE_ENV === 'production' ? 10000 : 5000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: process.env.NODE_ENV === 'production' ? 10 : 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected successfully:', newSocket.id);
        console.log('Production environment:', process.env.NODE_ENV === 'production');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        if (process.env.NODE_ENV === 'production') {
          console.log('Retrying connection in production mode...');
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        
        // Clear inGame flag on disconnect
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
          FirestoreService.setUserInGame(currentUser.uid, false);
        }
      });

      newSocket.on('gameStart', (data) => {
        setGameId(data.gameId);
        setPlayerColor(data.playerColor);
        setOpponentName(data.opponentName);
        opponentNameRef.current = data.opponentName; // Update ref for closure access
        setOpponentDisconnected(false);
        setGameState(prev => ({
          ...prev,
          ...data.gameState,
          gameStatus: 'active'
        }));
        
        // Update inGame flag with gameId
        const currentUser = AuthService.getCurrentUser();
        if (currentUser && data.gameId) {
          FirestoreService.setUserInGame(currentUser.uid, true, data.gameId);
        }
        
        // Apply standard timer settings for online games
        if (data.timerSettings) {
          console.log('Applying standard timer settings from server:', data.timerSettings);
          setTimerEnabled(data.timerSettings.timerEnabled);
          setMinutesPerPlayer(data.timerSettings.minutesPerPlayer);
          setIncrementSeconds(data.timerSettings.incrementSeconds);
          
          // Initialize timers from server data
          if (data.timerSettings.timerEnabled && data.timers) {
            setTimers(data.timers);
            setActiveTimer(data.gameState.currentPlayer);
          }
        }
        
        setIsGameStarted(true);
        setShowMatchmaking(false);
        setIsSearchingMatch(false);
        
        // Clear room state when game starts (works for both room games and quick match)
        setCurrentRoom(null);
        
        showToast(`Game start - you are playing as ${data.playerColor} (${data.timerSettings?.timerEnabled ? `${data.timerSettings.minutesPerPlayer}+${data.timerSettings.incrementSeconds}` : 'no timer'})`);
      });

      newSocket.on('waitingForOpponent', () => {
        setIsSearchingMatch(true);
      });

      newSocket.on('timerUpdate', (data) => {
        // Validate timer sync - check if we missed any updates
        if (data.timestamp) {
          const timeDiff = Date.now() - data.timestamp;
          // If more than 3 seconds difference, request sync
          if (timeDiff > 3000) {
            console.log('Timer sync issue detected, requesting sync...');
            newSocket.emit('requestTimerSync', { gameId });
            return;
          }
        }
        
        setTimers(data.timers);
        setActiveTimer(data.activeTimer);
      });

      newSocket.on('timerSync', (data) => {
        setTimers(data.timers);
        setActiveTimer(data.activeTimer);
      });

      newSocket.on('moveUpdate', (moveData) => {
        // Play appropriate sound effects
        if (moveData.gameOver && moveData.igo) {
          playSound('igo'); // Igo formed
        } else if (moveData.yugos > 0) {
          playSound('yugo'); // Yugo formed
        } else {
          playSound('migo'); // Regular migo placement
        }

        // Trigger animations for online moves
        setGameState(prev => {
          // Calculate removed dots by comparing old and new boards
          if (moveData.yugos > 0) {
            const removedCells: {row: number, col: number}[] = [];
            for (let row = 0; row < 8; row++) {
              for (let col = 0; col < 8; col++) {
                // If there was a migo here before but not now (except the new placement)
                if (prev.board[row][col] && !moveData.board[row][col] && 
                    !(row === moveData.row && col === moveData.col)) {
                  removedCells.push({row, col});
                }
              }
            }
            if (removedCells.length > 0) {
              addFadeOutAnimation(removedCells);
            }
          }
          
          // Trigger bounce-in animation for newly placed dot
          addNewDotAnimation(moveData.row, moveData.col);

          return {
            ...prev,
            board: moveData.board,
            currentPlayer: moveData.currentPlayer,
            scores: moveData.scores,
            lastMove: { row: moveData.row, col: moveData.col, player: moveData.player },
            gameStatus: moveData.gameOver ? 'finished' : 'active',
            igoLine: moveData.igo || null
          };
        });

        // Add to move history
        setMoveHistory(prev => [
          ...prev,
          {
            row: moveData.row,
            col: moveData.col,
            player: moveData.player,
            yugos: moveData.yugos,
            moveNumber: prev.length + 1
          }
        ]);

        // Update timers from server
        if (moveData.timers) {
          // Validate timer sync for move updates too
          if (moveData.timestamp) {
            const timeDiff = Date.now() - moveData.timestamp;
            if (timeDiff > 3000) {
              console.log('Move timer sync issue detected, requesting sync...');
              newSocket.emit('requestTimerSync', { gameId });
            }
          }
          setTimers(moveData.timers);
        }

        if (moveData.gameOver) {
          let message = '';
          if (moveData.winner === 'draw') {
            // Check if it's a Wego draw
            if (moveData.reason === 'wego') {
              message = 'The game ends in a Wego as a draw!';
            } else {
              message = 'Game ended in a draw!';
            }
          } else if (moveData.igo) {
            const winnerName = getWinnerName(moveData.winner, 'online', authState, gameState, opponentName);
            message = `${winnerName} wins with an Igo!`;
          } else {
            const winnerName = getWinnerName(moveData.winner, 'online', authState, gameState, opponentName);
            message = `${winnerName} wins by yugo count!`;
          }
          
          // Clear inGame flag when game ends
          const currentUser = AuthService.getCurrentUser();
          if (currentUser) {
            FirestoreService.setUserInGame(currentUser.uid, false);
          }
          
          // Record game result for authenticated users
          const currentPlayerColor = playerColorRef.current;
          console.log('🔍 Checking auth state for recording:', { 
            isAuthenticated: authState.isAuthenticated,
            hasUser: !!authState.user,
            userId: authState.user?.id,
            winner: moveData.winner,
            playerColor: currentPlayerColor
          });
          
          // Record game result using centralized function
          recordGameEnd(moveData.winner, 'moveUpdate - game over');
          
          // Add 1 second delay for players to see the final move
          showGameOverNotification('Game Over', message);
          setActiveTimer(null);
        } else {
          setActiveTimer(moveData.currentPlayer);
        }
      }); 
      newSocket.on('gameEnd', (data) => {
        setGameState(prev => ({ ...prev, gameStatus: 'finished' }));
        setActiveTimer(null);
        
        // Clear inGame flag when game ends
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
          FirestoreService.setUserInGame(currentUser.uid, false);
        }
        
        // Update timers if provided (for timeout scenarios)
        if (data.timers) {
          setTimers(data.timers);
        }
        
        // Add 1 second delay for players to see the final move the yugo  system according to the system ytoy weare  working io the project shees ikram 
        setTimeout(() => {
          let message = '';
          if (data.reason === 'draw') {
            message = 'The game has ended in a draw by mutual agreement.';
          } else if (data.reason === 'resignation') {
            const winnerName = getWinnerName(data.winner, 'online', authState, gameState, opponentName);
            message = `${winnerName} wins by resignation!`;
          } else if (data.reason === 'timeout') {
            const winnerName = getWinnerName(data.winner, 'online', authState, gameState, opponentName);
            message = `${winnerName} wins on time!`;
          } else {
            const winnerName = getWinnerName(data.winner, 'online', authState, gameState, opponentName);
            message = `${winnerName} wins!`;
          }
          
        setNotification({
            title: data.reason === 'timeout' ? 'Time Out' : (data.reason === 'draw' ? 'Game Drawn' : 'Game Over'),
            message,
          show: true
        });
        }, 1000);
      });

      newSocket.on('opponentDisconnected', (data) => {
  console.log('Opponent disconnected:', data);
  setOpponentDisconnected(true);
});

newSocket.on('opponentReconnected', () => {
  console.log('Opponent reconnected');
  setOpponentDisconnected(false);
});

newSocket.on('gameReconnected', (data) => {
  console.log('Reconnected to existing game:', data);
  
  // Set up the game state similar to gameStart
  setGameId(data.gameId);
  setPlayerColor(data.playerColor);
  setOpponentName(data.opponentName);
  opponentNameRef.current = data.opponentName; // Update ref for closure access
  setGameState(prev => ({
    ...prev,
    ...data.gameState,
    gameStatus: 'active'
  }));
  setTimers(data.timers);
  setActiveTimer(data.gameState.currentPlayer);
  setOpponentDisconnected(false);
  setIsGameStarted(true);
  
  // Set game mode and hide menus
  setGameMode('online');
  setShowMatchmaking(false);
  setIsSearchingMatch(false);
  
  console.log('Game reconnection complete');
});

      // Debug: Listen for all socket events
      newSocket.onAny((event, ...args) => {
        console.log(`Socket event received: ${event}`, args);
      });

      // Rematch event handlers
      newSocket.on('rematchRequested', (data) => {
        console.log('*** REMATCH REQUESTED EVENT RECEIVED ***');
        console.log('Rematch requested by:', data.requesterName, 'Full data:', data);
        setRematchState({
          requested: true,
          fromPlayer: data.requesterName,
          requestedBy: data.requesterName,
          waitingForResponse: false
        });
        
        // Force update the notification to show the rematch request
        setNotification(prev => ({
          ...prev,
          show: true // Make sure modal stays open
        }));
      });

      newSocket.on('rematchRequestSent', () => {
        console.log('Rematch request sent confirmation received');
        setRematchState(prev => ({
          ...prev,
          waitingForResponse: true
        }));
        showToast('Rematch request sent to opponent');
      });

      // Around line 2051-2088
newSocket.on('rematchAccepted', (data) => {
  console.log('Rematch accepted, starting new game:', data);
  
  // Exit review mode immediately if currently in review
  setIsReviewMode(false);
  setCurrentReviewMove(0);
  setOriginalGameState(null);
  
  // Reset rematch state
  setRematchState({
    requested: false,
    fromPlayer: null,
    requestedBy: '',
    waitingForResponse: false
  });
  
  // CRITICAL FIX: Explicitly clear the game state to remove all remnants
  // Don't use spread operator which might keep old values
  setGameState({
    board: data.gameState.board,
    currentPlayer: data.gameState.currentPlayer,
    scores: data.gameState.scores,
    gameStatus: 'active',
    lastMove: null,  // Explicitly null to clear last move highlight
    players: data.gameState.players,
    igoLine: null    // Explicitly null to clear green igo line
  });
  
  // Clear animation states
  setNewlyPlacedDots(new Set());
  setFadingDots(new Set());
  
  // Set up new game identifiers
  setGameId(data.gameId);
  setPlayerColor(data.playerColor);
  setOpponentName(data.opponentName);
  opponentNameRef.current = data.opponentName;
  setOpponentDisconnected(false);
  setMoveHistory([]);
  setNotification({ title: '', message: '', show: false });
  
  // Reset game result recording flag for new game
  setGameResultRecorded(false);
  
  // Reset timers from server data
  if (data.timers) {
    setTimers(data.timers);
    setActiveTimer(data.gameState.currentPlayer);
  }
  
  showToast(`Rematch started - you are now playing as ${data.playerColor}`);
});

      newSocket.on('rematchDeclined', () => {
        console.log('Rematch declined by opponent');
        setRematchState({
          requested: false,
          fromPlayer: null,
          requestedBy: '',
          waitingForResponse: false
        });
        // Close the modal completely and show toast notification
        setNotification({
          title: '',
          message: '',
          show: false
        });
        showToast('Opponent declined the rematch');
      });

      // Draw offer events
      newSocket.on('drawOffered', (data) => {
        console.log('Draw offer received from opponent');
        setPendingDrawFrom(data.fromPlayer);
        setShowDrawOffer(true);
      });

      newSocket.on('drawAccepted', () => {
        console.log('Draw offer accepted');
        setGameState(prev => ({ ...prev, gameStatus: 'finished' }));
        
        // Record the draw using centralized function
        recordGameEnd('draw', 'drawAccepted - mutual agreement');
        
        // Keep isGameStarted true so move history remains visible for review
        // setIsGameStarted(false);  // Removed - players should be able to review after draw
        // Add 1 second delay for players to see the final position
        setTimeout(() => {
          setNotification({
            title: 'Game Drawn',
            message: 'The game has ended in a draw by mutual agreement.',
            show: true
          });
        }, 1000);
        setActiveTimer(null);
      });

      newSocket.on('drawDeclined', () => {
        console.log('Draw offer declined');
        showToast('Opponent declined the draw offer');
      });

      // Room-based multiplayer event handlers
      newSocket.on('roomCreated', (data) => {
        setCurrentRoom({
          code: data.roomCode,
          isHost: true,
          hostName: data.playerName,
          status: 'waiting'
        });
        setShowRoomModal(false);
        showToast(`Room ${data.roomCode} created! Share this code with your friend.`);
      });

      newSocket.on('roomJoined', (data) => {
        console.log('roomJoined event received:', data);
        
        // Update room state for both host and guest
        setCurrentRoom(prev => {
          const isJoiningGuest = !prev; // If no previous room state, this socket is the guest joining
          
          if (isJoiningGuest) {
            // This is the guest joining
            showToast(`Joined room ${data.roomCode}!`);
            return {
              code: data.roomCode,
              isHost: false,
              hostName: data.host.name,
              guestName: data.guest.name,
              status: data.status
            };
          } else {
            // This is the host receiving the update that guest joined
            showToast(`${data.guest.name} joined the room!`);
            return {
              ...prev,
              guestName: data.guest.name,
              status: data.status
            };
          }
        });
        setShowRoomModal(false);
      });

      newSocket.on('guestLeft', (data) => {
        if (currentRoom && currentRoom.code === data.roomCode) {
          setCurrentRoom(prev => prev ? {
            ...prev,
            guestName: undefined,
            status: 'waiting'
          } : null);
          showToast(data.reason === 'disconnected' ? 'Guest disconnected' : 'Guest left the room');
        }
      });

      newSocket.on('roomClosed', (data) => {
        setCurrentRoom(null);
        showToast(data.message);
      });

      newSocket.on('roomError', (data) => {
        showToast(data.message);
      });

      return () => {
        newSocket.close();
      };
    }
  }, [gameMode, authState.isGuest, authState.user]);

  // Timer logic - local countdown for ALL games, server sync for online games
useEffect(() => {
  if (!timerEnabled || !isGameStarted || gameState.gameStatus !== 'active' || !activeTimer) {
    return;
  }

  const interval = setInterval(() => {
    setTimers(prev => {
      const newTimers = { ...prev };
      newTimers[activeTimer] -= 1;
      
      if (newTimers[activeTimer] <= 0) {
        // Time out
        const winner = activeTimer === 'white' ? 'black' : 'white';
        setGameState(prev => ({ ...prev, gameStatus: 'finished' }));
        
        // For online games, server will handle timeout - just update display
        if (gameMode !== 'online') {
          const winnerName = getWinnerName(winner, gameMode, authState, gameState, opponentName);
          showGameOverNotification('Time Out', `${winnerName} wins on time!`);
        }
        setActiveTimer(null);
      }
      
      return newTimers;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [timerEnabled, isGameStarted, gameState.gameStatus, activeTimer, gameMode]);



  // Navigation functions
  const handlePlayClick = useCallback(() => {
    setCurrentPage('game');
  }, []);

  const handleHowToPlayClick = useCallback(() => {
    setShowTutorial(true);
    setTutorialStep(0);
  }, []);

  const handleHomeClick = useCallback(() => {
    setCurrentPage('landing');
  }, []);

  const handleBattleReportClick = useCallback(() => {
    if (authState.isAuthenticated && authState.user) {
      setShowBattleReportModal(true);
    } else {
      setAuthModalMode('signin');
      setAuthModalOpen(true);
    }
  }, [authState.isAuthenticated, authState.user]);

  const handleLeaderboardClick = useCallback(() => {
    setCurrentPage('leaderboard');
  }, []);

  const handleAboutClick = useCallback(() => {
    setCurrentPage('about');
  }, []);


  // Helper function to initialize timers
  const initializeTimers = () => {
    if (timerEnabled) {
      const totalSeconds = minutesPerPlayer * 60;
      setTimers({ white: totalSeconds, black: totalSeconds });
    }
  };

  // Helper function to show game over notification with delay
  const showGameOverNotification = (title: string, message: string, delay: number = 1000) => {
    setTimeout(() => {
      setNotification({
        title,
        message,
        show: true
      });
    }, delay);
  };



  // Start timer when game starts or player changes
  useEffect(() => {
    if (isGameStarted && gameState.gameStatus === 'active' && timerEnabled) {
      setActiveTimer(gameState.currentPlayer);
    }
  }, [isGameStarted, gameState.currentPlayer, gameState.gameStatus, timerEnabled]);

  // Request timer sync when reconnecting to online game
  useEffect(() => {
    if (socket && gameId && gameMode === 'online' && isGameStarted) {
      // Request current timer state when reconnecting
      socket.emit('requestTimerSync', { gameId });
    }
  }, [socket, gameId, gameMode, isGameStarted]);

  // Authentication handlers
  const handleLoginWrapper = async (email: string, password: string) => {
    await handleLogin(email, password, setAuthError, setAuthState, setShowLogin, showToast);
  };

  const handleSignupWrapper = async (email: string, username: string, password: string) => {
    await handleSignup(email, username, password, setAuthError, setAuthState, setShowSignup, showToast);
  };

  const handlePlayAsGuestWrapper = () => {
    handlePlayAsGuest(setAuthState, setShowMatchmaking);
  };

  const handleLogoutWrapper = async () => {
    try {
      // Update user online status and clear inGame flag before signing out
      if (authState.isAuthenticated && authState.user) {
        const { FirestoreService } = await import('./services/firestoreService');
        await FirestoreService.updateUserOnlineStatus(authState.user.id, false);
        await FirestoreService.setUserInGame(authState.user.id, false);
        console.log('📴 User online status set to false and inGame cleared');
      }
      
      // Use Firebase Auth signOut
      const { AuthService } = await import('./services/authService');
      await AuthService.signOut();
      
      // Also clear any custom API tokens
      localStorage.removeItem('authToken');
      
      // Reset game state
      setGameMode('local');
      resetGame();
      showToast('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Error logging out');
    }
  };

  // Function to refresh auth state after username setup
  const handleUsernameSet = useCallback(async () => {
    try {
      const { AuthService } = await import('./services/authService');
      const { FirestoreService } = await import('./services/firestoreService');
      
      // Get current user
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        // Fetch updated user data from Firestore
        const userData = await FirestoreService.getUserData(currentUser.uid);
        
        if (userData) {
          setAuthState({
            isAuthenticated: true,
            user: {
              id: userData.uid,
              username: userData.username,
              email: userData.email,
              stats: {
                gamesPlayed: userData['total games played'],
                wins: userData.no?.['of wins'] || 0,
                losses: userData.no?.['of loss'] || 0
              }
            },
            isGuest: false
          });
          console.log('🔄 Auth state refreshed after username setup');
        }
      } else {
        // User is signed out (e.g., for email verification)
        // Reset auth state to reflect that user is not authenticated
        setAuthState({
          isAuthenticated: false,
          user: null,
          isGuest: false
        });
        console.log('🔄 Auth state reset - user signed out');
      }
    } catch (error) {
      console.error('❌ Error refreshing auth state:', error);
    }
  }, []);

  // Handle stats button click
   // Handle stats button click
   const handleViewStatsWrapper = async () => {
    if (!authState.isAuthenticated || !authState.user) {
      setShowSettings(false);
      showToast('Please sign in to view your statistics');
      setAuthModalMode('signin');
      setAuthModalOpen(true);
      return;
    }

    // Close settings and open battle report modal instead of navigating
    setShowSettings(false);
    setShowBattleReportModal(true);
  };
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const makeLocalMove = useCallback((row: number, col: number) => {
    // Check basic validity first
    if (!isValidMove(gameState.board, row, col, gameState.currentPlayer)) {
    if (wouldCreateLineTooLong(gameState.board, row, col, gameState.currentPlayer)) {
      showToast("Illegal move. You may not create a line longer than 4 of your own color");
      }
      return;
    }
    
    const currentPlayer = gameState.currentPlayer;
    const newBoard = copyBoard(gameState.board);
    
    // Place the migo
    newBoard[row][col] = { color: currentPlayer, isYugo: false };
    
    // Check for yugos
    const yugos = checkForYugos(newBoard, row, col, currentPlayer);
    const { yugoType, removedCells } = processYugos(newBoard, yugos, row, col);
    
            // Trigger fade-out animation for removed dots
    if (removedCells.length > 0) {
      addFadeOutAnimation(removedCells);
    }
    
    // Trigger bounce-in animation for newly placed dot
    addNewDotAnimation(row, col);
    
    // If yugos were formed, make this cell a yugo
    if (yugoType) {
      newBoard[row][col] = { color: currentPlayer, isYugo: true, yugoType };
    }
    
    // Update scores
    const newScores = {
      white: countYugos(newBoard, 'white'),
      black: countYugos(newBoard, 'black')
    };
    
    // Check for igo (winning condition)
    const igo = checkForIgo(newBoard, row, col, currentPlayer);
    let gameOver = false;
    let winner: 'white' | 'black' | 'draw' | null = null;
    
    // Play appropriate sound based on what happened
    if (igo) {
      gameOver = true;
      winner = currentPlayer;
      playSound('igo'); // Igo sound takes priority
    } else if (yugoType) {
      playSound('yugo'); // Yugo sound if no igo
    } else {
      playSound('migo'); // Regular migo placement
    }
    
    if (!igo) {
      // Check if next player has legal moves
      const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
      if (!hasLegalMoves(newBoard, nextPlayer)) {
        gameOver = true;
        if (newScores.white > newScores.black) winner = 'white';
        else if (newScores.black > newScores.white) winner = 'black';
        else winner = 'draw';
      }
    }
    
    // Add to move history
    setMoveHistory(prev => [
      ...prev,
      {
        row,
        col,
        player: currentPlayer,
        yugos: yugos.length,
        moveNumber: prev.length + 1
      }
    ]);
    
    if (gameOver) {
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        scores: newScores,
        lastMove: { row, col, player: currentPlayer },
        gameStatus: 'finished',
        igoLine: igo || null
      }));
      
      let message = '';
      if (winner === 'draw') {
        // Check if it's a Wego draw (no legal moves, equal yugos)
        if (!hasLegalMoves(newBoard, currentPlayer)) {
          message = 'The game ends in a Wego as a draw!';
        } else {
          message = 'Game ended in a draw!';
        }
      } else if (igo) {
        const winnerName = getWinnerName(winner as 'white' | 'black', gameMode, authState, gameState, opponentName);
        message = `${winnerName} wins with an Igo!`;
      } else {
        const winnerName = getWinnerName(winner as 'white' | 'black', gameMode, authState, gameState, opponentName);
        message = `${winnerName} wins by yugo count!`;
      }
      
        // Record game result for authenticated users (ONLY FOR HUMAN VS HUMAN GAMES)
        if (authState.isAuthenticated && gameMode === 'online') {
          console.log('🎮 Recording game result (Human vs Human):', { 
            gameMode, 
            winner, 
            players: gameState.players,
            isAuthenticated: authState.isAuthenticated,
            userId: authState.user?.id 
          });
          
          // Determine opponent name - for online games, it's the other player's username
          const opponentName = gameState.players.white === authState.user?.username 
            ? gameState.players.black 
            : gameState.players.white;
          
          const playerColor = (gameState.players.white === authState.user?.username) ? 'white' : 'black';
          
          import('./services/authService').then(({ AuthService }) => {
            if (winner === 'white' && gameState.players.white === authState.user?.username) {
              console.log('📊 Recording WIN for white player (human vs human)');
              AuthService.recordGameResult('win', opponentName, playerColor, gameMode);
            } else if (winner === 'black' && gameState.players.black === authState.user?.username) {
              console.log('📊 Recording WIN for black player (human vs human)');
              AuthService.recordGameResult('win', opponentName, playerColor, gameMode);
            } else if (winner === 'draw') {
              console.log('📊 Recording DRAW (human vs human)');
              AuthService.recordGameResult('draw', opponentName, playerColor, gameMode);
            } else {
              console.log('📊 Recording LOSS for human player (human vs human)');
              AuthService.recordGameResult('loss', opponentName, playerColor, gameMode);
            }
          }).catch((error) => {
            console.error('❌ Error recording game result:', error);
          });
        } else {
          console.log('🚫 Not recording game result:', { 
            isAuthenticated: authState.isAuthenticated, 
            gameMode, 
            reason: !authState.isAuthenticated ? 'not authenticated' : gameMode !== 'online' ? 'not human vs human (AI or local game)' : 'unknown' 
          });
        }
      
      // Add 1 second delay for players to see the final move
      setTimeout(() => {
      setNotification({
        title: 'Game Over',
        message,
        show: true
      });
      }, 1000);
      setActiveTimer(null);
    } else {
      // Switch to next player
      const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        currentPlayer: nextPlayer,
        scores: newScores,
        lastMove: { row, col, player: currentPlayer },
        gameStatus: 'active',
        igoLine: null
      }));
    }
  }, [gameState.board, gameState.currentPlayer, setMoveHistory, setGameState, setNotification, setActiveTimer, addFadeOutAnimation, addNewDotAnimation, playSound, showToast]);

  // AI move logic with human-like thinking time
  useEffect(() => {
    console.log('AI-4 effect check:', {
      isGameStarted,
      gameStatus: gameState.gameStatus,
      gameMode,
      playerColor,
      currentPlayer: gameState.currentPlayer,
    });
    const aiTurnInStandardMode = isGameStarted &&
      gameState.gameStatus === 'active' &&
      (gameMode === 'ai-1' || gameMode === 'ai-2' || gameMode === 'ai-3' || gameMode === 'ai-4') &&
      playerColor &&
      gameState.currentPlayer !== playerColor;

    const aiTurnInSelfPlay = false;

    if (aiTurnInStandardMode || aiTurnInSelfPlay) {
      // AI's turn
      let minThinkTime, maxThinkTime;
      const currentEngine = gameMode as 'ai-1' | 'ai-2' | 'ai-3' | 'ai-4';

      if (currentEngine === 'ai-1') {
        minThinkTime = 1000;
        maxThinkTime = 2000;
      } else if (currentEngine === 'ai-2') {
        minThinkTime = 1500;
        maxThinkTime = 2500;
      } else if (currentEngine === 'ai-3') {
        minThinkTime = 2000;
        maxThinkTime = 4000;
      } else {
        minThinkTime = 2500;
        maxThinkTime = 5000;
      }
      const thinkTime = Math.floor(Math.random() * (maxThinkTime - minThinkTime + 1)) + minThinkTime;
      console.log(`${currentEngine.toUpperCase()} thinking for ${thinkTime}ms...`);
      const timeout = setTimeout(() => {
        let aiMove;
        if (currentEngine === 'ai-4') {
          // Count total pieces on the board
          const totalPieces = gameState.board.flat().filter(cell => cell !== null).length;
          // Use depth 3 for first 8 moves, then depth 2
          const maxDepth = totalPieces < 8 ? 3 : 2;
          aiMove = iterativeDeepeningMinimax(gameState.board, 3000, 'black', globalTransTable, maxDepth);
        } else {
          // AI-1, AI-2, AI-3 logic
          const validMoves: { row: number; col: number; score: number }[] = [];
          for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
              if (isValidMove(gameState.board, row, col, 'black')) {
                const score = evaluateMove(gameState.board, row, col, 'black', currentEngine as 'ai-1' | 'ai-2' | 'ai-3');
                validMoves.push({ row, col, score });
              }
            }
          }
          if (validMoves.length > 0) {
            validMoves.sort((a, b) => b.score - a.score);
            if (currentEngine === 'ai-1') {
              const topMoves = validMoves.slice(0, Math.min(3, validMoves.length));
              aiMove = topMoves[Math.floor(Math.random() * topMoves.length)];
            } else if (currentEngine === 'ai-2') {
              const criticalMoves = validMoves.filter(move => move.score >= 800);
              if (criticalMoves.length > 0) {
                aiMove = criticalMoves[0];
              } else {
                const topMoves = validMoves.slice(0, Math.min(5, validMoves.length));
                aiMove = topMoves[Math.floor(Math.random() * topMoves.length)];
              }
            } else { // ai-3
              const criticalMoves = validMoves.filter(move => move.score >= 9000);
              if (criticalMoves.length > 0) {
                aiMove = criticalMoves[0];
              } else {
                const winningMoves = validMoves.filter(move => move.score >= 1000);
                if (winningMoves.length > 0) {
                  aiMove = winningMoves[0];
                } else {
                  const topMoves = validMoves.slice(0, Math.min(5, validMoves.length));
                  aiMove = topMoves[0];
                }
              }
            }
          }
        }
        if (aiMove) {
          // Safety check: ensure the AI move is still valid before executing
          if (!isValidMove(gameState.board, aiMove.row, aiMove.col, 'black')) {
            console.error(`${currentEngine.toUpperCase()} selected invalid move:`, aiMove);
            // Fallback: pick the first valid move
            const fallbackMoves = getAllValidMoves(gameState.board, 'black');
            if (fallbackMoves.length > 0) {
              aiMove = fallbackMoves[0];
              console.log(`${currentEngine.toUpperCase()} fallback move:`, aiMove);
            } else {
              console.error(`${currentEngine.toUpperCase()} has no valid moves!`);
              aiMove = null;
            }
          }
          
          if (aiMove) {
            console.log(`${currentEngine.toUpperCase()} selected move:`, aiMove);
            makeLocalMove(aiMove.row, aiMove.col);
          }
        }
      }, thinkTime);
      return () => clearTimeout(timeout);
    }
  }, [gameState.currentPlayer, gameState.gameStatus, isGameStarted, gameMode, gameState.board, makeLocalMove, playerColor]);

  const handleCellClick = (row: number, col: number) => {
    if (!isGameStarted || gameState.gameStatus !== 'active' || isReviewMode) return;

    if (gameMode === 'online') {
      if (!playerColor || gameState.currentPlayer !== playerColor) return;
      if (gameState.board[row][col] !== null) return;
      if (wouldCreateLineTooLong(gameState.board, row, col, playerColor)) {
        showToast("Illegal move. You may not create a line longer than 4 of your own color");
        return;
      }
      socket?.emit('makeMove', { gameId, row, col });
    } else {
      // Local game (human vs human or vs AI)
      if (
        (gameMode === 'ai-1' || gameMode === 'ai-2' || gameMode === 'ai-3') &&
        playerColor &&
        gameState.currentPlayer !== playerColor
      ) {
        // Not human's turn
        return;
      }
      makeLocalMove(row, col);
    }
  };
//working
  const startGame = () => {
    console.log('===== START GAME CLICKED =====');
    console.log('Game mode:', gameMode);
    console.log('Auth state:', {
      isAuthenticated: authState.isAuthenticated,
      isGuest: authState.isGuest,
      user: authState.user,
    });
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Current URL:', window.location.href);
    
    // Close mobile controls modal when starting any game
    setShowMobileControls(false);
    
    if (gameMode === 'online') {
      console.log('📡 ONLINE MODE SELECTED');
      // Check authentication status for online play
      if (!authState.isAuthenticated && !authState.isGuest) {
        console.log('🔐 User not authenticated - showing login modal');
        console.log('Setting showLogin to true...');
        // Show login modal directly for a more streamlined experience
        setShowLogin(true);
        console.log('Login modal should now be visible');
        return;
      }
      console.log('✅ User authenticated - showing matchmaking modal');
      console.log('Setting showMatchmaking to true...');
      setShowMatchmaking(true);
      console.log('Matchmaking modal should now be visible');
    } else {
      // Local game start
      if (gameMode === 'ai-1' || gameMode === 'ai-2' || gameMode === 'ai-3' || gameMode === 'ai-4') {
        startAIGame();
        return;
      }
      
      const newBoard = copyBoard(INITIAL_BOARD);
      setGameState({
        board: newBoard,
        currentPlayer: 'white',
        scores: { white: 0, black: 0 },
        gameStatus: 'active',
        lastMove: null,
        players: { 
          white: 'White', 
          black: 'Black'
        },
        igoLine: null
      });
      setIsGameStarted(true);
      setMoveHistory([]);
      
      if (timerEnabled) {
        initializeTimers();
        setActiveTimer('white');
      }
    }
  };

  const findMatch = async () => {
    console.log('findMatch called', {
      hasSocket: !!socket,
      socketConnected: socket?.connected,
      socketId: socket?.id
    });
    
    // Check if user is already in a game on another device/tab
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      const isAlreadyInGame = await FirestoreService.checkUserInGame(currentUser.uid);
      
      if (isAlreadyInGame) {
        showToast('You are already in a game on another device or tab');
        return;
      }
      
      // Mark user as in matchmaking/game
      await FirestoreService.setUserInGame(currentUser.uid, true);
    }
    
    if (socket) {
      console.log('Emitting findMatch to server...');
      // Always use standard settings for online multiplayer
      const standardSettings = {
        timerEnabled: true,
        minutesPerPlayer: 10,
        incrementSeconds: 0
      };
      console.log('Using standard timer settings for online game:', standardSettings);
      socket.emit('findMatch', standardSettings);
      setIsSearchingMatch(true);
    } else {
      console.error('No socket available for findMatch');
      // Clear inGame flag if socket not available
      if (currentUser) {
        await FirestoreService.setUserInGame(currentUser.uid, false);
      }
    }
  };

  const cancelMatchmaking = async () => {
    if (socket) {
      socket.emit('cancelMatchmaking');
    }
    
    // Clear inGame flag when canceling matchmaking
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      await FirestoreService.setUserInGame(currentUser.uid, false);
    }
    
    setShowMatchmaking(false);
    setIsSearchingMatch(false);
  };

  const handlePrivateRoomClick = () => {
    // Check if user is authenticated (not guest, not unauthenticated)
    if (!authState.isAuthenticated || authState.isGuest) {
      // Close matchmaking modal first
      setShowMatchmaking(false);
      // Show toast message and open sidebar auth modal
      showToast('Please sign in to play in private rooms');
      setAuthModalMode('signin');
      setAuthModalOpen(true);
      return;
    }
    // User is authenticated, show room modal
    setShowRoomModal(true);
  };

  const requestRematch = () => {
    console.log('Request rematch clicked!', {
      hasSocket: !!socket,
      gameId,
      socketConnected: socket?.connected,
      gameStatus: gameState.gameStatus,
      socketId: socket?.id
    });

    if (!socket || !gameId || gameState.gameStatus !== 'finished') {
      console.log('Cannot request rematch - missing requirements');
      return;
    }

    console.log('Emitting requestRematch to server...', {
      gameId,
      socketId: socket.id,
      connected: socket.connected
    });

    socket.emit('requestRematch', { gameId });
  };

  const respondToRematch = (accept: boolean) => {
    if (socket && gameId) {
      socket.emit('respondToRematch', { gameId, accept });
    }
    
    if (accept) {
      // Exit review mode immediately when accepting rematch
      setIsReviewMode(false);
      setCurrentReviewMove(0);
      setOriginalGameState(null);
    } else {
      // Reset rematch state and close modal on decline
      setRematchState({
        requested: false,
        fromPlayer: null,
        requestedBy: '',
        waitingForResponse: false
      });
      setNotification({
        title: '',
        message: '',
        show: false
      });
    }
  };

  const resignGame = () => {
    // Show confirmation modal instead of immediately resigning
    setShowResignConfirmation(true);
  };

  const confirmResignation = () => {
    setShowResignConfirmation(false);
    
    if (gameMode === 'online' && socket && gameId) {
      // Online game - send resign to server
      socket.emit('resign', { gameId });
    } else {
      // Local game - handle resignation locally
      const winner = gameState.currentPlayer === 'white' ? 'black' : 'white';
      const winnerName = getWinnerName(winner, gameMode, authState, gameState, opponentName);
      setGameState(prev => ({ ...prev, gameStatus: 'finished' }));
      setNotification({
        title: 'Game Over',
        message: `${winnerName} wins by resignation!`,
        show: true
      });
      setIsGameStarted(false);
      setActiveTimer(null);
    }
  };

  const cancelResignation = () => {
    setShowResignConfirmation(false);
  };

  // Desktop: Show resign/draw modal
  const showResignDrawOptions = () => {
    setShowResignDrawModal(true);
  };

  const handleResignFromModal = () => {
    setShowResignDrawModal(false);
    setShowResignConfirmation(true);
  };

  const handleDrawFromModal = () => {
    setShowResignDrawModal(false);
    offerDraw();
  };

  const cancelResignDrawModal = () => {
    setShowResignDrawModal(false);
  };

  // Mobile: Direct draw offer
  const offerDraw = () => {
    // Only allow draw offers in online multiplayer games
    if (gameMode !== 'online') {
      showToast('Draw offers are only available in online multiplayer games');
      return;
    }
    
    if (gameMode === 'online' && socket && gameId) {
      // Online game - send draw offer to server
      socket.emit('draw-offer', { gameId });
      showToast('Draw offer sent');
    }
  };

  const respondToDrawOffer = (accept: boolean) => {
    setShowDrawOffer(false);
    setPendingDrawFrom(null);
    
    if (accept) {
      if (gameMode === 'online' && socket && gameId) {
        // Online game - send draw acceptance to server
        socket.emit('draw-accept', { gameId });
      } else {
        // Local game - end game as draw
        setGameState(prev => ({ ...prev, gameStatus: 'finished' }));
        setIsGameStarted(false);
        // Add 1 second delay for players to see the final position
        setTimeout(() => {
          setNotification({
            title: 'Game Drawn',
            message: 'The game has ended in a draw by mutual agreement.',
            show: true
          });
        }, 1000);
        setActiveTimer(null);
      }
    } else {
      if (gameMode === 'online' && socket && gameId) {
        // Online game - send draw rejection to server
        socket.emit('draw-decline', { gameId });
      } else {
        // Local game - just close the modal
        showToast('Draw offer declined');
      }
    }
  };

  // Room-based multiplayer functions
  const createRoom = async () => {
    // Check if user is already in a game
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      const isAlreadyInGame = await FirestoreService.checkUserInGame(currentUser.uid);
      
      if (isAlreadyInGame) {
        showToast('You are already in a game on another device or tab');
        return;
      }
      
      // Mark user as in game
      await FirestoreService.setUserInGame(currentUser.uid, true);
    }
    
    if (socket) {
      socket.emit('createRoom');
    }
  };

  const joinRoom = async () => {
    if (socket && roomCodeInput.trim()) {
      // Check if user is already in a game
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        const isAlreadyInGame = await FirestoreService.checkUserInGame(currentUser.uid);
        
        if (isAlreadyInGame) {
          showToast('You are already in a game on another device or tab');
          return;
        }
        
        // Mark user as in game
        await FirestoreService.setUserInGame(currentUser.uid, true);
      }
      
      socket.emit('joinRoom', { roomCode: roomCodeInput.trim() });
      setRoomCodeInput('');
    }
  };

  const leaveRoom = async () => {
    if (socket && currentRoom) {
      socket.emit('leaveRoom', { roomCode: currentRoom.code });
      setCurrentRoom(null);
      
      // Clear inGame flag when leaving room
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        await FirestoreService.setUserInGame(currentUser.uid, false);
      }
    }
  };

  const startRoomGame = () => {
    console.log('startRoomGame called', { socket: !!socket, currentRoom, isHost: currentRoom?.isHost });
    if (socket && currentRoom && currentRoom.isHost) {
      console.log('Emitting startRoomGame for room:', currentRoom.code);
      socket.emit('startRoomGame', { roomCode: currentRoom.code });
    } else {
      console.log('Cannot start room game - missing requirements');
    }
  };

  const resetGame = async () => {
    // Clear inGame flag when resetting game
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      await FirestoreService.setUserInGame(currentUser.uid, false);
    }
    
    setGameState({
      board: INITIAL_BOARD,
      currentPlayer: 'white',
      scores: { white: 0, black: 0 },
      gameStatus: 'waiting',
      lastMove: null,
      players: { white: 'White', black: 'Black' },
      igoLine: null
    });
    setIsGameStarted(false);
    setMoveHistory([]);
    setActiveTimer(null);
    setPlayerColor(null);
    setOpponentName('');
    opponentNameRef.current = ''; // Clear ref too
    setGameId('');
    // Exit review mode if currently in review
    setIsReviewMode(false);
    setCurrentReviewMove(0);
    // Reset game result recording flag for new game
    setGameResultRecorded(false);
    setOriginalGameState(null);
    setIsProcessingMove(false);
    setRematchState({
      requested: false,
      fromPlayer: null,
      requestedBy: '',
      waitingForResponse: false
    });
    if (timerEnabled) {
      initializeTimers();
    }
    
    // Clear any active animations
    setNewlyPlacedDots(new Set());
    setFadingDots(new Set());
  };

  const getNotation = (col: number, row: number): string => {
    const colLetter = String.fromCharCode(97 + col); // a-h
    const rowNumber = 8 - row; // 8-1
    return colLetter + rowNumber;
  };

  // Tutorial steps configuration
  const tutorialSteps = [
    {
      title: "Basic Gameplay",
      message: "<span style=\"color: red; font-weight: bold;\">Migoyugo</span> is played on an 8×8 board.<br>Players alternate turns,<br>white moves first, then black,<br>placing pieces called <span style=\"color: red; font-weight: bold;\">Migos</span> on empty squares.",
      demo: "board"
    },
    {
      title: "Building a Yugo",
      message: "Your first tactical step is to create a <span style=\"color: red; font-weight: bold;\">Yugo</span>. A Yugo is created when you build an unbroken line of exactly 4 pieces of your own color, horizontal, vertical, or diagonal.<br><br>When a <span style=\"color: red; font-weight: bold;\">Yugo</span> is created, it is identified with a red mark in the middle of the piece. At that same moment, all Migos in the line of 4 disappear, while any Yugos already in that line remain. Yugos can never be moved or removed from the board.",
      demo: "yugo-formation"
    },
    {
      title: "No Long Lines",
      message: "At no time may either player create a line of more than 4 in a row of any combination of Migos and/or Yugos <span style=\"color: red; font-weight: bold;\">of the same color</span>.",
      demo: "long-line"
    },
    {
      title: "The Winning Goal",
      message: "Win by forming an <span style=\"color: red; font-weight: bold;\">Igo</span>. An Igo is an unbroken line of 4 Yugos of one color, horizontal, vertical or diagonal.",
      demo: "igo"
    },
    {
      title: "Alternative Win",
      message: "<b>No legal moves:</b><br>If at any time either player is unable to play a legal move, or all 64 squares are covered, the game ends with a <span style=\"color: red; font-weight: bold;\">Wego</span>, and the player with the most Yugos wins. If both players have the same number of Yugos, the game is a draw by Wego.<br><br><b>Timer expiry:</b><br>If players have chosen to play using a timer, the game will end immediately if one player runs out of time, and the opponent will be awarded the win.<br><br><b>Resignation:</b><br>A player may choose to resign a game at any point and this will award the win to their opponent.",
      demo: null
    },
    {
      title: "How to Start a Multiplayer Game",
      message: `
        <b>Select 'Opponent':</b><br>
        On the main menu, find 'Opponent', and select 'Online Multiplayer'.<br><br>
        <b>Choose How to Play:</b><br>
        <ul style='margin:0 0 0 1.2em;padding:0;'>
          <li><b>Quick Match:</b> Click "Quick Match" to be paired with a random online opponent. The game will start automatically when a match is found.</li>
          <li><b>Create a Room:</b> Click "Create Room" to start a private game. You'll get a unique room code to share with a friend.</li>
          <li><b>Join a Room:</b> If your friend has already created a room, enter the room code they give you and click "Join Room."</li>
          <li><b>Play as Guest:</b> If you don't want to sign in, you can choose "Play as Guest" to join multiplayer games without creating an account.</li>
        </ul>
        <br>
        <b>Wait for Your Opponent:</b><br>
        Once both players are in the room (or a match is found), the game will begin automatically.
      `,
      demo: null
    },
    {
      title: "Ready to Play!",
      message: "You have two options - play against a human opponent or try your luck against one of the AI levels.<br><br>You can play with a timer or without.<br>Choose from a 3-minute game or up to an hour on the clock.<br>You can even choose increments from 2 to 10 seconds which add time to your clock after every move.<br>Once you run out of time, it's game over.<br><br>Is it better to build your own Yugos or block your opponent?<br>Will you go for an Igo or fill the board and see who ends up with the most Yugos?<br>The options are endless.<br><br>That's all you need to know!<br>Click 'Start' and enjoy playing <span style=\"color: red; font-weight: bold;\">Migoyugo</span>!",
      demo: null
    }
  ];

  // Tutorial navigation functions
  const nextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      closeTutorial();
    }
  };

  const prevTutorialStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
    }
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    setTutorialStep(0);
  };

  // Review mode functions
  const enterReviewMode = () => {
    if (moveHistory.length === 0) return;
    
    setOriginalGameState({ ...gameState });
    setIsReviewMode(true);
    
    // Clear any active animations
    setNewlyPlacedDots(new Set());
    setFadingDots(new Set());
    
    // Start at the last move (final position) instead of move 0
    const finalMoveIndex = moveHistory.length;
    goToMove(finalMoveIndex);
  };

  const exitReviewMode = () => {
    if (originalGameState) {
      setGameState(originalGameState);
      setOriginalGameState(null);
    }
    setIsReviewMode(false);
    setCurrentReviewMove(0);
    setIsProcessingMove(false);
  };

  const goToMove = useCallback((moveIndex: number) => {
    if (moveIndex < 0 || moveIndex > moveHistory.length || isProcessingMove) return;
    
    setIsProcessingMove(true);
    
    try {
      setCurrentReviewMove(moveIndex);
      
      // Reconstruct board state up to this move
      const board = copyBoard(INITIAL_BOARD);
      let currentPlayer: 'white' | 'black' = 'white';
      
      for (let i = 0; i < moveIndex; i++) {
        const move = moveHistory[i];
        const { row, col, player } = move;
        
        // Place the migo
        board[row][col] = { color: player, isYugo: false };
        
        // Check for yugos and process them
        const yugos = checkForYugos(board, row, col, player);
        const { yugoType } = processYugos(board, yugos, row, col);
        
        // If yugos were formed, make this cell a yugo
        if (yugoType) {
          board[row][col] = { color: player, isYugo: true, yugoType };
        }
        
        currentPlayer = player === 'white' ? 'black' : 'white';
      }
      
      const scores = {
        white: countYugos(board, 'white'),
        black: countYugos(board, 'black')
      };
      
      const lastMove = moveIndex > 0 ? {
        row: moveHistory[moveIndex - 1].row,
        col: moveHistory[moveIndex - 1].col,
        player: moveHistory[moveIndex - 1].player
      } : null;
      
      // Check for igo at the final position if this is the last move
      let igoLine: { row: number; col: number }[] | null = null;
      if (moveIndex === moveHistory.length && lastMove) {
        igoLine = checkForIgo(board, lastMove.row, lastMove.col, lastMove.player);
      }
      
      setGameState(prev => ({
        ...prev,
        board,
        currentPlayer,
        scores,
        lastMove,
        igoLine
      }));
    } finally {
      // Use setTimeout to ensure state updates are processed before allowing next move
      setTimeout(() => setIsProcessingMove(false), 0);
    }
  }, [moveHistory, isProcessingMove]);

  const firstMove = () => {
    goToMove(0);
  };

  const lastMove = () => {
    goToMove(moveHistory.length);
  };

  const previousMove = useCallback(() => {
    if (currentReviewMove > 0) {
      goToMove(currentReviewMove - 1);
    }
  }, [currentReviewMove, goToMove]);

  const nextMove = useCallback(() => {
    if (currentReviewMove < moveHistory.length) {
      goToMove(currentReviewMove + 1);
    }
  }, [currentReviewMove, moveHistory.length, goToMove]);

  // Hold-to-scroll functionality
  const startHoldScroll = (direction: 'prev' | 'next', event?: React.MouseEvent | React.TouchEvent) => {
    event?.preventDefault();
    
    // Clear any existing timeouts/intervals
    if (holdScrollInterval) {
      clearTimeout(holdScrollInterval);
      clearInterval(holdScrollInterval);
      setHoldScrollInterval(null);
    }
    
    const scrollFunction = direction === 'prev' ? previousMove : nextMove;
    
    // Immediate first move
    scrollFunction();
    
    // Wait 0.5 seconds before starting continuous scroll
    const timeout = setTimeout(() => {
      // Then continue scrolling every 500ms (2 moves per second)
      const interval = setInterval(() => {
        scrollFunction();
      }, 500);
      
      setHoldScrollInterval(interval);
    }, 500);
    
    setHoldScrollInterval(timeout);
  };

  const stopHoldScroll = (event?: React.MouseEvent | React.TouchEvent) => {
    event?.preventDefault();
    
    // Clear any existing timeout or interval
    if (holdScrollInterval) {
      clearTimeout(holdScrollInterval);
      clearInterval(holdScrollInterval);
      setHoldScrollInterval(null);
    }
  };

  // Cleanup hold timeout and interval when component unmounts or review mode exits
  useEffect(() => {
    return () => {
      if (holdScrollInterval) {
        clearTimeout(holdScrollInterval);
        clearInterval(holdScrollInterval);
      }
    };
  }, [holdScrollInterval]);

  useEffect(() => {
    if (!isReviewMode) {
      if (holdScrollInterval) {
        clearTimeout(holdScrollInterval);
        clearInterval(holdScrollInterval);
        setHoldScrollInterval(null);
      }
    }
  }, [isReviewMode, holdScrollInterval]);


  const renderCell = (row: number, col: number) => {
    const cell = gameState.board[row][col];
    const cellKey = `${row}-${col}`;
    // Only highlight the current last move
    const isLastMove = gameState.lastMove?.row === row && gameState.lastMove?.col === col;
    const isIgoCell = gameState.igoLine?.some(pos => pos.row === row && pos.col === col) || false;
    const isNewlyPlaced = newlyPlacedDots.has(cellKey);
    const isFading = fadingDots.has(cellKey);
    
    return (
      <div
        key={`${row}-${col}`}
        className={`cell${isLastMove ? ' last-move' : ''}${isIgoCell ? ' igo-cell' : ''}`}
        onClick={() => handleCellClick(row, col)}
      >
        {/* Cell coordinate labels - only show on edges like a chess board */}
        {col === 0 && <div className="cell-row-label">{8 - row}</div>}
        {row === 7 && <div className="cell-col-label">{String.fromCharCode(97 + col)}</div>}
        {cell && (
          <>
            {/* Always render the dot (colored piece) with animation classes */}
            <div className={`dot ${cell.color}${isNewlyPlaced ? ' new-dot' : ''}${isFading ? ' fade-out' : ''}`} />
            {/* If it's a yugo, also render the yugo indicator on top */}
            {cell.isYugo && (
              <div 
                className={`yugo ${cell.yugoType || 'standard'}`}
                title={`Yugo type: ${cell.yugoType || 'standard'}`}
              />
            )}
          </>
        )}
      </div>
    );
  };

  const renderBoard = () => {
    return (
      <div className={`board ${isReviewMode ? 'review-mode' : 'current-state'}`} id="game-board">
        {gameState.board.map((row, rowIndex) =>
          row.map((_, colIndex) => renderCell(rowIndex, colIndex))
        )}
      </div>
    );
  };

  const renderMoveHistory = () => {
    return (
      <>
        <div className="game-log" id="game-log">
          {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, pairIndex) => {
            const whiteMove = moveHistory[pairIndex * 2];
            const blackMove = moveHistory[pairIndex * 2 + 1];
            const moveNumber = pairIndex + 1;
            
            return (
              <div key={pairIndex} className="log-entry">
                <span className="move-number">{moveNumber}.</span>
                <span 
                  className={`white-move ${isReviewMode && whiteMove && currentReviewMove - 1 === pairIndex * 2 ? 'highlighted-move' : ''}`}
                  onClick={() => isReviewMode && whiteMove ? goToMove(pairIndex * 2 + 1) : undefined}
                  style={{ cursor: isReviewMode && whiteMove ? 'pointer' : 'default' }}
                >
                  {whiteMove ? (
                    <span>
                      {getNotation(whiteMove.col, whiteMove.row)}
                      {whiteMove.yugos > 0 && <span className="yugo-indicator">●</span>}
                    </span>
                  ) : ''}
                </span>
                <span 
                  className={`black-move ${isReviewMode && blackMove && currentReviewMove - 1 === pairIndex * 2 + 1 ? 'highlighted-move' : ''}`}
                  onClick={() => isReviewMode && blackMove ? goToMove(pairIndex * 2 + 2) : undefined}
                  style={{ cursor: isReviewMode && blackMove ? 'pointer' : 'default' }}
                >
                  {blackMove ? (
                    <span>
                      {getNotation(blackMove.col, blackMove.row)}
                      {blackMove.yugos > 0 && <span className="yugo-indicator">●</span>}
                    </span>
                  ) : ''}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Review mode controls - NOW OUTSIDE game-log */}
        {isReviewMode && (
          <div id="review-section">
            <div className="review-controls">
              <button 
                className="btn" 
                id="first-move-btn"
                onClick={firstMove}
                disabled={currentReviewMove <= 0}
                title="First Move"
              >
                <span className="arrow-icon">⏮</span>
              </button>
              <button 
                className="btn" 
                id="prev-move-btn"
                onMouseDown={(e) => startHoldScroll('prev', e)}
                onMouseUp={(e) => stopHoldScroll(e)}
                onMouseLeave={(e) => stopHoldScroll(e)}
                onTouchStart={(e) => startHoldScroll('prev', e)}
                onTouchEnd={(e) => stopHoldScroll(e)}
                disabled={currentReviewMove <= 0}
                title="Previous Move (Hold to scroll)"
              >
                <span className="arrow-icon">◀</span>
              </button>
              <span className="move-counter">
                Move {currentReviewMove} of {moveHistory.length}
              </span>
              <button 
                className="btn" 
                id="next-move-btn"
                onMouseDown={(e) => startHoldScroll('next', e)}
                onMouseUp={(e) => stopHoldScroll(e)}
                onMouseLeave={(e) => stopHoldScroll(e)}
                onTouchStart={(e) => startHoldScroll('next', e)}
                onTouchEnd={(e) => stopHoldScroll(e)}
                disabled={currentReviewMove >= moveHistory.length}
                title="Next Move (Hold to scroll)"
              >
                <span className="arrow-icon">▶</span>
              </button>
              <button 
                className="btn" 
                id="last-move-btn"
                onClick={lastMove}
                disabled={currentReviewMove >= moveHistory.length}
                title="Last Move"
              >
                <span className="arrow-icon">⏭</span>
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: '5px' }}>
                <button 
                className="btn" 
                onClick={exitReviewMode}
                style={{ fontSize: '10px', padding: '2px 8px', height: '20px', lineHeight: '1' }}
              >
                Exit Review
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  // Add state for player color choice
  const [playerColorChoice, setPlayerColorChoice] = useState<'white' | 'black' | 'random'>('white');

  // When starting a new AI game, determine playerColor based on playerColorChoice
  const startAIGame = () => {
    // Defensive: default to 'white' if playerColorChoice is null/undefined
    let chosenColor: 'white' | 'black';
    if (playerColorChoice === 'random') {
      chosenColor = Math.random() < 0.5 ? 'white' : 'black';
    } else if (playerColorChoice === 'white' || playerColorChoice === 'black') {
      chosenColor = playerColorChoice;
    } else {
      chosenColor = 'white'; // fallback default
    }
    setPlayerColor(chosenColor);

    // Initialize the game state - White always goes first
    const newBoard = copyBoard(INITIAL_BOARD);
    setGameState({
      board: newBoard,
      currentPlayer: 'white',
      scores: { white: 0, black: 0 },
      gameStatus: 'active',
      lastMove: null,
      players: {
        white: chosenColor === 'white' ? 'human' : `CORE ${gameMode.toUpperCase()}`,
        black: chosenColor === 'black' ? 'human' : `CORE ${gameMode.toUpperCase()}`
      },
      igoLine: null
    });
    setIsGameStarted(true);
    setMoveHistory([]);

    if (timerEnabled) {
      initializeTimers();
      setActiveTimer(chosenColor);
    }
  };

  // Add this helper function near the minimax definition or in the AI-4 section:
  function iterativeDeepeningMinimax(
    board: (Cell | null)[][],
    maxTimeMs: number,
    playerColor: 'white' | 'black',
    transTable: TranspositionTable,
    maxDepth: number = 3 // Add a default max depth cap
  ): { row: number; col: number } | null {
    const start = Date.now();
    let bestMove: { row: number; col: number } | null = null;
    let depth = 1;
    while (depth <= maxDepth) { // Only go up to maxDepth
      const now = Date.now();
      if (now - start > maxTimeMs) break;
      const result = minimax(board, depth, -Infinity, Infinity, true, playerColor, transTable);
      if (result.bestMove) {
        bestMove = result.bestMove;
      }
      depth++;
    }
    return bestMove;
  }

  // AI move selection for different difficulty levels doing for es lint
  // const getAIMove = (
  //   board: (Cell | null)[][],
  //   difficulty: 'ai-1' | 'ai-2' | 'ai-3'
  // ): { row: number; col: number } | null => {
  //   const validMoves: { row: number; col: number; score: number }[] = [];
  //   for (let row = 0; row < 8; row++) {
  //     for (let col = 0; col < 8; col++) {
  //       if (isValidMove(board, row, col, 'black')) {
  //         const score = evaluateMove(board, row, col, 'black', difficulty);
  //         validMoves.push({ row, col, score });
  //       }
  //     }
  //   }
  //   if (validMoves.length === 0) return null;
  //   if (difficulty === 'ai-1') {
  //     validMoves.sort((a, b) => b.score - a.score);
  //     const topMoves = validMoves.slice(0, Math.min(3, validMoves.length));
  //     return topMoves[Math.floor(Math.random() * topMoves.length)];
  //   } else if (difficulty === 'ai-2') {
  //     validMoves.sort((a, b) => b.score - a.score);
  //     const criticalMoves = validMoves.filter(move => move.score >= 800);
  //     if (criticalMoves.length > 0) {
  //       return criticalMoves[0];
  //     }
  //     const topMoves = validMoves.slice(0, Math.min(5, validMoves.length));
  //     return topMoves[Math.floor(Math.random() * topMoves.length)];
  //   } else { // AI-3 now uses MCTS
  //     return mcts(board, 'black', 200, 8);
  //   }
  // };


  // Show landing page first
  if (currentPage === 'landing') {
    return (
      <>
        <LandingPage 
          onPlayClick={handlePlayClick}
          onHowToPlayClick={handleHowToPlayClick} 
          onHomeClick={handleHomeClick}
          onAboutClick={handleAboutClick}
          onBattleReportClick={handleBattleReportClick} 
          onLeaderboardClick={handleLeaderboardClick}
          authState={authState} 
          onLogout={handleLogoutWrapper}
          onSignInClick={() => {
            setAuthModalMode('signin');
            setAuthModalOpen(true);
          }}
          onSignUpClick={() => {
            setAuthModalMode('signup');
            setAuthModalOpen(true);
          }}
        />
        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          mode={authModalMode}
          onModeChange={setAuthModalMode}
          onUsernameSet={handleUsernameSet}
        />

        {/* Battle Report modal on landing */}
        {showBattleReportModal && authState.isAuthenticated && authState.user && (
          <>
            <div
              className="overlay"
              style={{ display: 'block', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }}
              onClick={() => setShowBattleReportModal(false)}
            />
            <div className="notification settings-dialog" style={{ display: 'block', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 860, width: '92%', maxHeight: '90vh', overflow: 'hidden', padding: 0 }}>
              <button
                className="close"
                aria-label="Close"
                onClick={() => setShowBattleReportModal(false)}
                style={{ position: 'absolute', top: 10, right: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: 8, padding: '2px 6px', lineHeight: 1, width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ×
              </button>
              <div style={{ clear: 'both' }} />
              <BattleReportPage 
                user={authState.user}
                onBack={() => setShowBattleReportModal(false)}
                onPlayClick={handlePlayClick}
                onHowToPlayClick={handleHowToPlayClick}
                onHomeClick={handleHomeClick}
                onAboutClick={handleAboutClick}
                authState={authState}
                onLogout={handleLogoutWrapper}
                onSignInClick={() => {
                  setAuthModalMode('signin');
                  setAuthModalOpen(true);
                }}
                onSignUpClick={() => {
                  setAuthModalMode('signup');
                  setAuthModalOpen(true);
                }}
                isModal
              />
            </div>
          </>
        )}

        {/* Tutorial popup on landing */}
        {showTutorial && (
          <>
            <div className="overlay tutorial-overlay" style={{ display: 'block' }} onClick={closeTutorial} />
            <div className="tutorial-popup" id="tutorial-popup" style={{ display: 'block' }}>
              <div id="tutorial-content">
                <h2 id="tutorial-title">{tutorialSteps[tutorialStep]?.title}</h2>
                <div id="tutorial-message">
                  <div dangerouslySetInnerHTML={{ __html: tutorialSteps[tutorialStep]?.message || '' }} />
                </div>
                <div id="tutorial-demo">
                  {tutorialSteps[tutorialStep]?.demo && (
                    <TutorialDemo demoType={tutorialSteps[tutorialStep].demo as "board" | "yugo" | "long-line" | "igo"} />
                  )}
                </div>
                <div className="tutorial-navigation">
                  {tutorialStep > 0 ? (
                    <button className="btn" onClick={prevTutorialStep}>
                      Previous
                    </button>
                  ) : (
                    <button className="btn" style={{ visibility: 'hidden' }}>
                      Previous
                    </button>
                  )}
                  {tutorialStep < tutorialSteps.length - 1 && (
                    <button className="btn" onClick={nextTutorialStep}>
                      Next
                    </button>
                  )}
                  {tutorialStep === tutorialSteps.length - 1 && (
                    <button className="btn" onClick={nextTutorialStep}>
                      Finish
                    </button>
                  )}
                  <button className="btn" onClick={closeTutorial}>
                    Close
                  </button>
                </div>
              </div>
              <button 
                id="mobile-tutorial-close-x"
                onClick={closeTutorial}
                style={{ display: 'block' }}
              >
                ×
              </button>
            </div>
          </>
        )}
      </>
    );
  }

  // Show Stats Report page
  if (currentPage === 'battle-report' && authState.isAuthenticated && authState.user) {
    return (
      <>
        <BattleReportPage 
          user={authState.user} 
          onBack={() => setCurrentPage('landing')}
          onPlayClick={handlePlayClick}
          onHowToPlayClick={handleHowToPlayClick}
          onHomeClick={handleHomeClick}
          onAboutClick={handleAboutClick}
          authState={authState}
          onLogout={handleLogoutWrapper}
          onSignInClick={() => {
            setAuthModalMode('signin');
            setAuthModalOpen(true);
          }}
          onSignUpClick={() => {
            setAuthModalMode('signup');
            setAuthModalOpen(true);
          }}
        />
        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          mode={authModalMode}
          onModeChange={setAuthModalMode}
          onUsernameSet={handleUsernameSet}
        />
      </>
    );
  }

  // Show Leaderboard page
  if (currentPage === 'leaderboard') {
    return (
      <div className="App">
        <Sidebar 
          onPlayClick={handlePlayClick}
          onHowToPlayClick={handleHowToPlayClick}
          onHomeClick={handleHomeClick}
          onAboutClick={handleAboutClick}
          authState={authState}
          onLogout={handleLogoutWrapper}
          onSignInClick={() => {
            setAuthModalMode('signin');
            setAuthModalOpen(true);
          }}
          onSignUpClick={() => {
            setAuthModalMode('signup');
            setAuthModalOpen(true);
          }}
          isMobileMenuOpen={isMobileMenuOpen}
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          closeMobileMenu={() => setIsMobileMenuOpen(false)}
        />
        <div className="main-content">
          <LeaderboardPage onBack={() => setCurrentPage('landing')} />
        </div>
        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          mode={authModalMode}
          onModeChange={setAuthModalMode}
          onUsernameSet={handleUsernameSet}
        />
      </div>
    );
  }

  // Show About page
  if (currentPage === 'about') {
    return (
      <>
          <AboutPage onBack={() => setCurrentPage('landing')} />
        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          mode={authModalMode}
          onModeChange={setAuthModalMode}
          onUsernameSet={handleUsernameSet}
        />
      </>
    );
  }

  return (
    <div className="App">
      <Sidebar 
        onPlayClick={handlePlayClick}
        onHowToPlayClick={handleHowToPlayClick}
        onHomeClick={handleHomeClick}
        onAboutClick={handleAboutClick}
        authState={authState}
        onLogout={handleLogoutWrapper}
        onSignInClick={() => {
          setAuthModalMode('signin');
          setAuthModalOpen(true);
        }}
        onSignUpClick={() => {
          setAuthModalMode('signup');
          setAuthModalOpen(true);
        }}
        isMobileMenuOpen={isMobileMenuOpen}
        toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        closeMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <div className="main-content">
      <header>
        {/* Back to Home Button - Left Side */}
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '210px',
          zIndex: 1000
        }}>
          <button
            onClick={() => setCurrentPage('landing')}
            style={{
              background: 'rgba(74, 144, 226, 0.1)',
              color: 'black',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.3s ease',
              boxShadow: 'none',
              opacity: '0.8'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.background = 'rgba(74, 144, 226, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = '0.8';
              e.currentTarget.style.background = 'rgba(74, 144, 226, 0.1)';
            }}
          >
            <span>←</span>
           Back to Home 
          </button>
        </div>

        <img 
          src="/migoyugo-logo.png" 
          alt="migoyugo" 
          style={{
            height: '60px',
            maxWidth: '300px',
            objectFit: 'contain',
            margin: '10px auto 10px 250px',
            display: 'block'
          }}
        />
      </header>

      <div className="game-container">
        <div className="game-board-area">
          {/* Top player info */}


          <div className="player-info" style={{ width: 'calc(var(--board-size) + 4px)', boxSizing: 'border-box' }}>
              <div className={`player ${gameState.currentPlayer === 'white' ? 'active' : ''}`} id="player-white">
                <div className="player-color white"></div>
                <span>
  {(() => {
    if (!isGameStarted) {
      return 'White';
    } else if (gameMode === 'online' && playerColor) {
      // Multiplayer game - show actual usernames without color labels
      const whiteName = playerColor === 'white' ? 
        (authState.user?.username || 'Guest') : 
        opponentName;
      return whiteName;
    } else if ((gameMode === 'ai-1' || gameMode === 'ai-2' || gameMode === 'ai-3') && authState.isAuthenticated) {
      // AI game with authenticated user - show username for white (human player)
      return authState.user?.username;
    } else {
      // Local human vs human or unauthenticated - use gameState players
      return gameState.players.white;
    }
  })()}
</span>
                <span>Yugos: <span id="white-score">{gameState.scores.white}</span></span>
              </div>
              {timerEnabled && (
  <div className="player-timer" id="white-timer">
    {formatTime(timers.white)}
  </div>
)}
          </div>

          {/* Game board */}
          <div className="board-with-labels">
            <div style={{ position: 'relative' }}>
              {renderBoard()}
              
              {/* Disconnect Modal */}
              {gameMode === 'online' && opponentDisconnected && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '0',
                  right: '0',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '2px solid #dc3545',
                  borderRadius: '8px',
                  padding: '20px',
                  margin: '0 10px',
                  textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  zIndex: 1000
                }}>
                  <div style={{
                    color: '#dc3545',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: '10px'
                  }}>
                    Your opponent has disconnected
                  </div>
                  <div style={{
                    color: '#333',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}>
                    Their timer will continue to count down until they return, or time out.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom player info */}
          <div className="player-info bottom" style={{ width: 'calc(var(--board-size) + 4px)', boxSizing: 'border-box' }}>
            <div className={`player ${gameState.currentPlayer === 'black' ? 'active' : ''}`} id="player-black">
              <div className="player-color black"></div>
              <span>
  {(() => {
    if (!isGameStarted) {
      return 'Black';
    } else if (gameMode === 'online' && playerColor) {
      // Multiplayer game - show actual usernames without color labels
      const blackName = playerColor === 'black' ? 
        (authState.user?.username || 'Guest') : 
        opponentName;
      return blackName;
    } else if ((gameMode === 'ai-1' || gameMode === 'ai-2' || gameMode === 'ai-3') && authState.isAuthenticated) {
      // AI game - black is always the AI, show AI name without color label
      return gameState.players.black;
    } else {
      // Local human vs human or unauthenticated - use gameState players
      return gameState.players.black;
    }
  })()}
</span>
                              <span>Yugos: <span id="black-score">{gameState.scores.black}</span></span>
            </div>
            {timerEnabled && (
  <div className="player-timer" id="black-timer">
    {formatTime(timers.black)}
  </div>
)}
          </div>
        </div>

        
        {/* Game controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          {/* Action buttons */}
          <div className="player-buttons" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '256px', marginBottom: '0' }}>
            <button 
              className="btn action-btn" 
              onClick={isGameStarted && gameState.gameStatus === 'active' ? 
                (gameMode === 'online' ? showResignDrawOptions : resignGame) : startGame}
              style={{ 
                height: '40px', 
                padding: '0 24px',
                backgroundColor: !isGameStarted ? '#28a745' : undefined,
                color: !isGameStarted ? 'white' : undefined
              }}
            >
              {isGameStarted && gameState.gameStatus === 'active' ? 
                (gameMode === 'online' ? 'Resign/Draw' : 'Resign') : 'Start'}
            </button>
            <button 
              className="btn action-btn" 
              onClick={resetGame}
              style={{ height: '40px', padding: '0 24px' }}
            >
              Reset
            </button>
          </div>

          {/* Mobile controls button - only show on mobile when game is not started */}
          {!isGameStarted && (
            <div className="mobile-controls-button" style={{ width: '256px', marginBottom: '10px' }}>
              <button 
                className="btn mobile-only" 
                onClick={() => setShowMobileControls(true)}
                style={{ width: '100%', height: '40px' }}
              >
                Game Settings
              </button>
            </div>
          )}

          {/* Game controls area */}
          <div className="game-controls-area" style={{ height: 'calc(var(--board-size) + 4px)', width: '256px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            {!isGameStarted && (
              <div id="pregame-controls">
                <div className="option-row">
                  <label htmlFor="game-mode-select">Opponent:</label>
                  <select 
                    id="game-mode-select" 
                    className="control-select"
                    value={gameMode}
                    onChange={(e) => setGameMode(e.target.value as any)}
                  >
                    <option value="local">Local Play</option>
                    <option value="ai-1">CORE AI-1</option>
                    <option value="ai-2">CORE AI-2</option>
                    <option value="ai-3">CORE AI-3</option>
                    <option value="online">Online Multiplayer</option>
                  </select>
                </div>

                {/* Color selection for AI games - White or Black only */}
                {(gameMode.startsWith('ai-')) && (
                  <div className="option-row" style={{ marginTop: 8, marginBottom: 8, justifyContent: 'center' }}>
                    <span style={{ marginRight: 8 }}>Play as:</span>
                    <div style={{ display: 'inline-flex', gap: 4 }}>
                      <button
                        type="button"
                        className={`color-choice-btn${playerColorChoice === 'white' ? ' selected' : ''}`}
                        aria-label="Play as White"
                        onClick={() => setPlayerColorChoice('white')}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', background: playerColorChoice === 'white' ? '#ecf0f1' : 'white', fontWeight: playerColorChoice === 'white' ? 'bold' : 'normal' }}
                      >
                        ⚪
                      </button>
                      <button
                        type="button"
                        className={`color-choice-btn${playerColorChoice === 'black' ? ' selected' : ''}`}
                        aria-label="Play as Black"
                        onClick={() => setPlayerColorChoice('black')}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', background: playerColorChoice === 'black' ? '#2c3e50' : 'white', color: playerColorChoice === 'black' ? 'white' : '#2c3e50', fontWeight: playerColorChoice === 'black' ? 'bold' : 'normal' }}
                      >
                        ⚫
                      </button>
                    </div>
                  </div>
                )}

                <div className="option-row">
                  <label htmlFor="timer-toggle">Game Timer:</label>
                  <div className="toggle-container">
                    <span className="toggle-label">Off</span>
                    <label className="toggle small">
                      <input 
                        type="checkbox" 
                        id="timer-toggle" 
                        checked={timerEnabled}
                        onChange={(e) => setTimerEnabled(e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                    <span className={`toggle-label ${timerEnabled ? 'active' : ''}`}>On</span>
                  </div>
                </div>

                {timerEnabled && (
                  <div className="timer-settings" id="timer-settings">
                    <div className="timer-row">
                      <div className="option-cell">
                        <label htmlFor="minutes-per-player">Minutes:</label>
                        <select 
                          id="minutes-per-player" 
                          className="control-select"
                          value={minutesPerPlayer}
                          onChange={(e) => setMinutesPerPlayer(parseInt(e.target.value))}
                        >
                          <option value="60">60</option>
                          <option value="30">30</option>
                          <option value="15">15</option>
                          <option value="10">10</option>
                          <option value="5">5</option>
                          <option value="3">3</option>
                        </select>
                      </div>
                      <div className="option-cell">
                        <label htmlFor="increment-seconds">Increment:</label>
                        <select 
                          id="increment-seconds" 
                          className="control-select"
                          value={incrementSeconds}
                          onChange={(e) => setIncrementSeconds(parseInt(e.target.value))}
                        >
                          <option value="10">10 sec</option>
                          <option value="5">5 sec</option>
                          <option value="2">2 sec</option>
                          <option value="0">0 sec</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Game log - only show after game starts */}
            {isGameStarted && (
              <div id="game-log-container">
                <div className="review-button-container" style={{ width: '236px', margin: '15px auto 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: '1.2em', margin: '0' }}>Move History</h2>
                  {moveHistory.length > 0 && !isReviewMode && (
                    <button 
                      className="review-button" 
                      onClick={enterReviewMode}
                      style={{ display: 'inline-block' }}
                    >
                      Review
                    </button>
                  )}
                </div>
                {renderMoveHistory()}
              </div>
            )}
          </div>

          {/* Utility buttons */}
          <div className="utility-buttons-container" style={{ width: '256px', display: 'flex', alignItems: 'center', height: '40px', marginTop: '0', marginLeft: '-4px' }}>
            <div className="utility-buttons" style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
              <button 
                className="btn" 
                onClick={() => setShowTutorial(true)}
                style={{ height: '40px', flex: 1, margin: '0 5px' }}
              >
                Tutorial
              </button>
              <button 
                className="btn" 
                onClick={() => setShowRules(true)}
                style={{ height: '40px', flex: 1, margin: '0 5px' }}
              >
                Rules
              </button>
              <button 
                className="btn" 
                onClick={() => setShowSettings(true)}
                style={{ height: '40px', flex: 1, margin: '0 5px' }}
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tutorial popup */}
      {showTutorial && (
        <>
          <div className="overlay tutorial-overlay" style={{ display: 'block' }} onClick={closeTutorial} />
          <div className="tutorial-popup" id="tutorial-popup" style={{ display: 'block' }}>
            <div id="tutorial-content">
              <h2 id="tutorial-title">{tutorialSteps[tutorialStep]?.title}</h2>
              <div id="tutorial-message">
                <div dangerouslySetInnerHTML={{ __html: tutorialSteps[tutorialStep]?.message || '' }} />
              </div>
              <div id="tutorial-demo">
                {tutorialSteps[tutorialStep]?.demo && (
                  <TutorialDemo demoType={tutorialSteps[tutorialStep].demo as "board" | "yugo" | "yugo" | "long-line" | "igo"} />
                )}
              </div>
              <div className="tutorial-navigation">
                {tutorialStep > 0 ? (
                  <button className="btn" onClick={prevTutorialStep}>
                    Previous
                  </button>
                ) : (
                  <button className="btn" style={{ visibility: 'hidden' }}>
                    Previous
                  </button>
                )}
                {tutorialStep < tutorialSteps.length - 1 && (
                  <button className="btn" onClick={nextTutorialStep}>
                    Next
                  </button>
                )}
                {tutorialStep === tutorialSteps.length - 1 && (
                  <button className="btn" onClick={nextTutorialStep}>
                    Finish
                  </button>
                )}
                <button className="btn" onClick={closeTutorial}>
                  Close
                </button>
              </div>
            </div>
            <button 
              id="mobile-tutorial-close-x"
              onClick={closeTutorial}
              style={{ display: 'block' }}
            >
              ×
            </button>
          </div>
        </>
      )}

      {/* Rules popup */}
      {showRules && (
        <>
          <div className="overlay" style={{ display: 'block' }} onClick={() => setShowRules(false)} />
          <div className="notification settings-dialog" style={{ display: 'block' }}>
            <h2><span style={{color: 'red', fontWeight: 'bold'}}>Migoyugo</span> Game Rules</h2>
            
            <br />
                        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 10, textAlign: 'left' }}>
              <h3 style={{ color: 'red' }}>The Game</h3>
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '30px' }}>
                <li><strong>Migoyugo</strong> is a board game for two players</li>
                <li>it is an abstract strategy game that features complete information and no reliance on luck or chance</li>
              </ul>
              
              <h3 style={{ color: 'red' }}>The Board</h3>
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '30px' }}>
                <li>The Migoyugo board is an 8 X 8 grid of 64 squares, all of the same color</li>
                <li>The board is made up of eight rows (1-8 from bottom to top) and eight columns (A-H from left to right)</li>
              </ul>
              
              <h3 style={{ color: 'red' }}>The Migo</h3>
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '30px' }}>
                <li>White always moves first by placing a piece, called a <strong>Migo</strong>, on any open square on the board</li>
                <li>Players take turns placing Migos, alternating white and black</li>
                <li>A player may place a Migo on any open square on the board, unless it will create an unbroken line longer than 4 pieces of their own colour</li>
              </ul>
              
              <h3 style={{ color: 'red' }}>The Yugo</h3>
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '30px' }}>
                <li>When you form an unbroken line (horizontal, vertical or diagonal) of exactly 4 pieces of your own color, the last Migo placed in this line becomes a <strong>Yugo</strong>, represented by a red mark in the center</li>
                <li>When a Yugo is created, all Migos in the line are removed, leaving behind only the Yugo created and any other Yugos in that line</li>
                <li>Yugos can never be moved or removed from the board</li>
              </ul>
              
              <h3 style={{ color: 'red' }}>Yugo Types</h3>
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '20px' }}>
                <li>Yugos are marked differently depending on how many lines are formed in a single move:</li>
              </ul>
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0 30px 0', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Lines Formed</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Yugo Type</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Marker Symbol</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>1 line</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Single Yugo</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        backgroundColor: '#e74c3c', 
                        display: 'inline-block' 
                      }}></div> (red dot)
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>2 intersecting lines at once</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Double Yugo</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>
                      <div style={{ 
                        width: '16px', 
                        height: '8px', 
                        backgroundColor: '#e74c3c', 
                        borderRadius: '50%',
                        display: 'inline-block' 
                      }}></div> (red oval)
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>3 intersecting lines at once</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Triple Yugo</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: '#e74c3c', 
                        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                        display: 'inline-block' 
                      }}></div> (red triangle)
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>4 intersecting lines at once</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Quadruple Yugo</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: '#e74c3c', 
                        transform: 'rotate(45deg)',
                        display: 'inline-block' 
                      }}></div> (red diamond)
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <h3 style={{ color: 'red' }}>No Long Lines</h3>
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '30px' }}>
                <li>At no time may either player create a line of more than 4 in a row of any combination of Migos and/or Yugos</li>
              </ul>
              
              <h3 style={{ color: 'red' }}>Winning</h3>
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '20px' }}>
                <li>Form an unbroken line (horizontal, vertical or diagonal) of exactly 4 Yugos of your own color and you win instantly with an <strong>Igo</strong></li>
                <li>If no Igo can be made and no legal moves are available to either player at any time, the game ends with a <strong>Wego</strong>, and the player with the most Yugos is declared the winner. If both players have the same number of Yugos, the game is drawn</li>
                <li>If a player resigns, the opponent is declared the winner</li>
                <li>If the players compete using a clock, a player is declared the winner if the opponent's clock runs out of time</li>
              </ul>
            </div>

            <div className="notification-buttons">
              <button className="btn" onClick={() => setShowRules(false)}>Close</button>
            </div>
          </div>
        </>
      )}

      {/* Settings popup */}
      {showSettings && (
        <>
          <div className="overlay" style={{ display: 'block' }} onClick={() => setShowSettings(false)} />
                      <div className="notification settings-dialog" style={{ display: 'block' }}>
            <h2>Settings</h2>
            
            {/* Theme Section */}
            <div className="settings-section">
              <h3>Theme</h3>
              <div className="option-row">
                <label>Theme:</label>
                <select 
                  className="control-select" 
                  value={currentTheme} 
                  onChange={(e) => handleThemeChange(e.target.value)}
                >
                <option value="classic">Classic</option>
                <option value="dark">Dark Mode</option>
                <option value="high-contrast">High Contrast</option>
                <option value="nature">Nature</option>
                                            <option value="felt">Felt</option>
                <option value="custom">Custom</option>
              </select>
            </div>
              
              {/* Custom Colors (only show when custom theme selected) */}
              {currentTheme === 'custom' && (
                <div id="custom-colors" style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                  <h4 style={{ marginBottom: '10px', fontSize: '1rem' }}>Custom Colors</h4>
                  
                  <div className="color-option">
                    <label>White Migo Color:</label>
                    <input
                      type="color"
                      value={customColors.whiteMigo}
                      onChange={(e) => handleCustomColorChange('whiteMigo', e.target.value)}
                    />
                  </div>
                  
                  <div className="color-option">
                    <label>Black Migo Color:</label>
                    <input
                      type="color"
                      value={customColors.blackMigo}
                      onChange={(e) => handleCustomColorChange('blackMigo', e.target.value)}
                    />
                  </div>
                  
                  <div className="color-option">
                    <label>Link Color:</label>
                    <input
                      type="color"
                      value={customColors.yugoColor}
                      onChange={(e) => handleCustomColorChange('yugoColor', e.target.value)}
                    />
                  </div>
                  
                  <div className="color-option">
                    <label>Board Color:</label>
                    <input
                      type="color"
                      value={customColors.boardColor}
                      onChange={(e) => handleCustomColorChange('boardColor', e.target.value)}
                    />
                  </div>
                  
                  <div className="color-option">
                    <label>Hover Color:</label>
                    <input
                      type="color"
                      value={customColors.hoverColor}
                      onChange={(e) => handleCustomColorChange('hoverColor', e.target.value)}
                    />
                  </div>
                  
                  <div className="color-option">
                    <label>Last Move Indicator:</label>
                    <input
                      type="color"
                      value={customColors.lastMoveColor}
                      onChange={(e) => handleCustomColorChange('lastMoveColor', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sound Section */}
            <div className="settings-section">
              <h3>Sound</h3>
              <div className="option-row">
                <label>Sound Effects:</label>
                <div className="toggle-container">
                  <span className={`toggle-label ${!soundEnabled ? 'active' : ''}`}>Off</span>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => handleSoundToggle(e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                  <span className={`toggle-label ${soundEnabled ? 'active' : ''}`}>On</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="notification-buttons">
              <button className="btn" onClick={handleViewStatsWrapper} disabled={statsLoading}>
                {statsLoading ? 'Loading...' : 'View Statistics'}
              </button>
              <button className="btn" onClick={resetSettings}>Reset to Defaults</button>
              <button className="btn" onClick={() => setShowSettings(false)}>Close</button>
            </div>
          </div>
        </>
      )}

      {/* Login modal */}
      {showLogin && (
        <>
          <div className="overlay" style={{ display: 'block' }} onClick={() => setShowLogin(false)} />
          <div className="notification" style={{ display: 'block' }}>
            <h2>Play Online</h2>
            <div className="notification-buttons">
              <button type="button" className="btn" onClick={() => { setShowLogin(false); handlePlayAsGuestWrapper(); }}>
                Play as Guest
              </button>
              <button type="button" className="btn" onClick={() => setShowLogin(false)}>Cancel</button>
            </div>
          </div>
        </>
      )}

      {/* Signup modal */}
      {showSignup && (
        <>
          <div className="overlay" style={{ display: 'block' }} onClick={() => setShowSignup(false)} />
          <div className="notification" style={{ display: 'block' }}>
            <h2>Play Online</h2>
            <div className="notification-buttons">
              <button type="button" className="btn" onClick={() => { setShowSignup(false); handlePlayAsGuestWrapper(); }}>
                Play as Guest
              </button>
              <button type="button" className="btn" onClick={() => setShowSignup(false)}>Cancel</button>
            </div>
          </div>
        </>
      )}

      {/* Stats authentication modal */}
      {showStatsAuth && (
        <>
          <div className="overlay" style={{ display: 'block' }} onClick={() => setShowStatsAuth(false)} />
          <div className="notification stats-auth-modal" style={{ display: 'block' }}>
            <h2>Track Your Stats</h2>
            <p style={{ marginBottom: '20px', lineHeight: '1.5' }}>
              To view and track your game statistics, you need a player account. 
              Create an account to keep track of your wins, losses, and game history!
            </p>
            <div className="notification-buttons">
              <button 
                type="button" 
                className="btn" 
                onClick={() => { 
                  setShowStatsAuth(false); 
                  setShowLogin(true); 
                }}
              >
                Log In
              </button>
              <button 
                type="button" 
                className="btn" 
                onClick={() => { 
                  setShowStatsAuth(false); 
                  setShowSignup(true); 
                }}
              >
                Sign Up
              </button>
              <button type="button" className="btn" onClick={() => setShowStatsAuth(false)}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Matchmaking modal */}
      {showMatchmaking && !currentRoom && (
        <>
          <div className="overlay" style={{ display: 'block', zIndex: 10001 }} onClick={() => setShowMatchmaking(false)} />
          <div className="notification matchmaking-modal" style={{ display: 'block', zIndex: 10002 }}>
            <h2>Online Multiplayer</h2>
            <div style={{ marginBottom: '15px', fontSize: '0.9rem', color: '#666' }}>
              Playing as: <strong>
                {authState.isAuthenticated ? authState.user?.username : 
                 authState.isGuest ? `Guest${Math.floor(Math.random() * 9000) + 1000}` : 'Anonymous'}
              </strong>
            </div>
            
            {/* Guest mode limitation notice */}
            {authState.isGuest && (
              <div style={{ 
                margin: '15px 0', 
                padding: '12px', 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffc107', 
                borderRadius: '6px',
                fontSize: '0.85rem',
                lineHeight: '1.5'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#856404' }}>
                  👤 Guest Mode Limitations
                </div>
                <div style={{ color: '#856404', marginBottom: '10px' }}>
                  As a guest, you can only be matched with other guests in Quick Match.
                  To play against all users and access full features, please sign up or sign in.
                </div>
                <div className="notification-buttons" style={{ marginTop: '10px', gap: '8px' }}>
                  <button 
                    className="btn" 
                    onClick={() => { 
                      setShowMatchmaking(false); 
                      setAuthModalMode('signup');
                      setAuthModalOpen(true);
                    }}
                    style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                  >
                    Sign Up
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => { 
                      setShowMatchmaking(false); 
                      setAuthModalMode('signin');
                      setAuthModalOpen(true);
                    }}
                    style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}
            
            {/* Standard timer settings info */}
            <div style={{ margin: '15px 0', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.9rem', color: '#495057', textAlign: 'center' }}>
                <strong>⏱️ Standard Time Control</strong>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#007bff', textAlign: 'center', marginTop: '5px' }}>
                10 minutes + 0 seconds increment
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center', marginTop: '3px' }}>
                All online games use this time control
              </div>
            </div>
            
            {isSearchingMatch ? (
              <>
                <p>Searching for a match...</p>
            <div className="notification-buttons">
                  <button className="btn" onClick={cancelMatchmaking}>Cancel Search</button>
                </div>
              </>
            ) : (
                <>
                <p>Choose how to play:</p>
                <div className="notification-buttons">
                  <button className="btn" onClick={findMatch}>🎯 Quick Match</button>
                  <button className="btn" onClick={handlePrivateRoomClick}>🏠 Private Room</button>
                  <button className="btn" onClick={() => setShowMatchmaking(false)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Room modal */}
      {showRoomModal && (
        <>
          <div className="overlay" style={{ display: 'block', zIndex: 10001 }} onClick={() => setShowRoomModal(false)} />
          <div className="notification" style={{ display: 'block', zIndex: 10002 }}>
            <h2>Private Room</h2>
            <p>Create a room to invite a friend, or join an existing room:</p>
            
            <div style={{ margin: '20px 0' }}>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="Enter room code (e.g. ABC123)"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '16px',
                    textAlign: 'center',
                    letterSpacing: '2px',
                    fontFamily: 'monospace'
                  }}
                  maxLength={6}
                />
              </div>
            </div>
            
            <div className="notification-buttons">
              <button className="btn" onClick={createRoom}>Create Room</button>
              <button 
                className="btn" 
                onClick={joinRoom}
                disabled={!roomCodeInput.trim()}
                style={{ 
                  opacity: roomCodeInput.trim() ? 1 : 0.5,
                  cursor: roomCodeInput.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Join Room
              </button>
              <button className="btn" onClick={() => setShowRoomModal(false)}>Cancel</button>
            </div>
          </div>
        </>
      )}

      {/* Current room display */}
      {currentRoom && (
        <>
          <div className="overlay" style={{ display: 'block', zIndex: 10001 }} />
          <div className="notification" style={{ display: 'block', zIndex: 10002 }}>
            <h2>Room {currentRoom.code}</h2>
            
            <div style={{ margin: '20px 0', textAlign: 'center' }}>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #dee2e6', 
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>
                  Share this code with your friend:
                </div>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  letterSpacing: '4px',
                  fontFamily: 'monospace',
                  color: '#007bff'
                }}>
                  {currentRoom.code}
                </div>
              </div>
              
              <div style={{ textAlign: 'left' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Host:</strong> {currentRoom.hostName} {currentRoom.isHost && '(You)'}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <strong>Guest:</strong> {currentRoom.guestName || 'Waiting...'}
                </div>
                
                {currentRoom.status === 'waiting' && (
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#fff3cd', 
                    border: '1px solid #ffeaa7',
                    borderRadius: '4px',
                    color: '#856404'
                  }}>
                    ⏳ Waiting for opponent to join...
                  </div>
                )}
                
                {currentRoom.status === 'ready' && (
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#d4edda', 
                    border: '1px solid #c3e6cb',
                    borderRadius: '4px',
                    color: '#155724'
                  }}>
                    ✅ Both players ready! {currentRoom.isHost ? 'You can start the game.' : 'Waiting for host to start...'}
                  </div>
                )}
              </div>
            </div>
            
            <div className="notification-buttons">
              {currentRoom.isHost && currentRoom.status === 'ready' && (
                <button 
                  className="btn" 
                  onClick={startRoomGame}
                  style={{ backgroundColor: '#28a745', color: 'white' }}
                >
                  Start Game
                </button>
              )}
              <button className="btn" onClick={leaveRoom}>Leave Room</button>
            </div>
          </div>
        </>
      )}

      {/* Game notification */}
      {notification.show && (
        <>
          <div className="overlay" style={{ display: 'block' }} onClick={() => setNotification(prev => ({ ...prev, show: false }))} />
          <div className={`notification ${notification.title === 'Game Drawn' ? 'game-drawn-modal' : ''}`} style={{ display: 'block' }}>
            <h2>{notification.title}</h2>
            {notification.title === 'Play Online' && !authState.isAuthenticated && !authState.isGuest ? (
              <div className="notification-buttons">
                <button className="btn" onClick={() => { setNotification(prev => ({ ...prev, show: false })); handlePlayAsGuestWrapper(); }}>
                  Play as Guest
                </button>
                <button className="btn" onClick={() => setNotification(prev => ({ ...prev, show: false }))}>
                  Cancel
                </button>
              </div>
            ) : (notification.title === 'Game Over' || notification.title === 'Game Drawn' || notification.title === 'Time Out' || notification.title === 'Opponent Disconnected') && gameMode === 'online' && gameState.gameStatus === 'finished' ? (
              <>
                <p style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>{notification.message}</p>
                {rematchState.requested ? (
                  <>
                    <div style={{ margin: '15px 0', padding: '10px', backgroundColor: '#f0f8ff', border: '1px solid #007bff', borderRadius: '4px' }}>
                      <p style={{ margin: '0', fontWeight: 'bold', color: '#007bff' }}>
                        🎯 {rematchState.requestedBy} has challenged you to a rematch!
                      </p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#666' }}>
                        Do you accept the challenge?
                      </p>
                    </div>
                    <div className="notification-buttons">
                      {/* Show Review Game button for online games with move history */}
                      {moveHistory.length > 0 && (
                        <button 
                          className="btn" 
                          onClick={() => {
                            setNotification(prev => ({ ...prev, show: false }));
                            enterReviewMode();
                          }}
                          style={{ backgroundColor: '#17a2b8', color: 'white' }}
                        >
                          📋 Review Game
                        </button>
                      )}
                      <button className="btn" onClick={() => respondToRematch(true)} style={{ backgroundColor: '#28a745', color: 'white' }}>
                        ⚔️ Accept Rematch
                      </button>
                      <button className="btn" onClick={() => respondToRematch(false)} style={{ backgroundColor: '#dc3545', color: 'white' }}>
                        ❌ Decline
                      </button>
                      <button className="btn" onClick={() => {
                        // Auto-decline rematch when closing modal if a challenge is pending
                        respondToRematch(false);
                      }}>
                        Close
                      </button>
                    </div>
                  </>
                ) : rematchState.waitingForResponse ? (
                  <>
                    <div style={{ margin: '15px 0', padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px' }}>
                      <p style={{ margin: '0', fontWeight: 'bold', color: '#856404' }}>
                        ⏳ Waiting for opponent's response...
                      </p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#666' }}>
                        Your rematch challenge has been sent!
                      </p>
                    </div>
                    <div className="notification-buttons">
                      {/* Show Review Game button for online games with move history */}
                      {moveHistory.length > 0 && (
                        <button 
                          className="btn" 
                          onClick={() => {
                            setNotification(prev => ({ ...prev, show: false }));
                            enterReviewMode();
                          }}
                          style={{ backgroundColor: '#17a2b8', color: 'white' }}
                        >
                          📋 Review Game
                        </button>
                      )}
                      <button className="btn" onClick={() => setNotification(prev => ({ ...prev, show: false }))}>
                        Continue Waiting
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ margin: '15px 0', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                      <p style={{ margin: '0', fontWeight: 'bold', color: '#495057' }}>
                        🔄 Want to play again?
                      </p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#666' }}>
                        Challenge your opponent to a rematch! Colors will be swapped.
                      </p>
                    </div>
                    <div className="notification-buttons">
                      {/* Show Review Game button for online games with move history */}
                      {moveHistory.length > 0 && (
                        <button 
                          className="btn" 
                          onClick={() => {
                            setNotification(prev => ({ ...prev, show: false }));
                            enterReviewMode();
                          }}
                          style={{ backgroundColor: '#28a745', color: 'white' }}
                        >
                          📋 Review Game
                        </button>
                      )}
                      <button 
                        className="btn" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Button clicked - event fired!');
                          requestRematch();
                        }}
                        style={{ 
                          backgroundColor: '#007bff', 
                          color: 'white',
                          zIndex: 1002,
                          position: 'relative',
                          pointerEvents: 'auto',
                          cursor: 'pointer'
                        }}
                      >
                        🎯 Request Rematch
                      </button>

                      <button className="btn" onClick={() => setNotification(prev => ({ ...prev, show: false }))}>
                        Close
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (notification.title === 'Game Over' || notification.title === 'Game Drawn' || notification.title === 'Time Out') && moveHistory.length > 0 ? (
              <>
                <p style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>{notification.message}</p>
                <div className="notification-buttons">
                  {/* Show Review Game button for all devices when there's move history */}
                  <button 
                    className="btn" 
                    onClick={() => {
                      setNotification(prev => ({ ...prev, show: false }));
                      enterReviewMode();
                    }}
                    style={{ backgroundColor: '#28a745', color: 'white' }}
                  >
                    📋 Review Game
                  </button>
                  <button className="btn" onClick={() => setNotification(prev => ({ ...prev, show: false }))}>
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>{notification.message}</p>
                <div className="notification-buttons">
                  <button className="btn" onClick={() => setNotification(prev => ({ ...prev, show: false }))}>
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Mobile Controls Modal */}
      {showMobileControls && (
        <>
          <div className="overlay" style={{ display: 'block', zIndex: 14999 }} onClick={() => setShowMobileControls(false)} />
          <div className="notification mobile-controls-modal" style={{ display: 'block' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Opponent</h2>
            
            {/* Opponent selection */}
            <div className="option-row" style={{ marginBottom: '20px' }}>
              <label htmlFor="mobile-game-mode-select" style={{ fontWeight: 'bold', fontSize: '16px' }}>Opponent:</label>
              <select 
                id="mobile-game-mode-select" 
                className="control-select"
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value as any)}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  fontSize: '16px',
                  border: '2px solid #ccc',
                  borderRadius: '6px',
                  backgroundColor: '#fff'
                }}
              >
                <option value="local">Local Play</option>
                <option value="ai-1">CORE AI-1</option>
                <option value="ai-2">CORE AI-2</option>
                <option value="ai-3">CORE AI-3</option>
                <option value="online">Online Multiplayer</option>
              </select>
            </div>

            {/* Color selection for AI games */}
            {(gameMode.startsWith('ai-')) && (
              <div className="option-row" style={{ marginBottom: '20px', justifyContent: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px', marginRight: '12px' }}>Play as:</span>
                <div style={{ display: 'inline-flex', gap: '8px' }}>
                  <button
                    type="button"
                    className={`color-choice-btn${playerColorChoice === 'white' ? ' selected' : ''}`}
                    aria-label="Play as White"
                    onClick={() => setPlayerColorChoice('white')}
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: '6px', 
                      border: '2px solid #ccc', 
                      background: playerColorChoice === 'white' ? '#ecf0f1' : 'white', 
                      fontWeight: playerColorChoice === 'white' ? 'bold' : 'normal',
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    ⚪
                  </button>
                  <button
                    type="button"
                    className={`color-choice-btn${playerColorChoice === 'black' ? ' selected' : ''}`}
                    aria-label="Play as Black"
                    onClick={() => setPlayerColorChoice('black')}
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: '6px', 
                      border: '2px solid #ccc', 
                      background: playerColorChoice === 'black' ? '#2c3e50' : 'white', 
                      color: playerColorChoice === 'black' ? 'white' : '#2c3e50', 
                      fontWeight: playerColorChoice === 'black' ? 'bold' : 'normal',
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    ⚫
                  </button>
                </div>
              </div>
            )}

            {/* Timer toggle */}
            <div className="option-row" style={{ marginBottom: '15px' }}>
              <label htmlFor="mobile-timer-toggle" style={{ fontWeight: 'bold', fontSize: '16px' }}>Game Timer:</label>
              <div className="toggle-container">
                <span className={`toggle-label ${!timerEnabled ? 'active' : ''}`}>Off</span>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    id="mobile-timer-toggle" 
                    checked={timerEnabled}
                    onChange={(e) => setTimerEnabled(e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
                <span className={`toggle-label ${timerEnabled ? 'active' : ''}`}>On</span>
              </div>
            </div>

            {/* Timer settings */}
            {timerEnabled && (
              <div className="timer-settings" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div className="timer-row" style={{ marginBottom: '15px' }}>
                  <div className="option-cell" style={{ flex: 1, marginRight: '10px' }}>
                    <label htmlFor="mobile-minutes-per-player" style={{ fontWeight: 'bold', fontSize: '14px' }}>Minutes:</label>
                    <select 
                      id="mobile-minutes-per-player" 
                      className="control-select"
                      value={minutesPerPlayer}
                      onChange={(e) => setMinutesPerPlayer(parseInt(e.target.value))}
                      style={{ 
                        width: '100%', 
                        padding: '10px', 
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        backgroundColor: '#fff'
                      }}
                    >
                      <option value="60">60</option>
                      <option value="30">30</option>
                      <option value="15">15</option>
                      <option value="10">10</option>
                      <option value="5">5</option>
                      <option value="3">3</option>
                    </select>
                  </div>
                  <div className="option-cell" style={{ flex: 1, marginLeft: '10px' }}>
                    <label htmlFor="mobile-increment-seconds" style={{ fontWeight: 'bold', fontSize: '14px' }}>Increment:</label>
                    <select 
                      id="mobile-increment-seconds" 
                      className="control-select"
                      value={incrementSeconds}
                      onChange={(e) => setIncrementSeconds(parseInt(e.target.value))}
                      style={{ 
                        width: '100%', 
                        padding: '10px', 
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        backgroundColor: '#fff'
                      }}
                    >
                      <option value="10">10 sec</option>
                      <option value="5">5 sec</option>
                      <option value="2">2 sec</option>
                      <option value="0">0 sec</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="notification-buttons">
              <button className="btn" onClick={() => setShowMobileControls(false)} style={{ width: '100%', padding: '12px', fontSize: '16px' }}>
                Apply Settings
              </button>
            </div>
          </div>
        </>
      )}

      {/* Resign Confirmation Modal */}
      {showResignConfirmation && (
        <>
          <div className="overlay" style={{ display: 'block' }} onClick={() => setShowResignConfirmation(false)} />
          <div className="notification" style={{ display: 'block' }}>
            <h2>⚠️ Confirm Resignation</h2>
            <p style={{ whiteSpace: 'pre-line', lineHeight: '1.5', margin: '20px 0' }}>
              Are you sure you want to resign this game?
              {'\n\n'}Your opponent will be declared the winner.
            </p>
            <div className="notification-buttons">
              <button 
                className="btn" 
                onClick={confirmResignation}
                style={{ 
                  backgroundColor: '#dc3545', 
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                🏳️ Yes, Resign
              </button>
              <button 
                className="btn" 
                onClick={cancelResignation}
                style={{ 
                  backgroundColor: '#28a745', 
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                ⚔️ Continue Playing
              </button>
            </div>
          </div>
        </>
      )}

      {/* Desktop Resign/Draw Modal */}
      {showResignDrawModal && (
        <>
          <div className="overlay" style={{ display: 'block' }} onClick={() => setShowResignDrawModal(false)} />
          <div className="notification" style={{ display: 'block' }}>
            <h2>🎯 Choose Your Action</h2>
            <p style={{ whiteSpace: 'pre-line', lineHeight: '1.5', margin: '20px 0' }}>
              What would you like to do?
            </p>
            <div className="notification-buttons">
              <button 
                className="btn" 
                onClick={handleResignFromModal}
                style={{ 
                  backgroundColor: '#dc3545', 
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                🏳️ Resign Game
              </button>
              {gameMode === 'online' && (
                <button 
                  className="btn" 
                  onClick={handleDrawFromModal}
                  style={{ 
                    backgroundColor: '#17a2b8', 
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  🤝 Offer Draw
                </button>
              )}
              <button 
                className="btn" 
                onClick={cancelResignDrawModal}
                style={{ 
                  backgroundColor: '#28a745', 
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                ⚔️ Continue Playing
              </button>
            </div>
          </div>
        </>
      )}

      {/* Draw Offer Modal */}
      {showDrawOffer && (
        <>
          <div className="overlay" style={{ display: 'block' }} onClick={() => setShowDrawOffer(false)} />
          <div className="notification" style={{ display: 'block' }}>
            <h2>🤝 Draw Offer</h2>
            <p style={{ whiteSpace: 'pre-line', lineHeight: '1.5', margin: '20px 0' }}>
              {pendingDrawFrom === 'white' ? 'White' : 'Black'} player has offered a draw.
              {'\n\n'}Do you accept?
            </p>
            <div className="notification-buttons">
              <button 
                className="btn" 
                onClick={() => respondToDrawOffer(true)}
                style={{ 
                  backgroundColor: '#28a745', 
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                ✅ Accept Draw
              </button>
              <button 
                className="btn" 
                onClick={() => respondToDrawOffer(false)}
                style={{ 
                  backgroundColor: '#dc3545', 
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                ❌ Decline Draw
              </button>
            </div>
          </div>
        </>
      )}

      {/* Stats Modal */}
      {showStats && (
        <>
          <div className="overlay" style={{ display: 'block' }} onClick={() => setShowStats(false)} />
          <div className="notification" style={{ display: 'block' }}>
            <h2>📊 Player Statistics</h2>
            {userStats && (
              <div style={{ padding: '20px 0' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '20px',
                  marginBottom: '20px' 
                }}>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '15px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px',
                    border: '2px solid #e9ecef'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
                      {userStats.gamesPlayed}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>Games Played</div>
                  </div>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '15px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px',
                    border: '2px solid #e9ecef'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                      {userStats.winRate}%
                    </div>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>Win Rate</div>
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr', 
                  gap: '15px',
                  marginBottom: '20px' 
                }}>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '12px', 
                    backgroundColor: '#e8f5e8', 
                    borderRadius: '6px',
                    border: '1px solid #c3e6cb'
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#155724' }}>
                      {userStats.wins}
                    </div>
                    <div style={{ fontSize: '12px', color: '#155724' }}>Wins</div>
                  </div>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '12px', 
                    backgroundColor: '#f8d7da', 
                    borderRadius: '6px',
                    border: '1px solid #f1b0b7'
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#721c24' }}>
                      {userStats.losses}
                    </div>
                    <div style={{ fontSize: '12px', color: '#721c24' }}>Losses</div>
                  </div>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '12px', 
                    backgroundColor: '#fff3cd', 
                    borderRadius: '6px',
                    border: '1px solid #ffeaa7'
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#856404' }}>
                      {userStats.draws}
                    </div>
                    <div style={{ fontSize: '12px', color: '#856404' }}>Draws</div>
                  </div>
                </div>

                {userStats.currentStreak > 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '15px', 
                    backgroundColor: userStats.streakType === 'win' ? '#e8f5e8' : '#f8d7da', 
                    borderRadius: '8px',
                    border: `2px solid ${userStats.streakType === 'win' ? '#c3e6cb' : '#f1b0b7'}`,
                    marginBottom: '20px'
                  }}>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: 'bold', 
                      color: userStats.streakType === 'win' ? '#155724' : '#721c24'
                    }}>
                      🔥 Current Streak: {userStats.currentStreak} {userStats.streakType === 'win' ? 'Wins' : 'Losses'}
                    </div>
                  </div>
                )}

                {authState.user && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '10px', 
                    color: '#6c757d', 
                    fontSize: '14px',
                    borderTop: '1px solid #e9ecef',
                    marginTop: '15px',
                    paddingTop: '15px'
                  }}>
                    Stats for {authState.user.username}
                  </div>
                )}
              </div>
            )}
            <div className="notification-buttons">
              <button className="btn" onClick={() => setShowStats(false)}>Close</button>
            </div>
          </div>
        </>
      )}

      {/* PWA Installation Banner */}
      {showPWABanner && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
          maxWidth: '90vw',
          width: '400px',
          textAlign: 'center',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{ marginBottom: '10px', fontSize: '16px', fontWeight: 'bold' }}>
            🎮 Install migoyugo Game
          </div>
          <div style={{ marginBottom: '15px', fontSize: '14px', opacity: 0.9 }}>
            Add to your home screen for fullscreen play with no browser bars!
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={handleInstallPWA}
              style={{
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '5px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              📱 Install App
            </button>
            <button 
              onClick={dismissPWABanner}
              style={{
                backgroundColor: 'transparent',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '8px 16px',
                borderRadius: '5px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      {/* Mobile Review Bar - Only visible on mobile when in review mode */}
      {isReviewMode && isMobileDevice && (
        <div id="mobile-review-bar">
          <div className="review-buttons">
            <button 
              className="btn" 
              onClick={firstMove}
              disabled={currentReviewMove <= 0}
              title="First Move"
            >
              ⏮
            </button>
            <button 
              className="btn" 
              onMouseDown={(e) => startHoldScroll('prev', e)}
              onMouseUp={(e) => stopHoldScroll(e)}
              onMouseLeave={(e) => stopHoldScroll(e)}
              onTouchStart={(e) => startHoldScroll('prev', e)}
              onTouchEnd={(e) => stopHoldScroll(e)}
              disabled={currentReviewMove <= 0}
              title="Previous Move"
            >
              ◀
            </button>
            <button 
              className="btn" 
              onMouseDown={(e) => startHoldScroll('next', e)}
              onMouseUp={(e) => stopHoldScroll(e)}
              onMouseLeave={(e) => stopHoldScroll(e)}
              onTouchStart={(e) => startHoldScroll('next', e)}
              onTouchEnd={(e) => stopHoldScroll(e)}
              disabled={currentReviewMove >= moveHistory.length}
              title="Next Move"
            >
              ▶
            </button>
            <button 
              className="btn" 
              onClick={lastMove}
              disabled={currentReviewMove >= moveHistory.length}
              title="Last Move"
            >
              ⏭
            </button>
            <button 
              className="btn" 
              onClick={exitReviewMode}
              title="Exit Review"
              style={{ backgroundColor: '#dc3545', color: 'white' }}
            >
              ✕
            </button>
          </div>
          <div className="move-counter">
            Move {currentReviewMove} of {moveHistory.length}
          </div>
        </div>
      )}

      {/* Mobile Button Container - Only visible on mobile */}
      <div id="mobile-button-container">
        <div id="mobile-action-bar">
          <button 
            className="btn" 
            onClick={isGameStarted && gameState.gameStatus === 'active' ? resignGame : startGame}
            style={{ 
              backgroundColor: !isGameStarted ? '#28a745' : undefined,
              color: !isGameStarted ? 'white' : undefined
            }}
          >
            {isGameStarted && gameState.gameStatus === 'active' ? 'Resign' : 'Start'}
          </button>
          <button 
            className="btn" 
            onClick={isGameStarted && gameState.gameStatus === 'active' ? 
              (gameMode === 'online' ? offerDraw : () => setShowMobileControls(true)) : 
              () => setShowMobileControls(true)}
          >
            {isGameStarted && gameState.gameStatus === 'active' ? 
              (gameMode === 'online' ? 'Offer Draw' : 'Opponent') : 
              'Opponent'}
          </button>
          <button 
            className="btn" 
            onClick={resetGame}
          >
            Reset
          </button>
        </div>

        <div id="mobile-utility-bar">
          <button 
            className="btn" 
            onClick={() => setShowRules(true)}
          >
            Rules
          </button>
          <button 
            className="btn" 
            onClick={() => setShowTutorial(true)}
          >
            Tutorial
          </button>
          <button 
            className="btn" 
            onClick={() => setShowSettings(true)}
          >
            Settings
          </button>
          
          {/* Add Review button conditionally */}
          {moveHistory.length > 0 && !isReviewMode && (
            <button 
              className="btn" 
              onClick={enterReviewMode}
              style={{ backgroundColor: '#28a745', color: 'white' }}
            >
              Review
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast" style={{ display: 'block' }}>
          {toast}
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authModalMode}
        onModeChange={setAuthModalMode}
        onUsernameSet={handleUsernameSet}
      />

      {/* Battle Report modal on game page */}
      {showBattleReportModal && authState.isAuthenticated && authState.user && (
        <>
          <div
            className="overlay"
            style={{ display: 'block', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000 }}
            onClick={() => setShowBattleReportModal(false)}
          />
          <div className="notification settings-dialog" style={{ display: 'block', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 860, width: '92%', maxHeight: '90vh', overflow: 'hidden', padding: 0, zIndex: 10001 }}>
            <button
              className="close"
              aria-label="Close"
              onClick={() => setShowBattleReportModal(false)}
              style={{ position: 'absolute', top: 10, right: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: 8, padding: '2px 6px', lineHeight: 1, width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10002 }}
            >
              ×
            </button>
            <div style={{ clear: 'both' }} />
            <BattleReportPage 
              user={authState.user}
              onBack={() => setShowBattleReportModal(false)}
              onPlayClick={handlePlayClick}
              onHowToPlayClick={handleHowToPlayClick}
              onHomeClick={handleHomeClick}
              authState={authState}
              onLogout={handleLogoutWrapper}
              onSignInClick={() => {
                setAuthModalMode('signin');
                setAuthModalOpen(true);
              }}
              onSignUpClick={() => {
                setAuthModalMode('signup');
                setAuthModalOpen(true);
              }}
              isModal
            />
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default App;