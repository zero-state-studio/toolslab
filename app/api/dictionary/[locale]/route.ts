import { NextRequest, NextResponse } from 'next/server';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { locales, type Locale } from '@/lib/i18n/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { locale: string } }
) {
  try {
    const locale = params.locale as Locale;
    const { searchParams } = request.nextUrl;

    // Validate locale
    if (!locales.includes(locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
    }

    // Get sections from query parameter (comma-separated)
    const sectionsParam = searchParams.get('sections');
    const sections = sectionsParam ? sectionsParam.split(',') : undefined;

    // Get dictionary (full or specific sections)
    const dictionary = await getDictionary(locale, sections);

    // Determine cache duration based on request type
    // Translations only change on deploy, so long cache is safe
    const maxAge = sections ? 86400 : 86400; // 24h
    const staleWhileRevalidate = sections ? 604800 : 604800; // 7 days

    // Return with cache headers for performance.
    // s-maxage makes the CDN cache authoritative: 6 locales × few section
    // combos = tiny key space, so function invocations drop to ~one per
    // region per day.
    return NextResponse.json(dictionary, {
      headers: {
        'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
        'Content-Type': 'application/json',
        'X-Dictionary-Sections': sections?.join(',') || 'all',
        'X-Dictionary-Locale': locale,
      },
    });
  } catch (error) {
    console.error('Error loading dictionary:', error);
    return NextResponse.json(
      { error: 'Failed to load dictionary' },
      { status: 500 }
    );
  }
}
