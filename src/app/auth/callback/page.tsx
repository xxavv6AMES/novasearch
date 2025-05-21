'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Handle the authentication callback by redirecting to the home page
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-lg text-gray-600 dark:text-gray-400">Processing authentication...</p>
      </div>
    </div>
  );
}
