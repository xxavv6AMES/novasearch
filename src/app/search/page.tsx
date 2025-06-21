'use client';

import { useEffect, useState, Suspense, lazy } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../context/auth-context";
import AuthModal from "../components/AuthModal";
import SearchBox from "@/app/components/SearchBox";
import SearchResultItem from "@/app/components/SearchResultItem";
import NewsResultItem from "@/app/components/NewsResultItem";
import ImageResultItem from "@/app/components/ImageResultItem";
import SearchFilters from "@/app/components/SearchFilters";
import SearchTypeNav from "@/app/components/SearchTypeNav";
import ImageViewer from "@/app/components/ImageViewer";
// Lazy load Astro component to prioritize search results
const AstroOverview = lazy(() => import("@/app/components/AstroOverview"));
import { searchBrave, clearCache } from "@/app/services/search";
import { BraveSearchResponse, BraveNewsResponse } from "@/app/types/search";
import { ImageResult } from "@/app/types/images";
import { SearchFilters as SearchFiltersType, defaultFilters } from "@/app/types/filters";

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface SearchResultsContentProps {
  initialQuery: string;
  router: AppRouterInstance;
}

// This component will use the searchParams hook
function SearchResultsContent({ initialQuery, router }: SearchResultsContentProps) {
  const [query, setQuery] = useState(initialQuery);
  const searchParams = useSearchParams();
  
  // Update query when search params change
  useEffect(() => {
    const newQuery = searchParams.get('q') || '';
    if (newQuery !== query) {
      setQuery(newQuery);
    }
  }, [searchParams, query]);

  const { isAuthenticated } = useAuth();
  const [webResults, setWebResults] = useState<BraveSearchResponse['web']['results']>([]);
  const [newsResults, setNewsResults] = useState<BraveNewsResponse['news']['results']>([]);
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [resultCount, setResultCount] = useState<number>(0);
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFiltersType>(() => {
    const typeParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('type') as SearchFiltersType['type'] : undefined;
    return { ...defaultFilters, ...(typeParam ? { type: typeParam as SearchFiltersType['type'] } : {}) };
  });
  const [astroEnabled, setAstroEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('astroEnabled') === 'true';
    }
    return false;
  });
  
  const [astroUsage, setAstroUsage] = useState(() => {
    if (typeof window !== 'undefined') {
      const now = new Date();
      const storedMonth = localStorage.getItem('astroUsageMonth');
      const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
      
      if (storedMonth !== currentMonth) {
        localStorage.setItem('astroUsageMonth', currentMonth);
        localStorage.setItem('astroUsage', '0');
        return 0;
      }
      
      return parseInt(localStorage.getItem('astroUsage') || '0');
    }
    return 0;
  });
  // Extract the timestamp parameter to detect when a manual refresh is requested
  const timestamp = searchParams.get('_ts');
  
  useEffect(() => {
    if (query) {
      performSearch(query, filters, !!timestamp);
    }
  }, [query, filters, timestamp]);
  const performSearch = async (searchQuery: string, searchFilters: SearchFiltersType, forceRefresh: boolean = false) => {
    setIsSearching(true);
    setError(null);
    
    try {
      // Clone the filters to avoid mutating the original object
      const filtersWithRefresh = { ...searchFilters };
      
      // Add a timestamp to force cache bypass when refresh is requested
      if (forceRefresh) {
        filtersWithRefresh._timestamp = Date.now().toString();
      }
        const response = await searchBrave(searchQuery, filtersWithRefresh);
      
      if ('web' in response) {
        // Handle web search results
        setWebResults(response.web.results);
        setNewsResults([]);
        setImageResults([]);
        setResultCount(response.web.results.length);
      } else if ('news' in response) {
        // Handle news search results
        setWebResults([]);
        setNewsResults(response.news.results);
        setImageResults([]);
        setResultCount(response.news.results.length);
      } else {
        // Handle image search results
        setWebResults([]);
        setNewsResults([]);
        setImageResults(response.results);
        setResultCount(response.results.length);
      }    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setWebResults([]);
      setNewsResults([]);
      setImageResults([]);
      setResultCount(0);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (newQuery: string) => {
    router.push(`/search?q=${encodeURIComponent(newQuery)}`);
  };

  const handleAstroToggle = (enabled: boolean) => {
    setAstroEnabled(enabled);
    localStorage.setItem('astroEnabled', enabled.toString());
    
    if (enabled) {
      const newUsage = astroUsage + 1;
      setAstroUsage(newUsage);
      localStorage.setItem('astroUsage', newUsage.toString());
    }
  };
  return (
    <div className="min-h-screen flex flex-col px-4 py-4 gap-6">
      {/* Header with Search */}
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/nova-logo.svg"
              alt="Nova Search"
              width={28}
              height={28}
              className="text-blue-500 dark:text-blue-400 
                       group-hover:scale-110 transition-transform"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 
                          to-purple-500 bg-clip-text text-transparent font-grotesk">
              Nova Search
            </span>
          </Link>
          <button 
            onClick={() => setAuthModalOpen(true)}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 
                    hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full 
                    transition-colors"
          >
            {isAuthenticated ? 'My Account' : 'Sign In'}
          </button>
        </div><div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchBox onSearch={handleSearch} initialValue={query} filters={filters} />
          </div>
          <SearchFilters
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
        <SearchTypeNav 
          searchType={filters.type || 'web'} 
          onTypeChange={(type) => setFilters({ ...filters, type })} 
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-7xl mx-auto">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 
                       border border-red-200 dark:border-red-800 rounded-lg text-red-600 
                       dark:text-red-400">
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto">
        <div className={filters.type === 'images' ? '' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}>
          {/* Search Results */}
          <div className={filters.type === 'images' ? 'w-full' : 'lg:col-span-2'}>
            {isSearching ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 
                             border-t-transparent">
                </div>
              </div>
            ) : (
              <div className={filters.type === 'images' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4'}>
                {resultCount > 0 ? (
                  <>                    <p className="text-sm text-gray-600 dark:text-gray-400 col-span-full">
                      Found {resultCount} results for &quot;{query}&quot;
                    </p>                    {filters.type === 'images' ? (
                      imageResults.map((result, index) => (
                        <ImageResultItem 
                          key={index} 
                          result={result}
                          onClick={setSelectedImage}
                        />
                      ))
                    ) : filters.type === 'news' ? (
                      newsResults.map((result, index) => (
                        <NewsResultItem key={index} result={result} />
                      ))
                    ) : (
                      webResults.map((result, index) => (
                        <SearchResultItem key={index} result={result} />
                      ))
                    )}
                  </>
                ) : !error && (
                  <p className="text-center text-gray-600 dark:text-gray-400 col-span-full">
                    No results found. Try a different search query.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Astro Overviews Sidebar */}
          {filters.type !== 'images' && (
            <div className="lg:col-span-1">
              <Suspense fallback={
                <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2.5"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-2.5"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                </div>
              }>
                {query && resultCount > 0 && (
                  <AstroOverview
                    query={query}
                    enabled={astroEnabled}
                    onToggle={handleAstroToggle}
                    usageCount={astroUsage}
                    maxUsage={20}
                  />
                )}
              </Suspense>
              
              {/* Emergency Cache Clear Button */}
              <div className="mt-4 bg-white dark:bg-gray-900 rounded-lg p-4 shadow">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Having search issues?</h3>
                <button
                  onClick={async () => {
                    setIsSearching(true);
                    try {
                      await clearCache();
                      // Refresh the current search with forced reload
                      if (query) {
                        performSearch(query, filters, true);
                      }
                    } catch (err) {
                      console.error('Failed to clear cache:', err);
                    }
                  }}
                  className="w-full py-2 px-3 text-sm bg-red-100 text-red-600 hover:bg-red-200 
                         dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50
                         rounded transition-colors"
                >
                  Clear Search Cache
                </button>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Use this if search results appear to be stuck.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>      {/* Image Viewer */}
      <ImageViewer 
        image={selectedImage} 
        onClose={() => setSelectedImage(null)}
      />

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

// Main component that wraps the search results content in Suspense
// Wrapper component that uses useSearchParams inside Suspense
function SearchResultsWrapper() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [fallbackAuthModalOpen, setFallbackAuthModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col px-4 py-4 gap-6">
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/nova-logo.svg"
                alt="Nova Search"
                width={28}
                height={28}
                className="text-blue-500 dark:text-blue-400"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 
                            to-purple-500 bg-clip-text text-transparent font-grotesk">
                Nova Search
              </span>
            </Link>
            <button 
              onClick={() => setFallbackAuthModalOpen(true)}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 
                       hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full 
                       transition-colors"
            >
              {isAuthenticated ? 'My Account' : 'Sign In'}
            </button>
          </div>
          <div className="flex justify-center w-full py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 
                         border-t-transparent"></div>
          </div>
        </div>
        <AuthModal isOpen={fallbackAuthModalOpen} onClose={() => setFallbackAuthModalOpen(false)} />
      </div>
    }>
      <SearchResultsContent initialQuery={query} router={router} />
    </Suspense>
  );
}

export default function SearchResults() {
  return <SearchResultsWrapper />;
}
