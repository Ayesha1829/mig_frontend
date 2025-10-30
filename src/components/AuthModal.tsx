import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signup' | 'signin';
  onModeChange: (mode: 'signup' | 'signin') => void;
  onUsernameSet?: () => void; // Callback when username is set
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode, onModeChange, onUsernameSet }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  // Username setup flow after social auth
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [pendingAuthUserId, setPendingAuthUserId] = useState<string | null>(null);
  // Email verification flow
  const [needsVerification, setNeedsVerification] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  // Forgot password flow
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);

  // Validate username format
  const validateUsername = (value: string): boolean => {
    // Username must be 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(value);
  };

  // Check username availability with debouncing
  const checkUsernameAvailability = async (value: string) => {
    if (!value) {
      setUsernameError('');
      return;
    }

    if (!validateUsername(value)) {
      setUsernameError('Username must be 3-20 characters (letters, numbers, underscores only)');
      return;
    }
    
    setCheckingUsername(true);
    setUsernameError('');
    
    try {
      const result = await AuthService.checkUsername(value);
      if (!result.available) {
        setUsernameError('Username is already taken');
      } else {
        setUsernameError('');
      }
    } catch (err) {
      setUsernameError('Error checking username');
    } finally {
      setCheckingUsername(false);
    }
  };

  // Handle username change with debouncing
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    
    // Clear existing timeout
    if (usernameCheckTimeout) {
      clearTimeout(usernameCheckTimeout);
    }
    
    // Set new timeout for checking
    if (value) {
      const timeout = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
      setUsernameCheckTimeout(timeout);
    } else {
      setUsernameError('');
      setCheckingUsername(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (mode === 'signup') {
        // Validate username
        if (!username || !validateUsername(username)) {
          setError('Please enter a valid username (3-20 characters)');
          setLoading(false);
          return;
        }
        
        if (usernameError) {
          setError('Please fix the username error');
          setLoading(false);
          return;
        }
        
        if (checkingUsername) {
          setError('Please wait while we check username availability');
          setLoading(false);
          return;
        }  
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
    }

    try {
      if (mode === 'signup') {
        const result: any = await AuthService.signUp(email, password, username);
        if (result.error) {
          setError(result.error);
        } else if (result.verificationSent) {
          setSuccess('Account created! Verification email sent. Please check your inbox.');
          
          // CRITICAL: Reset auth state to reflect that user is signed out
          // This ensures UI shows "Sign In" instead of "Welcome, username"
          if (onUsernameSet) {
            onUsernameSet(); // This should trigger auth state refresh
          }
          
          // Reset form
          setEmail('');
          setUsername('');
          setPassword('');
          setConfirmPassword('');
          setUsernameError('');
          // Close modal after 3 seconds
          setTimeout(() => {
            onClose();
          }, 3000);
        }
      } else {
        const result: any = await AuthService.signIn(email, password);
        if (result.needsVerification) {
          setNeedsVerification(true);
          setPendingVerificationEmail(result.email);
          setError(result.error);
          
          // CRITICAL: Reset auth state since user was signed out
          if (onUsernameSet) {
            onUsernameSet(); // This should trigger auth state refresh
          }
        } else if (result.error) {
          setError(result.error);
        } else {
          setSuccess('Signed in successfully!');
          // Close modal after 1 second
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      }
    } catch (err: any) {
      setError('An unexpected error occurred');
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await AuthService.signInWithGoogle();
      if (result.error) {
        setError(result.error);
      } else {
        // Check if user needs to set a custom username
        const uid = result.user?.uid as string;
        const needsUsername = await AuthService.checkIfUserNeedsUsername(uid);
        if (needsUsername) {
          setPendingAuthUserId(uid);
          setUsername('');
          setShowUsernameSetup(true);
        } else {
          setSuccess('Signed in with Google successfully!');
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      }
    } catch (err: any) {
      setError('An unexpected error occurred');
    }

    setLoading(false);
  };

  const handleFacebookSignIn = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await AuthService.signInWithFacebook();
      if (result.error) {
        setError(result.error);
      } else {
        // Check if user needs to set a custom username
        const uid = result.user?.uid as string;
        const needsUsername = await AuthService.checkIfUserNeedsUsername(uid);
        if (needsUsername) {
          setPendingAuthUserId(uid);
          setUsername('');
          setShowUsernameSetup(true);
        } else {
          setSuccess('Signed in with Facebook successfully!');
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      }
    } catch (err: any) {
      setError('An unexpected error occurred');
    }

    setLoading(false);
  };

  const handleUsernameSetup = async () => {
    if (!pendingAuthUserId) return;
    // basic validation
    if (!username || !validateUsername(username)) {
      setUsernameError('Username must be 3-20 characters (letters, numbers, underscores only)');
      return;
    }
    if (checkingUsername) return;

    try {
      setLoading(true);
      const availability = await AuthService.checkUsername(username);
      if (!availability.available) {
        setUsernameError('Username is already taken');
        setLoading(false);
        return;
      }

      const { error } = await AuthService.updateUserUsername(pendingAuthUserId, username);
      if (error) {
        setError(error);
      } else {
        setShowUsernameSetup(false);
        setPendingAuthUserId(null);
        setSuccess('Username set successfully!');
        
        // Trigger auth state refresh
        if (onUsernameSet) {
          onUsernameSet();
        }
        
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail || !password) {
      setError('Please enter your password to resend verification email');
      return;
    }
    
    setResendingEmail(true);
    setError('');
    
    try {
      const result = await AuthService.resendVerificationEmail(pendingVerificationEmail, password);
      if (result.success) {
        setSuccess('Verification email sent! Please check your inbox.');
      } else {
        setError(result.error || 'Failed to send verification email');
      }
    } catch (err: any) {
      setError('Failed to resend verification email');
    }
    
    setResendingEmail(false);
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setSendingReset(true);
    setError('');
    setSuccess('');

    try {
      const result = await AuthService.sendPasswordReset(resetEmail);
      if (result.success) {
        setSuccess('Password reset email sent! Please check your inbox.');
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetEmail('');
          setSuccess('');
        }, 3000);
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } catch (err: any) {
      setError('An unexpected error occurred');
    }

    setSendingReset(false);
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>{mode === 'signup' ? 'Sign Up' : 'Sign In'}</h2>
          <button className="auth-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="auth-modal-content">
          {success && (
            <div className="auth-success">
              {success}
            </div>
          )}

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {needsVerification && mode === 'signin' && (
            <div className="verification-notice">
              <p>📧 Your email is not verified yet.</p>
              <button 
                type="button"
                onClick={handleResendVerification}
                disabled={resendingEmail}
                className="resend-btn"
              >
                {resendingEmail ? 'Sending...' : 'Resend Verification Email'}
              </button>
              <p className="small-text">You can play as guest while waiting for verification.</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter your email"
              />
            </div>
            {mode === 'signup' && (
              <div className="auth-form-group">
                <label htmlFor="username">
                  Username
                  {checkingUsername && <span className="checking-text"> (checking...)</span>}
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Choose a username"
                  minLength={3}
                  maxLength={20}
                  className={usernameError ? 'error' : ''}
                />
                {usernameError && (
                  <span className="username-error">
                    {usernameError}
                  </span>
                )}
                {!usernameError && username && !checkingUsername && validateUsername(username) && (
                  <span className="username-success">
                    ✓ Username is available
                  </span>
                )}
              </div>
            )}

            <div className="auth-form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Enter your password"
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="auth-form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Confirm your password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Please wait...' : (mode === 'signup' ? 'Sign Up' : 'Sign In')}
            </button>

            {/* Forgot Password Link - Only show in sign-in mode */}
            {mode === 'signin' && (
              <div className="forgot-password-section">
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button 
            className="auth-google-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button 
            className="auth-facebook-btn"
            onClick={handleFacebookSignIn}
            disabled={loading}
          >
            <svg className="facebook-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continue with Facebook
          </button>

          <div className="auth-switch-mode">
            {mode === 'signup' ? (
              <p>
                Already have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => onModeChange('signin')}
                  className="auth-mode-link"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => onModeChange('signup')}
                  className="auth-mode-link"
                >
                  Sign Up
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    {showUsernameSetup && (
      <div className="auth-modal-overlay" onClick={() => setShowUsernameSetup(false)}>
        <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
          <div className="auth-modal-header">
            <h2>Set Your Username</h2>
            <button className="auth-modal-close" onClick={() => setShowUsernameSetup(false)}>×</button>
          </div>
          <div className="auth-modal-content">
            <div className="auth-form-group">
              <label htmlFor="setup-username">
                Username {checkingUsername && <span className="checking-text">(checking...)</span>}
              </label>
              <input
                id="setup-username"
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="Choose a username"
                minLength={3}
                maxLength={20}
                className={usernameError ? 'error' : ''}
                disabled={loading}
              />
              {usernameError && (
                <span className="username-error">{usernameError}</span>
              )}
            </div>

            <button
              className="auth-submit-btn"
              onClick={handleUsernameSetup}
              disabled={loading || !username || !!usernameError}
            >
              {loading ? 'Saving...' : 'Save Username'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Forgot Password Modal */}
    {showForgotPassword && (
      <div className="auth-modal-overlay" onClick={() => setShowForgotPassword(false)}>
        <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
          <div className="auth-modal-header">
            <h2>Reset Password</h2>
            <button className="auth-modal-close" onClick={() => setShowForgotPassword(false)}>×</button>
          </div>
          
          <div className="auth-modal-content">
            {success && (
              <div className="auth-success">
                {success}
              </div>
            )}

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <p style={{ marginBottom: '15px', color: '#666', fontSize: '0.9rem' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <div className="auth-form-group">
              <label htmlFor="reset-email">Email Address</label>
              <input
                type="email"
                id="reset-email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={sendingReset}
              />
            </div>

            <button
              className="auth-submit-btn"
              onClick={handlePasswordReset}
              disabled={sendingReset}
            >
              {sendingReset ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              className="auth-mode-link"
              style={{ marginTop: '10px', width: '100%', textAlign: 'center' }}
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail('');
                setError('');
                setSuccess('');
              }}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default AuthModal;
