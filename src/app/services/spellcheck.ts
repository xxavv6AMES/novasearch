import { SpellcheckResponse } from '../types/spellcheck';
import { SearchFilters } from '../types/filters';

export async function checkSpelling(query: string, filters: SearchFilters): Promise<SpellcheckResponse> {
  // Return early with default response for very short queries
  if (!query || query.trim().length < 3) {
    return {
      type: 'spellcheck',
      query: { original: query },
      results: []
    };
  }
  
  // Convert filters to URLSearchParams
  const params = new URLSearchParams({ q: query });
  
  // Always include country parameter (required by Brave Spellcheck API)
  params.append('country', filters.country || 'US');
  
  if (filters.search_lang) {
    params.append('lang', filters.search_lang);
  }
  
  // Trim the query to make sure it's valid
  if (query.trim().length > 100) {
    query = query.trim().substring(0, 100);
  }

  try {
    console.log(`Sending spellcheck request for query: "${query}" with params:`, params.toString());
    
    const response = await fetch(`/api/spellcheck?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Spellcheck API error response:', errorData);
      console.error('Response status:', response.status, response.statusText);
      
      // Log the full URL that was called to aid debugging
      console.debug('Request URL:', `/api/spellcheck?${params.toString()}`);
      
      throw new Error(`Spellcheck failed: ${errorData.error || errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Spellcheck response:', data);
    return data;
  } catch (error) {
    console.error('Spellcheck error:', error);
    
    // Return empty response structure instead of throwing to prevent UI errors
    return {
      type: 'spellcheck',
      query: { original: query },
      results: []
    };
  }
}
