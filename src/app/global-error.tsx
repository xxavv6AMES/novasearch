'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="text-center max-w-2xl mx-auto p-8 rounded-xl bg-white dark:bg-gray-800 shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Something went wrong!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error.message || 'An unexpected error occurred'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => reset()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Try again
              </button>
              <Link
                href="/"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-center"
              >
                Go to home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
