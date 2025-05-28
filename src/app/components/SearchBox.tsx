'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import { SearchFilters } from '../types/filters';
import { useRouter } from 'next/navigation';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  initialValue?: string;
  filters?: SearchFilters;
}

export default function SearchBox({ onSearch, initialValue = '' }: SearchBoxProps) {
  const [query, setQuery] = useState(initialValue);
  const router = useRouter();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleRefresh = () => {
    if (query.trim()) {
      // Add timestamp to force refresh
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('_ts', Date.now().toString());
      router.push(currentUrl.toString());
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the web..."
            className="w-full px-4 py-3 pr-12 text-lg border-2 border-gray-200 dark:border-gray-700 
                     rounded-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 
                     placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none 
                     focus:border-blue-500 dark:focus:border-blue-400 transition-colors font-jakarta"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 
                     text-gray-500 hover:text-blue-500 transition-colors"
          >
            <Image
              src="/search.svg"
              alt="Search"
              width={20}
              height={20}
              className="text-current"
            />
          </button>
        </div>
        
        <button
          type="button"
          onClick={handleRefresh}
          className="p-3 text-gray-500 hover:text-blue-500 hover:bg-gray-100 
                   dark:hover:bg-gray-800 rounded-full transition-colors"
          title="Refresh results"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
