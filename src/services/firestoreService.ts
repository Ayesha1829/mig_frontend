import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  increment,
  serverTimestamp ,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';

// User data structure matching your existing Firestore structure
export interface UserStats {
  uid: string;
  email: string;
  username: string;
  isOnline: boolean;
  inGame?: boolean;  // Tracks if user is in matchmaking/game
  currentGameId?: string;  // Tracks active game ID
  'total games played': number;
  'win percentage': number;  // New field for win percentage
  'win streak': number;  // Track current win streak
  needsUsernameSetup?: boolean;  // Flag to track if username setup is needed
  createdAt?: any;
  lastLoginAt?: any;
  no?: {
    'of wins': number;      // Remove the 'no.' prefix
    'of loss': number;      // Remove the 'no.' prefix  
    'of draw': number;      // Remove the 'no.' prefix
  };
}

// Game history record structure
export interface GameRecord {
  gameId: string;
  playerId: string;
  opponent: string;  // opponent username or "CORE AI-1", "CORE AI-2", etc.
  result: 'win' | 'loss' | 'draw';
  playerColor: 'white' | 'black';
  timestamp: any;
  gameMode: string;  // 'ai-1', 'ai-2', 'ai-3', 'online', 'local'
}

export class FirestoreService {
  // Get user data from Firestore
  static async getUserData(uid: string): Promise<UserStats | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data() as UserStats;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Update only the username for a user (used after social sign-in)
  static async updateUserUsername(uid: string, username: string): Promise<void> {
    try {
      // Ensure desired username is available before updating
      const isAvailable = await this.checkUsernameAvailability(username);
      if (!isAvailable) {
        throw new Error('Username is already taken');
      }

      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        username,
        needsUsernameSetup: false, // Clear the flag since username is now set
        lastLoginAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating username:', error);
      throw error;
    }
  }

