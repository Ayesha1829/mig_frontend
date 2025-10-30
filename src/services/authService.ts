import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase';
import { FirestoreService } from './firestoreService';

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string, username?: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Send verification email
      await sendEmailVerification(user, {
        url: window.location.origin,
        handleCodeInApp: false
      });
      
      // Create user in Firestore
      await FirestoreService.createOrUpdateUser(user, username);
      
      // Sign user out - they can play as guest until verified
      await signOut(auth);
      
      return { user: null, error: null, verificationSent: true };
    } catch (error: any) {
      return { user: null, error: error.message, verificationSent: false };
    }
  }
   // Check username availability
   static async checkUsername(username: string): Promise<{ available: boolean; error: string | null }> {
    try {
      const isAvailable = await FirestoreService.checkUsernameAvailability(username);
      return { available: isAvailable, error: null };
    } catch (error: any) {
      return { available: false, error: error.message };
    }
  }
 

  // Sign in with email and password
  static async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Reload user to get fresh verification status
      await user.reload();
      
      // Check if email is verified
      if (!user.emailVerified) {
        await signOut(auth);
        return { 
          user: null, 
          error: 'Please verify your email before signing in.',
          needsVerification: true,
          email: email
        };
      }
      
      // Update user online status
      await FirestoreService.updateUserOnlineStatus(user.uid, true);
      
      return { user, error: null, needsVerification: false };
    } catch (error: any) {
      return { user: null, error: error.message, needsVerification: false };
    }
  }

  // Send verification email
  static async sendVerificationEmail(user: User) {
    try {
      await sendEmailVerification(user, {
        url: window.location.origin,
        handleCodeInApp: false
      });
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      return { success: false, error: error.message };
    }
  }

  // Resend verification email (for when user is trying to sign in)
  static async resendVerificationEmail(email: string, password: string) {
    try {
      // Temporarily sign in to get user object
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Send verification email
      const result = await this.sendVerificationEmail(user);
      
      // Sign them back out
      await signOut(auth);
      
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Reload user to check verification
  static async reloadUser() {
    try {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        return { emailVerified: user.emailVerified, error: null };
      }
      return { emailVerified: false, error: 'No user found' };
    } catch (error: any) {
      return { emailVerified: false, error: error.message };
    }
  }

  // Send password reset email
  static async sendPasswordReset(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, error: null };
    } catch (error: any) {
      let errorMessage = 'Failed to send password reset email';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later';
      }
      return { success: false, error: errorMessage };
    }
  }

  // Check if a user needs to set a custom username (e.g., after social auth)
  static async checkIfUserNeedsUsername(userId: string): Promise<boolean> {
    try {
      const userData = await FirestoreService.getUserData(userId);
      if (!userData) return true;
      // Check the flag first, then fallback to username logic
      return userData.needsUsernameSetup || 
             !userData.username || 
             userData.username === 'User';
    } catch (error) {
      return true;
    }
  }

  // Update username for a user
  static async updateUserUsername(userId: string, username: string) {
    try {
      await FirestoreService.updateUserUsername(userId, username);
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Sign in with Google
  static async signInWithGoogle() {
    try {
      console.log('🔵 Starting Google sign-in...');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      console.log('🔵 Google sign-in successful! User UID:', user.uid);
      console.log('🔵 User email:', user.email);
      console.log('🔵 User display name:', user.displayName);
      
      // Create or update user in Firestore
      console.log('🔵 Calling createOrUpdateUser with UID:', user.uid);
      await FirestoreService.createOrUpdateUser(user);
      console.log('✅ User created/updated in Firestore');
      
      return { user, error: null };
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
      return { user: null, error: error.message };
    }
  }

  // Sign in with Facebook
  static async signInWithFacebook() {
    try {
      console.log('🔵 Starting Facebook sign-in...');
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;
      
      console.log('🔵 Facebook sign-in successful! User UID:', user.uid);
      console.log('🔵 User email:', user.email);
      console.log('🔵 User display name:', user.displayName);
      
      // Create or update user in Firestore
      console.log('🔵 Calling createOrUpdateUser with UID:', user.uid);
      await FirestoreService.createOrUpdateUser(user);
      console.log('✅ User created/updated in Firestore');
      
      return { user, error: null };
    } catch (error: any) {
      console.error('❌ Facebook sign-in error:', error);
      return { user: null, error: error.message };
    }
  }

  // Sign out
  static async signOut() {
    try {
      await signOut(auth);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Get current user
  static getCurrentUser() {
    return auth.currentUser;
  }

  // Record game result
  static async recordGameResult(
    result: 'win' | 'loss' | 'draw',
    opponent?: string,
    playerColor?: 'white' | 'black',
    gameMode?: string
  ) {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('❌ No authenticated user for recording game result');
        throw new Error('No authenticated user');
      }
      
      // IMPORTANT: Only record stats for human vs human games (online mode)
      if (gameMode !== 'online') {
        console.log('🚫 AuthService: Not recording stats - game mode is not online (human vs human):', gameMode);
        return { success: false, error: 'Stats only tracked for human vs human games' };
      }
      
      console.log('📊 AuthService: Recording game result', { 
        uid: user.uid, 
        result, 
        opponent, 
        playerColor, 
        gameMode 
      });
      
      // Record overall stats
      await FirestoreService.recordGameResult(user.uid, result);
      
      // Record game history with opponent details if provided
      if (opponent && playerColor && gameMode) {
        await FirestoreService.recordGameHistory(user.uid, opponent, result, playerColor, gameMode);
        console.log('✅ AuthService: Game history recorded with opponent:', opponent);
      }
      
      console.log('✅ AuthService: Game result recorded successfully');
      return { success: true, error: null };
    } catch (error: any) {
      console.error('❌ AuthService: Error recording game result:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user statistics
  static async getUserStats() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      const stats = await FirestoreService.getUserStats(user.uid);
      return { stats, error: null };
    } catch (error: any) {
      return { stats: null, error: error.message };
    }
  }

  // Get leaderboard
  static async getLeaderboard(limit: number = 10) {
    try {
      const leaderboard = await FirestoreService.getLeaderboard(limit);
      return { leaderboard, error: null };
    } catch (error: any) {
      return { leaderboard: [], error: error.message };
    }
  }
}
