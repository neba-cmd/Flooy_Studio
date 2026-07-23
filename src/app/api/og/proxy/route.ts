import { NextRequest, NextResponse } from 'next/server';
import { readLimited, safeFetch, SafeFetchError } from '@/lib/safe-fetch';

export async function GET(request: NextRequest) {
  try {
    // Get the URL parameter
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('url');
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }
    
    // Fetch the image
    const response = await safeFetch(imageUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }
    
    // Get the image data
    const contentType = response.headers.get('content-type')?.toLowerCase() || '';
    if (!contentType.startsWith('image/') || contentType.includes('svg')) {
      return NextResponse.json({ error: 'URL did not return a supported image' }, { status: 415 });
    }
    const imageData = await readLimited(response, 10 * 1024 * 1024);
    
    // Return the image with appropriate headers
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: error instanceof SafeFetchError ? error.status : 502 }
    );
  }
}