  // Check if username is available
  static async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      // If no documents found, username is available
      return querySnapshot.empty;
    } catch (error) {
      console.error('Error checking username:', error);
      throw error;
    }
  }
  // Create or update user in Firestore
  static async createOrUpdateUser(user: any, customUsername?: string): Promise<UserStats> {
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Check if user already exists
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (readError: any) {
        // If we can't read, assume new user and try to create
        userSnap = null;
      }
      
      if (userSnap && userSnap.exists()) {
        // User exists - only update login info, preserve all existing data
        const existingData = userSnap.data();
        const updateData: any = {
          isOnline: true,
          lastLoginAt: serverTimestamp(),
          email: user.email || existingData.email || ''
        };
        
        // Only update username if provided and different
        if (customUsername && customUsername !== existingData.username) {
          // Check if new username is available
          const isAvailable = await this.checkUsernameAvailability(customUsername);
          if (!isAvailable) {
            throw new Error('Username is already taken');
          }
          updateData.username = customUsername;
        } else if (!existingData.username) {
          // Don't auto-set username for social auth - let username setup flow handle it
          // Only set a temporary placeholder that indicates username is needed
          updateData.username = 'User'; // Generic placeholder
          updateData.needsUsernameSetup = true; // Flag that setup is needed
        }
        
        try {
          await updateDoc(userRef, updateData);
        } catch (updateError: any) {
          // Handle update error silently
        }
        
        return existingData as UserStats;
      } else {
        // New user - create fresh record with initial stats
        const finalUsername = customUsername || 'User'; // Don't use displayName automatically
        
        // Check username availability for new users with custom username
        if (customUsername) {
          const isAvailable = await this.checkUsernameAvailability(customUsername);
          if (!isAvailable) {
            throw new Error('Username is already taken');
          }
        }
        
        // New user - create fresh record with initial stats
        const userData: UserStats = {
          uid: user.uid,
          email: user.email || '',
          username: finalUsername,
          isOnline: true,
          'total games played': 0,
          'win percentage': 0,  // Initialize win percentage to 0
          'win streak': 0, // Initialize win streak to 0
          needsUsernameSetup: !customUsername, // Flag to track if setup is needed
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          no: {
            'of wins': 0,
            'of loss': 0,
            'of draw': 0
          }
        };
        
        try {
          await setDoc(userRef, userData);
        } catch (writeError: any) {
          throw writeError;
        }
        return userData;
      }
    } catch (error) {
      throw error;
    }
  }

  // Update user's online status
  static async updateUserOnlineStatus(uid: string, isOnline: boolean): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        isOnline,
        lastLoginAt: serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  }

  // Record game result
  static async recordGameResult(uid: string, result: 'win' | 'loss' | 'draw'): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      
      // First, get current user data to calculate new win percentage
      const userData = await this.getUserData(uid);
      if (!userData) {
        throw new Error('User not found');
      }

      const currentWins = userData.no?.['of wins'] || 0;
      const currentTotal = userData['total games played'] || 0;
      const currentWinStreak = userData['win streak'] || 0;
      
      // Calculate new values after this game
      const newTotal = currentTotal + 1;
      const newWins = result === 'win' ? currentWins + 1 : currentWins;
      const newWinPercentage = newTotal > 0 ? (newWins / newTotal) * 100 : 0;
      
      // Update win streak: increment on win, reset to 0 on loss or draw
      const newWinStreak = result === 'win' ? currentWinStreak + 1 : 0;
      
      const updateData: any = {
        'total games played': increment(1),
        'win percentage': Math.round(newWinPercentage * 100) / 100,  // Round to 2 decimal places
        'win streak': newWinStreak  // Update win streak
      };

      if (result === 'win') {
        updateData['no.of wins'] = increment(1);
      } else if (result === 'loss') {
        updateData['no.of loss'] = increment(1);
      } else if (result === 'draw') {
        updateData['no.of draw'] = increment(1);
      }

      await updateDoc(userRef, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Get user statistics
  static async getUserStats(uid: string): Promise<{
    wins: number;
    losses: number;
    draws: number;
    totalGames: number;
    winRate: number;
    winPercentage: number;  // New field from database
    winStreak: number;  // Current win streak
  } | null> {
    try {
      const userData = await this.getUserData(uid);
      if (!userData) return null;

      const wins = userData.no?.['of wins'] || 0;
      const losses = userData.no?.['of loss'] || 0;
      const draws = userData.no?.['of draw'] || 0;
      const totalGames = userData['total games played'] || 0;
      const winPercentage = userData['win percentage'] || 0;  // Get from database
      const winStreak = userData['win streak'] || 0;  // Get from database
      
      // Calculate winRate as fallback (in case database field is missing)
      const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

      return {
        wins,
        losses,
        draws,
        totalGames,
        winRate,
        winPercentage,
        winStreak
      };
    } catch (error) {
      return null;
    }
  }

  // Get all users (for leaderboard)
  static async getAllUsers(): Promise<UserStats[]> {
    try {
      const usersRef = collection(db, 'users');
      const { getDocs } = await import('firebase/firestore');
      const querySnapshot = await getDocs(usersRef);
      
      const users: UserStats[] = [];
      querySnapshot.forEach((doc) => {
        users.push(doc.data() as UserStats);
      });
      
      return users;
    } catch (error) {
      return [];
    }
  }

  // Get leaderboard (top players by wins)
  static async getLeaderboard(limit: number = 10): Promise<UserStats[]> {
    try {
      const users = await this.getAllUsers();
      return users
        .sort((a, b) => (b.no?.['of wins'] || 0) - (a.no?.['of wins'] || 0))
        .slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  // Record individual game with opponent details
  static async recordGameHistory(
    uid: string, 
    opponent: string, 
    result: 'win' | 'loss' | 'draw',
    playerColor: 'white' | 'black',
    gameMode: string
  ): Promise<void> {
    try {
      const gamesRef = collection(db, 'users', uid, 'gameHistory');
      const gameId = `game_${Date.now()}`;
      
      await setDoc(doc(gamesRef, gameId), {
        gameId,
        playerId: uid,
        opponent,
        result,
        playerColor,
        gameMode,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error recording game history:', error);
      throw error;
    }
  }

  // Get user's game history
  static async getGameHistory(uid: string, limitCount: number = 10): Promise<GameRecord[]> {
    try {
      const gamesRef = collection(db, 'users', uid, 'gameHistory');
      const q = query(gamesRef, orderBy('timestamp', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);
      
      const games: GameRecord[] = [];
      querySnapshot.forEach((doc) => {
        games.push(doc.data() as GameRecord);
      });
      
      return games;
    } catch (error) {
      console.error('Error fetching game history:', error);
      return [];
    }
  }

  // Set user in-game status (for preventing duplicate matchmaking)
  static async setUserInGame(uid: string, inGame: boolean, gameId?: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        inGame,
        currentGameId: gameId || null
      });
    } catch (error) {
      console.error('Error setting user in-game status:', error);
      throw error;
    }
  }

  // Check if user is currently in a game
  static async checkUserInGame(uid: string): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        return data.inGame || false;
      }
      return false;
    } catch (error) {
      console.error('Error checking user in-game status:', error);
      return false;
    }
  }
}
