'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import Image from 'next/image';
import { getSearchSuggestions } from '../services/suggestions';
import { checkSpelling } from '../services/spellcheck';
import { useDebounce } from 'use-debounce';
import { SearchFilters, defaultFilters } from '../types/filters';

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
  const [spellcheckSuggestion, setSpellcheckSuggestion] = useState<string | null>(null);  // Separate effect for suggestions
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
  
  // Separate effect for spellcheck
  useEffect(() => {
    const fetchSpellcheck = async () => {
      // Reset spellcheck suggestion when query changes
      setSpellcheckSuggestion(null);
      
      // Only check spelling for queries with at least 3 characters
      if (debouncedQuery.trim().length >= 3) {
        try {
          console.log('Checking spelling for:', debouncedQuery);
          const spellcheckResults = await checkSpelling(debouncedQuery, filters);
          
          // If there's a spellcheck suggestion that's different from the query
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
          // Already logging in the service
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

  const handleSubmit = (e: React.FormEvent) => {
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
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex > -1) {
          setQuery(suggestions[selectedIndex]);
          onSearch(suggestions[selectedIndex]);
          setShowSuggestions(false);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div className="w-full relative" ref={suggestionsRef}>      <form onSubmit={handleSubmit}>
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
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 
                     bg-blue-500 text-white rounded-full transition-all 
                     hover:bg-blue-600 font-grotesk text-sm font-medium 
                     group-focus-within:opacity-100 disabled:opacity-50 
                     disabled:cursor-not-allowed"
            disabled={!query.trim()}
          >
            Search
          </button>
        </div>
        
        {/* Spellcheck suggestion */}
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

      {/* Suggestions Dropdown */}
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
