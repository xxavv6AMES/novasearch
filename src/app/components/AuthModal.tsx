'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/auth-context';
import { signInWithEmail, signInWithOAuth, signUp, signOut, verifyOTP } from '../utils/supabase';

enum AuthMode {
  INITIAL,
  LOGIN,
  REGISTER,
  TWO_FACTOR
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(AuthMode.INITIAL);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
    const { user, isAuthenticated } = useAuth();
  
  const modalRef = useRef<HTMLDivElement>(null);
  
  const resetAndClose = useCallback(() => {
    setEmail('');
    setPassword('');
    setOtpCode('');
    setError(null);
    setMode(AuthMode.INITIAL);
    onClose();
  }, [onClose]);
  
  // Handle click outside to close modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        resetAndClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, resetAndClose]);
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode(AuthMode.INITIAL);
      setError(null);
    }
  }, [isOpen]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const { error, data } = await signInWithEmail(email, password);
      
      if (error) throw error;
      
      if (data.session?.user?.factors) {
        // 2FA is enabled for this user
        setMode(AuthMode.TWO_FACTOR);
      } else {
        // Login successful
        resetAndClose();
      }    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const { error } = await signUp(email, password);
      
      if (error) throw error;
      
      // Show success message and redirect to login
      setMode(AuthMode.LOGIN);
      setError('Registration successful! Please check your email to confirm your account.');    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const { error } = await verifyOTP(email, otpCode);
      
      if (error) throw error;
      
      // Login successful
      resetAndClose();    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'twitter') => {
    setError(null);
    setLoading(true);
    
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) throw error;    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to sign in with ${provider}`);
      setLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    await signOut();
    resetAndClose();
  };
  
  if (!isOpen) return null;
  
  // Already authenticated user view
  if (isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
        <div 
          ref={modalRef}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-80 animate-fadeIn"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account</h2>
            <button 
              onClick={resetAndClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
            <div className="py-3 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                {user?.email?.[0].toUpperCase() || 'U'}
              </span>
            </div>
            <p className="mb-1 font-medium text-gray-900 dark:text-white">{user?.email}</p>
          </div>
          
          <a 
            href="https://account.novasuite.one" 
            target="_blank"
            rel="noopener noreferrer"
            className="w-full block text-center mt-4 py-2 bg-blue-100 text-blue-600 hover:bg-blue-200 
                     dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50
                     rounded transition-colors"
          >
            Manage Account
          </a>
          
          <button
            onClick={handleSignOut}
            className="w-full mt-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 
                     dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50
                     rounded transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div 
        ref={modalRef}
        className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-80 animate-fadeIn
                   ${mode !== AuthMode.INITIAL ? 'w-96' : ''}`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === AuthMode.INITIAL && 'Sign In'}
            {mode === AuthMode.LOGIN && 'Sign In to Nova'}
            {mode === AuthMode.REGISTER && 'Create Account'}
            {mode === AuthMode.TWO_FACTOR && '2FA Verification'}
          </h2>
          <button 
            onClick={resetAndClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                        rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        
        {/* Initial selection view */}
        {mode === AuthMode.INITIAL && (
          <div className="space-y-4">
            <button 
              onClick={() => setMode(AuthMode.LOGIN)}
              className="w-full py-2.5 px-4 bg-blue-500 hover:bg-blue-600 
                       text-white rounded-md flex items-center justify-center gap-2 
                       transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Login with Nova ID
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleOAuthSignIn('google')}
                className="flex justify-center items-center py-2.5 px-4 bg-white dark:bg-gray-800 
                         hover:bg-gray-50 dark:hover:bg-gray-700 
                         text-gray-700 dark:text-gray-200 rounded-md border border-gray-300 dark:border-gray-600
                         transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
                </svg>
                <span className="sr-only">Google</span>
              </button>
              
              <button
                onClick={() => handleOAuthSignIn('github')}
                className="flex justify-center items-center py-2.5 px-4 bg-white dark:bg-gray-800 
                         hover:bg-gray-50 dark:hover:bg-gray-700 
                         text-gray-700 dark:text-gray-200 rounded-md border border-gray-300 dark:border-gray-600
                         transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.014-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.532 1.03 1.532 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.748-1.026 2.748-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                <span className="sr-only">GitHub</span>
              </button>
              
              <button
                onClick={() => handleOAuthSignIn('twitter')}
                className="flex justify-center items-center py-2.5 px-4 bg-white dark:bg-gray-800 
                         hover:bg-gray-50 dark:hover:bg-gray-700 
                         text-gray-700 dark:text-gray-200 rounded-md border border-gray-300 dark:border-gray-600
                         transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
                <span className="sr-only">Twitter</span>
              </button>
            </div>
            
            <div className="text-center pt-2">
              <a 
                href="https://account.novasuite.one/register" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Register for a new account
              </a>
            </div>
          </div>
        )}
        
        {/* Login form */}
        {mode === AuthMode.LOGIN && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md 
                         text-gray-900 dark:text-white bg-white dark:bg-gray-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <a 
                  href="https://account.novasuite.one/forgot-password" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md 
                         text-gray-900 dark:text-white bg-white dark:bg-gray-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md
                      transition-colors disabled:opacity-70"
            >
              {loading ? (
                <div className="flex justify-center items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleOAuthSignIn('google')}
                className="flex justify-center items-center py-2 px-3 bg-white dark:bg-gray-800 
                         hover:bg-gray-50 dark:hover:bg-gray-700 
                         text-gray-700 dark:text-gray-200 rounded-md border border-gray-300 dark:border-gray-600
                         transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
                </svg>
              </button>
              
              <button
                type="button"
                onClick={() => handleOAuthSignIn('github')}
                className="flex justify-center items-center py-2 px-3 bg-white dark:bg-gray-800 
                         hover:bg-gray-50 dark:hover:bg-gray-700 
                         text-gray-700 dark:text-gray-200 rounded-md border border-gray-300 dark:border-gray-600
                         transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.014-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.532 1.03 1.532 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.748-1.026 2.748-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </button>
              
              <button
                type="button"
                onClick={() => handleOAuthSignIn('twitter')}
                className="flex justify-center items-center py-2 px-3 bg-white dark:bg-gray-800 
                         hover:bg-gray-50 dark:hover:bg-gray-700 
                         text-gray-700 dark:text-gray-200 rounded-md border border-gray-300 dark:border-gray-600
                         transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </button>
            </div>
              <div className="text-center pt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don&apos;t have an account?{' '}
                <a 
                  href="https://account.novasuite.one/register" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Sign up
                </a>
              </p>
            </div>
          </form>
        )}
        
        {/* Registration form */}
        {mode === AuthMode.REGISTER && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md 
                         text-gray-900 dark:text-white bg-white dark:bg-gray-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md 
                         text-gray-900 dark:text-white bg-white dark:bg-gray-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Password must be at least 8 characters long
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md
                      transition-colors disabled:opacity-70"
            >
              {loading ? (
                <div className="flex justify-center items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
            
            <div className="text-center pt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode(AuthMode.LOGIN)}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        )}
        
        {/* 2FA form */}
        {mode === AuthMode.TWO_FACTOR && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Please enter the 6-digit verification code from your authenticator app.
              </p>
              <div className="flex justify-center">
                <input
                  type="text"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  className="w-48 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md 
                          text-gray-900 dark:text-white bg-white dark:bg-gray-800
                          focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md
                      transition-colors disabled:opacity-70"
            >
              {loading ? (
                <div className="flex justify-center items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Verify Code'
              )}
            </button>
            
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode(AuthMode.LOGIN)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Back to login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
