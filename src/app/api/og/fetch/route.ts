import { NextResponse } from 'next/server';
import { readLimited, safeFetch, SafeFetchError } from '@/lib/safe-fetch';

export const runtime = 'edge';

function decodeHTMLEntities(text: string): string {
  return text.replace(/&(#?[a-zA-Z0-9]+);/g, (match, entity) => {
    const entities: { [key: string]: string } = {
      'amp': '&',
      'lt': '<',
      'gt': '>',
      'quot': '"',
      'apos': "'",
      '#x27': "'",
      '#39': "'",
      '#x26': '&',
      '#38': '&'
    };
    
    if (entity.startsWith('#')) {
      const code = entity.startsWith('#x') ? 
        parseInt(entity.slice(2), 16) : 
        parseInt(entity.slice(1), 10);
      return String.fromCharCode(code);
    }
    
    return entities[entity] || match;
  });
}

async function extractMetadata(html: string) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"[^>]*>/i) 
    || html.match(/<meta[^>]*content="([^"]+)"[^>]*name="description"[^>]*>/i)
    || html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"[^>]*>/i);
  const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"[^>]*>/i)
    || html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"[^>]*>/i);

  const title = titleMatch?.[1]?.trim() || '';
  const description = descMatch?.[1]?.trim() || '';
  const image = imageMatch?.[1]?.trim() || '';

  return {
    title: decodeHTMLEntities(title),
    description: decodeHTMLEntities(description),
    image: image,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const response = await safeFetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (!contentType.includes('text/html')) {
      return NextResponse.json({ error: 'URL did not return HTML' }, { status: 415 });
    }
    const html = new TextDecoder().decode(await readLimited(response, 2 * 1024 * 1024));
    const metadata = await extractMetadata(html);

    return NextResponse.json({
      ...metadata,
      url,
    });
  } catch (error) {
    console.error('Error fetching metadata:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json({ 
      error: 'Failed to fetch metadata',
    }, { status: error instanceof SafeFetchError ? error.status : 502 });
  }
}
