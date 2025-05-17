'use client';

import { useState } from 'react';
import { SearchFilters as SearchFiltersType } from '../types/filters';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
}

export default function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof SearchFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 
                 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 
                 rounded-full transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M3 6h18M6 12h12m-9 6h6" />
        </svg>
        Filters
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-white dark:bg-gray-900 
                     border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg 
                     w-72 z-50">
          <div className="space-y-4">
            {/* SafeSearch Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 font-grotesk">
                SafeSearch
              </label>
              <select
                value={filters.safesearch}
                onChange={(e) => handleFilterChange('safesearch', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-200 
                        dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="strict">Strict</option>
                <option value="moderate">Moderate</option>
                <option value="off">Off</option>
              </select>
            </div>

            {/* Content Type Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 font-grotesk">
                Content Type
              </label>              <select
                value={filters.type || 'web'}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-200 
                        dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="web">Web</option>
                <option value="images">Images</option>
                <option value="news">News</option>
                <option value="videos">Videos</option>
              </select>
            </div>

            {/* Time Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 font-grotesk">
                Time Range
              </label>
              <select
                value={filters.freshness || ''}
                onChange={(e) => handleFilterChange('freshness', e.target.value || undefined)}
                className="w-full px-3 py-2 rounded-md border border-gray-200 
                        dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="">All Time</option>
                <option value="past_hour">Past Hour</option>
                <option value="past_day">Past 24 Hours</option>
                <option value="past_week">Past Week</option>
                <option value="past_month">Past Month</option>
                <option value="past_year">Past Year</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
