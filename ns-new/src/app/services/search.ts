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

  const response = await fetch(`${endpoint}?${params.toString()}`,{
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Search failed: ${error.message || response.statusText}`);
  }

  return response.json();
}
