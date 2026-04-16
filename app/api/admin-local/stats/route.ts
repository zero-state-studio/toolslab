import { NextResponse } from 'next/server';
import { getStats } from '@/lib/admin/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.ENABLE_ADMIN !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const stats = getStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database error' },
      { status: 500 }
    );
  }
}
