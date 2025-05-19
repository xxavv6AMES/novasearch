'use client';

import { useState, useEffect, useRef, KeyboardEvent, FormEvent } from 'react';
import Image from 'next/image';
import { getSearchSuggestions } from '../services/suggestions';
import { checkSpelling } from '../services/spellcheck';
import { useDebounce } from 'use-debounce';
import { SearchFilters, defaultFilters } from '../types/filters';
import { useRouter } from 'next/navigation';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  initialValue?: string;
  filters?: SearchFilters;
}

export default function SearchBox({ onSearch, initialValue = '', filters = defaultFilters }: SearchBoxProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [debouncedQuery] = useDebounce(query, 300);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [spellcheckSuggestion, setSpellcheckSuggestion] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.trim()) {
        try {
          const results = await getSearchSuggestions(debouncedQuery);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching search suggestions:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);
  
  useEffect(() => {
    const fetchSpellcheck = async () => {
      setSpellcheckSuggestion(null);
      
      if (debouncedQuery.trim().length >= 3) {
        try {
          console.log('Checking spelling for:', debouncedQuery);
          const spellcheckResults = await checkSpelling(debouncedQuery, filters);
          
          if (
            spellcheckResults?.results?.length > 0 &&
            spellcheckResults.results[0]?.query &&
            spellcheckResults.results[0].query !== debouncedQuery.trim().toLowerCase()
          ) {
            console.log('Spellcheck suggestion found:', spellcheckResults.results[0].query);
            setSpellcheckSuggestion(spellcheckResults.results[0].query);
          }
        } catch (error) {
          console.error('Failed to check spelling:', error);
        }
      }
    };
    
    fetchSpellcheck();
  }, [debouncedQuery, filters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
        break;      case 'Enter':
        e.preventDefault();
        if (selectedIndex > -1) {
          setQuery(suggestions[selectedIndex]);
          onSearch(suggestions[selectedIndex]);
          setShowSuggestions(false);
        } else {
          // Execute the search directly instead of trying to call handleSubmit with wrong event type
          if (query.trim()) {
            onSearch(query.trim());
            setShowSuggestions(false);
          }
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const handleRefresh = () => {
    if (query.trim()) {
      const searchParams = new URLSearchParams({ q: query, _ts: Date.now().toString() });
      
      if (filters?.type) {
        searchParams.append('type', filters.type);
      }
      
      router.push(`/search?${searchParams.toString()}`);
    }
  };

  return (
    <div className="w-full relative" ref={suggestionsRef}>
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2">
            <Image
              src="/search.svg"
              alt="Search"
              width={20}
              height={20}
              className="text-gray-400 dark:text-gray-600"
            />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(!!suggestions.length)}
            placeholder="Search the web..."
            className="w-full pl-12 pr-28 py-4 text-lg rounded-full border-2 
                     border-gray-200 dark:border-gray-800 bg-white dark:bg-black 
                     focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 
                     transition-all font-jakarta placeholder:text-gray-400 
                     dark:placeholder:text-gray-600"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
            {query && (
              <button 
                type="button" 
                onClick={() => setQuery("")}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            <button 
              type="button" 
              onClick={handleRefresh}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 mr-1"
              title="Refresh results"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            <button type="submit" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
              <Image
                src="/search.svg"
                alt="Search"
                width={20}
                height={20}
                className="dark:invert"
              />
            </button>
          </div>
        </div>
        
        {spellcheckSuggestion && (
          <div className="mt-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Did you mean: </span>
            <button
              onClick={() => {
                setQuery(spellcheckSuggestion);
                onSearch(spellcheckSuggestion);
                setSpellcheckSuggestion(null);
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {spellcheckSuggestion}
            </button>
          </div>
        )}
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 
                      rounded-lg border-2 border-gray-200 dark:border-gray-800 shadow-lg 
                      overflow-hidden z-50">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              onClick={() => {
                setQuery(suggestion);
                onSearch(suggestion);
                setShowSuggestions(false);
              }}
              className={`w-full px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 
                        transition-colors font-jakarta ${
                          index === selectedIndex ? 'bg-gray-100 dark:bg-gray-800' : ''
                        }`}
            >
              <div className="flex items-center gap-3">
                <Image
                  src="/search.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="text-gray-400"
                />
                <span>{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
