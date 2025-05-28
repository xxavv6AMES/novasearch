import { NextRequest, NextResponse } from 'next/server';
import { generateOverview } from '@/app/services/astro';
import { BraveSearchResponse } from '@/app/types/search';
import { fetchWithRateLimiting } from '@/app/utils/api';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }
      // We no longer support streaming, always use regular endpoint

    // First get search results directly from Brave API
    const apiKey = process.env.BRAVE_SEARCH_API_KEY || process.env.BRAVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Brave API key is not configured' },
        { status: 500 }
      );
    }

    // Build API parameters
    const apiParams = new URLSearchParams();
    apiParams.append('q', query);
    apiParams.append('safesearch', 'strict');
    
    const response = await fetchWithRateLimiting(
      `https://api.search.brave.com/res/v1/web/search?${apiParams.toString()}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey,
        },
      },
      true // This is a search request
    );    const searchResponse = await response.json() as BraveSearchResponse;

    // Then generate the overview using Bedrock via Lambda
    const astroResponse = await generateOverview(query, searchResponse);

    if (astroResponse.error) {
      return NextResponse.json(
        { error: astroResponse.error },
        { status: 500 }
      );
    }

    // Return with low priority headers to ensure this loads after search results
    return NextResponse.json(
      astroResponse,
      {
        headers: {
          'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
          'Priority': 'low',
          'X-Priority': 'low'
        }
      }
    );
  } catch (error) {
    console.error('Astro overview error:', error);
    return NextResponse.json(
      { error: 'Failed to generate overview' },
      { status: 500 }
    );
  }
}
