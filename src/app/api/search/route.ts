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
  // Generate a unique cache key based on parameters and user session
  // We're excluding timestamp parameter from cache key
  const paramsForCache = new URLSearchParams();
  ['q', 'safesearch', 'freshness', 'country', 'search_lang', 'type'].forEach(param => {
    const value = apiParams.get(param);
    if (value) {
      paramsForCache.append(param, value);
    }
  });
  
  const cacheKey = `search:${paramsForCache.toString()}`;
  
  // Only use the cache if we didn't explicitly request to skip it with a timestamp
  const skipCache = apiParams.has('_ts');
  const cachedResult = !skipCache ? getCachedResponse(cacheKey) : null;
  if (cachedResult) {
    return NextResponse.json(cachedResult);
  }  try {
    console.log(`Making search request to Brave API: ${apiParams.toString()}`);
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

    console.log('Brave API response received');
    const data = await response.json();    setCachedResponse(cacheKey, data);
    
    // Return response with proper headers for browser caching
    return NextResponse.json(
      data, 
      { 
        headers: {
          'Cache-Control': 'private, max-age=60', // Allow browser caching for 1 minute
          'X-Content-Type-Options': 'nosniff',
        }
      }
    );
  } catch (error) {
    console.error('Search error:', error);
    
    // Provide more detailed error messages based on the error type
    let errorMessage = 'Failed to fetch search results';
    let statusCode = 500;
    
    if (error instanceof ApiError) {
      errorMessage = error.message;
      statusCode = error.status;
      console.error('API Error details:', error.data);
    } else if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        errorDetails: error instanceof ApiError ? error.data : null
      },
      { status: statusCode }
    );
  }
}