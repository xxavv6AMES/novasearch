import { NextRequest, NextResponse } from 'next/server';
import { generateOverview, generateOverviewStreaming } from '@/app/services/astro';
import { BraveSearchResponse } from '@/app/types/search';
import { fetchWithRateLimiting } from '@/app/utils/api';

// Add this function for streaming responses
async function streamingResponse(request: NextRequest, query: string) {
  // Create a TransformStream for streaming
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Get search results
  try {
    // Get Brave API key
    const apiKey = process.env.BRAVE_SEARCH_API_KEY || process.env.BRAVE_AI_API_KEY;
    if (!apiKey) {
      await writer.write(encoder.encode('Error: Brave API key is not configured'));
      await writer.close();
      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Build API parameters
    const apiParams = new URLSearchParams();
    apiParams.append('q', query);
    apiParams.append('safesearch', 'strict');
    
    // Fetch search results
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
    
    const searchResponse = await response.json() as BraveSearchResponse;    // Set up streaming options
    await generateOverviewStreaming(query, searchResponse, {
      onToken: async (token: string) => {
        await writer.write(encoder.encode(token));
      },
      onComplete: async () => {
        await writer.close();
      },
      onError: async (error: string) => {
        await writer.write(encoder.encode(`Error: ${error}`));
        await writer.close();
      }
    });

    // Return the stream
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Streaming error:', error);
    await writer.write(encoder.encode(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`));
    await writer.close();
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, stream } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }
    
    // If stream is true, use the streaming endpoint
    if (stream === true) {
      return streamingResponse(request, query);
    }

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
    );

    const searchResponse = await response.json() as BraveSearchResponse;

    // Then generate the overview using NLPCloud
    const astroResponse = await generateOverview(query, searchResponse);

    if (astroResponse.error) {
      return NextResponse.json(
        { error: astroResponse.error },
        { status: 500 }
      );
    }

    return NextResponse.json(astroResponse);
  } catch (error) {
    console.error('Astro overview error:', error);
    return NextResponse.json(
      { error: 'Failed to generate overview' },
      { status: 500 }
    );
  }
}
