interface SuggestionResponse {
  query: string;
  suggestions: string[];
  error?: string;
}

export async function getSearchSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) return [];
  
  try {
    const response = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
    if (response.status === 429) {
      console.log('Rate limit reached, waiting before next request...');
      return [];
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch suggestions');
    }
    
    const data: SuggestionResponse = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
}
