import { NextRequest, NextResponse } from 'next/server';
import { getCachedResponse, setCachedResponse } from '@/app/utils/cache';
import { fetchWithRateLimiting, ApiError } from '@/app/utils/api';

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

  // Build API parameters
  const apiParams = new URLSearchParams();
  apiParams.append('q', query);

  // Copy allowed parameters from request to API call
  ['safesearch', 'freshness', 'country', 'search_lang', 'type'].forEach(param => {
    const value = searchParams.get(param);
    if (value) {
      apiParams.append(param, value);
    }
  });

  // Check cache first
  const cacheKey = `search:${apiParams.toString()}`;
  const cachedResult = getCachedResponse(cacheKey);
  if (cachedResult) {
    return NextResponse.json(cachedResult);
  }
  try {
    const response = await fetchWithRateLimiting(
      `https://api.search.brave.com/res/v1/web/search?${apiParams.toString()}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey,
        },
      },
      true // This is a search request
    );

    const data = await response.json();
    setCachedResponse(cacheKey, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search results' },
      { status: 500 }
    );
  }
}