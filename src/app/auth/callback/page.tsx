'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../utils/supabase';
import { getAndClearAuthReturnUrl, validateReturnUrl } from '../../utils/auth-redirect';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the authentication callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
          setStatus('error');
          
          // Redirect to home with error after 3 seconds
          setTimeout(() => {
            router.replace('/?auth_error=' + encodeURIComponent(error.message));
          }, 3000);
          return;
        }

        if (data.session) {
          setStatus('success');
          
          // Get stored return URL
          const storedReturnTo = getAndClearAuthReturnUrl();
          
          // Also check URL parameters for return_to
          const urlReturnTo = searchParams.get('return_to');
          
          // Determine redirect URL (prioritize stored value, then URL param, then home)
          let redirectUrl = storedReturnTo;
          if (urlReturnTo) {
            redirectUrl = validateReturnUrl(urlReturnTo);
          }
            // Small delay for better UX
          setTimeout(() => {
            // Add success parameter to the redirect URL
            const url = new URL(redirectUrl, window.location.origin);
            url.searchParams.set('auth_success', 'true');
            router.replace(url.pathname + url.search);
          }, 1000);
        } else {
          // No session found, redirect to home
          router.replace('/');
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        setError('An unexpected error occurred');
        setStatus('error');
        
        setTimeout(() => {
          router.replace('/?auth_error=unexpected_error');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-red-100 dark:bg-red-900 rounded-full">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Authentication Failed</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Redirecting you back to the home page...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-green-100 dark:bg-green-900 rounded-full">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Authentication Successful!</h2>
          <p className="text-gray-600 dark:text-gray-400">Redirecting you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-lg text-gray-600 dark:text-gray-400">Processing authentication...</p>
      </div>
    </div>
  );
}
