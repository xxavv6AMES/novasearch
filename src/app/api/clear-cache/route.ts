import { NextRequest, NextResponse } from 'next/server';
import { clearSearchCache } from '@/app/utils/cache';

export async function POST(request: NextRequest) {
  try {
    clearSearchCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
