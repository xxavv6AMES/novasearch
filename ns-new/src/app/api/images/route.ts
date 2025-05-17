import { NextRequest, NextResponse } from 'next/server';
import { getCachedResponse, setCachedResponse } from '@/app/utils/cache';
import { fetchWithRateLimiting, ApiError } from '@/app/utils/api';
import { ImageSearchResponse } from '@/app/types/images';

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
  // Map safesearch values
  const safesearch = searchParams.get('safesearch');
  if (safesearch) {
    // Map our values to Brave API values
    const safeSearchMap: Record<string, string> = {
      'strict': 'strict',
      'moderate': 'strict', // Brave only supports 'strict' or 'off'
      'off': 'off'
    };
    apiParams.append('safesearch', safeSearchMap[safesearch] || 'strict');
  }

  // Copy other allowed parameters from request to API call
  ['country', 'search_lang'].forEach(param => {
    const value = searchParams.get(param);
    if (value) {
      apiParams.append(param, value);
    }
  });

  // Set count with a default and maximum value
  const count = searchParams.get('count');
  apiParams.append('count', count ? Math.min(parseInt(count), 100).toString() : '50');

  // Check cache first
  const cacheKey = `image_search:${apiParams.toString()}`;
  const cachedResult = getCachedResponse(cacheKey);
  if (cachedResult) {
    return NextResponse.json(cachedResult);
  }

  try {
    const response = await fetchWithRateLimiting(
      `https://api.search.brave.com/res/v1/images/search?${apiParams.toString()}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey,
        },
      },
      true // This is a search request
    );

    const data = (await response.json()) as ImageSearchResponse;
    setCachedResponse(cacheKey, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Image search error:', error);
    
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
