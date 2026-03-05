import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for wilayah.id API to avoid browser CORS restrictions.
 * Usage:
 *   GET /api/wilayah?path=districts/33.02
 *   GET /api/wilayah?path=villages/33.02.01
 */
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path');
  if (!path) {
    return NextResponse.json({ error: 'path query param required' }, { status: 400 });
  }

  // Only allow districts and villages paths
  if (!/^(districts|villages)\/[\d.]+$/.test(path)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://wilayah.id/api/${path}.json`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error', status: res.status }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (err) {
    console.error('[wilayah proxy]', err);
    return NextResponse.json({ error: 'Failed to fetch wilayah data' }, { status: 502 });
  }
}
