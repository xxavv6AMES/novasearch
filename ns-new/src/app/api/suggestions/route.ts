import { NextRequest, NextResponse } from 'next/server';
import { getCachedResponse, setCachedResponse } from '@/app/utils/cache';
import { fetchWithRateLimiting, ApiError } from '@/app/utils/api';

interface BraveSuggestionResult {
  query: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key is not configured' },
      { status: 500 }
    );
  }

  // Check cache first
  const cacheKey = `suggest:${query}`;
  const cachedResult = getCachedResponse(cacheKey);
  if (cachedResult) {
    return NextResponse.json(cachedResult);
  }
  try {
    const response = await fetchWithRateLimiting(
      `https://api.search.brave.com/res/v1/suggest/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey,
        },
      },
      false // This is a suggestions request, not a search request
    );

    const data = await response.json();
    const result = {
      query,
      suggestions: Array.isArray(data.results) 
        ? data.results.map((r: BraveSuggestionResult) => r.query) 
        : [],
    };

    // Cache the successful response
    setCachedResponse(cacheKey, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}
