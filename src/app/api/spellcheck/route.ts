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
  
  // Always add a default country (required by API)
  const country = searchParams.get('country') || 'US';
  apiParams.append('country', country);
  
  // Copy allowed parameters from request to API call
  ['lang'].forEach(param => {
    const value = searchParams.get(param);
    if (value) {
      apiParams.append(param, value);
    }
  });

  // Check cache first
  const cacheKey = `spellcheck:${apiParams.toString()}`;
  const cachedResult = getCachedResponse(cacheKey);
  if (cachedResult) {
    return NextResponse.json(cachedResult);
  }  try {
    // Add detailed console logging to help debug
    console.log(`Calling Brave Spellcheck API with params: ${apiParams.toString()}`);
    
    const response = await fetchWithRateLimiting(
      `https://api.search.brave.com/res/v1/spellcheck/search?${apiParams.toString()}`,
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
      },
      false // This is not a full search request, more like suggestions
    );

    const data = await response.json();
    setCachedResponse(cacheKey, data);
    return NextResponse.json(data);  } catch (error) {
    console.error('Spellcheck error:', error);
    
    // Extract more detailed error information
    let errorData = null;
    let statusCode = 500;
    
    if (error instanceof ApiError) {
      statusCode = error.status;
      errorData = error.data;
      console.error('API error details:', {
        status: error.status,
        message: error.message,
        data: error.data
      });
    }
    
    return NextResponse.json(
      { 
        error: error instanceof ApiError ? error.message : 'Failed to fetch spellcheck results',
        details: errorData
      },
      { status: statusCode }
    );
  }
}
