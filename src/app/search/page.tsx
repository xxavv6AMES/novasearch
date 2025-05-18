'use client';

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SearchBox from "@/app/components/SearchBox";
import SearchResultItem from "@/app/components/SearchResultItem";
import ImageResultItem from "@/app/components/ImageResultItem";
import SearchFilters from "@/app/components/SearchFilters";
import SearchTypeNav from "@/app/components/SearchTypeNav";
import ImageViewer from "@/app/components/ImageViewer";
import AstroOverview from "@/app/components/AstroOverview";
import { searchBrave } from "@/app/services/search";
import { BraveSearchResponse } from "@/app/types/search";
import { ImageResult } from "@/app/types/images";
import { SearchFilters as SearchFiltersType, defaultFilters } from "@/app/types/filters";

// This component will use the searchParams hook
function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [webResults, setWebResults] = useState<BraveSearchResponse['web']['results']>([]);
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [resultCount, setResultCount] = useState<number>(0);
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFiltersType>(defaultFilters);
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

  useEffect(() => {
    if (query) {
      performSearch(query, filters);
    }
  }, [query, filters]);

  const performSearch = async (searchQuery: string, searchFilters: SearchFiltersType) => {
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await searchBrave(searchQuery, searchFilters);
      
      if ('web' in response) {
        // Handle web search results
        setWebResults(response.web.results);
        setImageResults([]);
        setResultCount(response.web.results.length);
      } else {
        // Handle image search results
        setWebResults([]);
        setImageResults(response.results);
        setResultCount(response.results.length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setWebResults([]);
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
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
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
        <div className={filters.type === 'images' ? '' : 'grid grid-cols-1 lg:grid-cols-4 gap-6'}>
          {/* Search Results */}
          <div className={filters.type === 'images' ? 'w-full' : 'lg:col-span-3'}>
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
                    </p>
                    {filters.type === 'images' ? (
                      imageResults.map((result, index) => (
                        <ImageResultItem 
                          key={index} 
                          result={result}
                          onClick={setSelectedImage}
                        />
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
              <AstroOverview
                query={query}
                enabled={astroEnabled}
                onToggle={handleAstroToggle}
                usageCount={astroUsage}
                maxUsage={20}
              />
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer */}
      <ImageViewer 
        image={selectedImage} 
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
}

// Main component that wraps the search results content in Suspense
export default function SearchResults() {
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
          </div>
          <div className="flex justify-center w-full py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 
                         border-t-transparent"></div>
          </div>
        </div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
