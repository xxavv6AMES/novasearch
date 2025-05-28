'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './AstroOverview.module.css';

interface AstroOverviewProps {
  query: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  usageCount: number;
  maxUsage: number;
}

const FEATURES = [
  'Quick topic summaries',
  'Research assistance',
  'Secure processing',
  'Contextual insights',
  'Learning support'
] as const;

function AstroOverview({ query, enabled, onToggle, usageCount, maxUsage }: AstroOverviewProps) {
  const [isLoading, setIsLoading] = useState(false);  const [overview, setOverview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);  const [currentQuery, setCurrentQuery] = useState<string | null>(null);  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);  const [showCursor, setShowCursor] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Component mount animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);  // Simplified typewriter effect
  useEffect(() => {
    if (overview && overview !== displayedText) {
      setIsAnimating(true);
      setDisplayedText('');
      setShowCursor(true);
      
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= overview.length) {
          setDisplayedText(overview.slice(0, currentIndex));
          currentIndex += Math.random() > 0.7 ? 2 : 1;        } else {
          clearInterval(interval);
          setIsAnimating(false);
          setTimeout(() => setShowCursor(false), 800);
        }
      }, 25);
      
      return () => clearInterval(interval);
    }
  }, [overview]);
  
  const generateOverview = useCallback(async () => {
    // Prevent duplicate calls
    if (isLoading || !query || currentQuery === query) {
      return;
    }
      setIsLoading(true);      setError(null);
      setOverview("");
      setDisplayedText("");
      setCurrentQuery(query);
      setShowCursor(false);
    
    try {
      const response = await fetch('/api/astro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, stream: false }),
      });
      
      if (!response.ok) {
        // Read the response text first
        const errorText = await response.text();
        try {
          // Try to parse as JSON
          const error = JSON.parse(errorText);
          throw new Error(error.error || error.message || 'Failed to generate overview');
        } catch {
          // If it's not JSON, use the raw text
          throw new Error(errorText || response.statusText || 'Failed to generate overview');
        }
      }

      // Handle regular JSON response
      const data = await response.json();
      if (!data.overview) {
        throw new Error('No overview received from the server');
      }
      
      // Add a small delay before starting the typewriter effect
      setTimeout(() => {
        setOverview(data.overview);
      }, 300);
        
    } catch (err) {      console.error('Error generating overview:', err);      setError(err instanceof Error ? err.message : 'Failed to generate overview');
      setOverview(null);
      setDisplayedText('');
      setShowCursor(false);    } finally {
      setIsLoading(false);
    }
  }, [query, isLoading, currentQuery]);
  // Reset overview when query changes
  useEffect(() => {
    if (currentQuery !== query) {      setOverview(null);
      setDisplayedText('');      setError(null);
      setCurrentQuery(null);
      setIsAnimating(false);
      setShowCursor(false);
    }
  }, [query, currentQuery]);
  
  // Generate overview when enabled, but with a slight delay to prioritize search results
  useEffect(() => {
    if (enabled && query && !overview && !isLoading && currentQuery !== query) {
      // Add a delay to ensure search results are loaded first
      const timer = setTimeout(() => {
        generateOverview();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [enabled, query, overview, isLoading, currentQuery, generateOverview]);

  const handleToggle = () => {
    if (!enabled && usageCount >= maxUsage) {
      return;
    }
    if (!enabled && query && !isLoading && currentQuery !== query) {
      // Add a smooth transition delay
      setTimeout(() => {
        generateOverview();
      }, 100);
    }
    onToggle(!enabled);
  };  return (
    <div className={`w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 relative overflow-hidden transition-all duration-700 hover:shadow-xl transform hover:scale-[1.02] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Background effects - always render but conditionally show */}
      <div className={`absolute inset-0 bg-gradient-to-br from-[#9e00ff]/10 to-transparent transition-opacity duration-500 pointer-events-none ${enabled ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />
      <div className={`absolute -inset-0.5 bg-gradient-to-r from-[#9e00ff] via-purple-600 to-[#9e00ff] rounded-xl blur-lg transition-opacity duration-500 ${enabled ? 'opacity-20' : 'opacity-0'}`} 
           style={{ backgroundSize: '200% 200%', animation: enabled ? 'gradientShift 3s ease infinite' : 'none' }} />

      {/* Header */}
      <div className="relative p-5 border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Astro Icon */}
            <div className={`p-2 rounded-lg transition-all duration-300 ${enabled ? 'bg-[#9e00ff]/10 scale-110' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <svg className={`w-6 h-6 transition-all duration-300 ${enabled ? 'text-[#9e00ff] animate-spin' : 'text-gray-400'}`} 
                   viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                   style={{ animationDuration: enabled ? '8s' : '0s' }}>
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h2 className={`text-xl font-semibold transition-colors duration-300 ${enabled ? 'text-[#9e00ff]' : 'text-gray-900 dark:text-gray-100'}`}>
                Astro Overview
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 transition-opacity duration-300">
                Powered by NovaAI ModelA 8-Pro
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#9e00ff] focus:ring-offset-2 transform hover:scale-110 ${enabled ? 'bg-[#9e00ff] shadow-lg' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            <span className="sr-only">Enable Astro Overview</span>
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-300 ${enabled ? 'translate-x-6 scale-110' : 'translate-x-1'}`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full transition-all duration-300 ${enabled ? 'bg-[#9e00ff] animate-pulse scale-125' : 'bg-gray-400'}`}></span>
            <span className="text-sm text-gray-600 dark:text-gray-400 transition-opacity duration-300">
              {enabled ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="text-sm">
            <span className={`font-medium transition-colors duration-300 ${usageCount >= maxUsage ? 'text-red-500' : 'text-[#9e00ff]'}`}>
              {usageCount}
            </span>
            <span className="text-gray-500 dark:text-gray-400">/{maxUsage} uses this month</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative p-5">
        {!enabled ? (
          <div className="space-y-5">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Astro can provide AI-powered overviews for your searches, helping you quickly understand topics and get more context.
            </p>
            <ul className="space-y-3">
              {FEATURES.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#9e00ff]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#9e00ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            {usageCount >= maxUsage && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    Monthly limit reached
                  </span>
                </div>
              </div>
            )}
          </div>        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-[#9e00ff]/20 border-t-[#9e00ff] animate-spin"></div>
              <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-[#9e00ff]/10 blur-sm animate-pulse"></div>
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium text-[#9e00ff] animate-pulse">
                Generating your overview...
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This may take a moment
              </p>
            </div>
          </div>        ) : overview || displayedText ? (
          <div className={`prose dark:prose-invert max-w-none w-full ${styles.contentContainer}`}>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#9e00ff] to-purple-600 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#9e00ff] m-0">Astro Analysis</h3>
                {isAnimating && (
                  <div className="flex items-center gap-1 ml-2">
                    <span className="text-xs text-gray-500">Live</span>
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
            
            <div className={`p-6 bg-gradient-to-br from-[#9e00ff]/5 to-purple-50/30 dark:from-[#9e00ff]/10 dark:to-purple-900/20 rounded-xl border border-[#9e00ff]/10 shadow-lg ${styles.responseContainer}`}>
              <div className={styles.astroContent}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {displayedText || overview || ""}
                </ReactMarkdown>
                {(isAnimating || showCursor) && (
                  <span className={`inline-block w-0.5 h-5 bg-[#9e00ff] ml-1 ${styles.typingCursor}`}></span>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-[#9e00ff]/10">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    {isAnimating ? (
                      <>
                        <div className="flex gap-1">
                          <div className="w-1 h-1 rounded-full bg-[#9e00ff] animate-bounce"></div>
                          <div className="w-1 h-1 rounded-full bg-[#9e00ff] animate-bounce" style={{ animationDelay: '100ms' }}></div>
                          <div className="w-1 h-1 rounded-full bg-[#9e00ff] animate-bounce" style={{ animationDelay: '200ms' }}></div>
                        </div>
                        <span>Generating response...</span>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#9e00ff] to-purple-600 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span>Powered by Astro AI</span>
                      </div>
                    )}
                  </div>
                  
                  <div className={`text-xs text-[#9e00ff] opacity-75 ${styles.queryTag}`}>
                    <span className="bg-[#9e00ff]/10 px-2 py-1 rounded-full border border-[#9e00ff]/20">
                      &quot;{query.length > 30 ? query.substring(0, 30) + '...' : query}&quot;
                    </span>
                  </div>
                </div>
                
                {!isAnimating && (
                  <div className={`mt-3 flex items-center gap-2 text-xs text-green-600 dark:text-green-400 ${styles.completionBadge}`}>
                    <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Analysis complete</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.375 18.975l-1.425-1.425L12 15.525l4.05 4.05-1.425 1.425L12 17.475l-2.625 2.625z" />
              </svg>
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                {error}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 mb-4 rounded-full bg-[#9e00ff]/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#9e00ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Processing your query for &quot;{query}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative px-5 py-4 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 rounded-b-xl">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#9e00ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Your searches will be processed securely. No personal data is stored.</span>
        </div>
      </div>
    </div>
  );
}

export default AstroOverview;
