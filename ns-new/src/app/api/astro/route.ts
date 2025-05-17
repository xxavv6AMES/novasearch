import { NextRequest, NextResponse } from 'next/server';
import { searchBrave } from '@/app/services/search';
import { generateOverview } from '@/app/services/astro';
import { BraveSearchResponse } from '@/app/types/search';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // First get search results from Brave
    const searchResponse = await searchBrave(query, { safesearch: 'strict' }) as BraveSearchResponse;

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
