import { BraveSearchResponse } from '../types/search';
import { SearchFilters } from '../types/filters';
import { ImageSearchResponse } from '../types/images';

export type SearchResults = BraveSearchResponse | ImageSearchResponse;

export async function searchBrave(query: string, filters: SearchFilters): Promise<SearchResults> {
  // Convert filters to URLSearchParams
  const params = new URLSearchParams({ q: query });
  
  if (filters.safesearch) {
    params.append('safesearch', filters.safesearch);
  }
  
  if (filters.freshness) {
    params.append('freshness', filters.freshness);
  }
  
  if (filters.search_lang) {
    params.append('search_lang', filters.search_lang);
  }
  
  if (filters.country) {
    params.append('country', filters.country);
  }

  // Determine the API endpoint based on the search type
  const endpoint = filters.type === 'images' ? '/api/images' : '/api/search';
    if (filters.type && filters.type !== 'web' && filters.type !== 'images') {
    params.append('type', filters.type);
  }

  // Add a cache-busting parameter to prevent using stale cache
  if (filters._timestamp) {
    params.append('_ts', filters._timestamp);
  } else {
    params.append('_ts', Date.now().toString());
  }  try {
    console.log(`Making client-side request to ${endpoint}?${params.toString()}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    // Add high priority fetch for search results
    const response = await fetch(`${endpoint}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Priority': 'high',
        'X-Priority': 'high'
      },
      signal: controller.signal,
      priority: 'high' // This is a non-standard option but supported in some browsers
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Search API error: Status ${response.status}`, errorData);
      
      let errorMessage = 'Search failed';
      if (errorData?.error) {
        errorMessage = `${errorMessage}: ${errorData.error}`;
      } else if (errorData?.message) {
        errorMessage = `${errorMessage}: ${errorData.message}`;
      } else {
        errorMessage = `${errorMessage}: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Search request timed out');
      throw new Error('Search timed out. Please try again.');
    }
    console.error('Search error:', error);
    
    // Re-throw as proper Error object
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred during search');
    }
  }
}

export async function clearCache(): Promise<boolean> {
  try {
    const response = await fetch('/api/clear-cache', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to clear cache');
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
}
