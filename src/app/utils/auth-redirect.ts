/**
 * Authentication redirect utilities
 */

/**
 * Stores the current URL for post-authentication redirect
 */
export const storeAuthReturnUrl = (url?: string) => {
  if (typeof window === 'undefined') return;
  
  const returnUrl = url || window.location.pathname + window.location.search;
  
  // Don't store auth-related URLs or the home page
  if (returnUrl.startsWith('/auth') || returnUrl === '/') {
    return;
  }
  
  sessionStorage.setItem('auth_return_to', returnUrl);
};

/**
 * Gets and clears the stored return URL
 */
export const getAndClearAuthReturnUrl = (): string => {
  if (typeof window === 'undefined') return '/';
  
  const returnUrl = sessionStorage.getItem('auth_return_to');
  sessionStorage.removeItem('auth_return_to');
  
  return returnUrl || '/';
};

/**
 * Validates that a return URL is safe for redirect
 */
export const validateReturnUrl = (url: string): string => {
  // Only allow relative URLs or URLs from the same origin
  try {
    if (url.startsWith('/')) {
      return url;
    }
    
    const urlObj = new URL(url);
    if (urlObj.origin === window.location.origin) {
      return urlObj.pathname + urlObj.search + urlObj.hash;
    }
  } catch {
    // Invalid URL, return home
  }
  
  return '/';
};

/**
 * Hook to handle authentication redirect from anywhere in the app
 */
export const useAuthRedirect = () => {
  const handleAuthRedirect = (returnTo?: string) => {
    storeAuthReturnUrl(returnTo);
  };
  
  return { handleAuthRedirect };
};
