'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SearchFilters } from '../types/filters';

interface SearchTypeNavProps {
  searchType: string;
  onTypeChange: (type: SearchFilters['type']) => void;
}

export default function SearchTypeNav({ searchType, onTypeChange }: SearchTypeNavProps) {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const types = [
    { id: 'web', label: 'All', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ) },
    { id: 'images', label: 'Images', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ) }
  ];

  return (
    <nav className="flex items-center border-b border-gray-200 dark:border-gray-800">
      <div className="flex space-x-1">
        {types.map((type) => {
          const isActive = (type.id === 'web' && !searchType) || type.id === searchType;
          const href = `/search?q=${encodeURIComponent(query)}&type=${type.id}`;
          
          return (
            <Link
              key={type.id}
              href={href}
              onClick={(e) => {
                e.preventDefault();
                onTypeChange(type.id as SearchFilters['type']);
              }}
              className={`flex items-center px-4 py-2 space-x-2 text-sm border-b-2 transition-colors
                ${isActive 
                  ? 'border-blue-500 text-blue-500 dark:text-blue-400' 
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'}`}
            >
              {type.icon}
              <span>{type.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
