import { BraveSearchResponse } from '../types/search';

interface AstroResponse {
  overview: string;
  error?: string;
}

export async function generateOverview(query: string, searchResults: BraveSearchResponse): Promise<AstroResponse> {  const NLPCLOUD_API_KEY = process.env.NLPCLOUD_API_KEY;
  const NLPCLOUD_MODEL = 'llama-2-70b';

  if (!NLPCLOUD_API_KEY) {
    return {
      overview: '',
      error: 'NLPCloud API key is not configured'
    };
  }

  // Extract relevant information from search results
  const context = searchResults.web.results.slice(0, 3).map(result => ({
    title: result.title,
    description: result.description,
    url: result.url
  }));

  try {
    const response = await fetch(`https://api.nlpcloud.io/v1/${NLPCLOUD_MODEL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NLPCLOUD_API_KEY}`
      },
      body: JSON.stringify({
        text: `Search Query: ${query}\n\nContext:\n${context.map(r => 
          `Title: ${r.title}\nDescription: ${r.description}\nURL: ${r.url}\n`
        ).join('\n')}`,
        size: 'medium',
        format: 'paragraph'
      })
    });

    if (!response.ok) {
      throw new Error(`NLPCloud API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      overview: data.summary
    };
  } catch (error) {
    console.error('Error generating overview:', error);
    return {
      overview: '',
      error: error instanceof Error ? error.message : 'Failed to generate overview'
    };
  }
}
