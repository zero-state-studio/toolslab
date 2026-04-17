import { NextResponse } from 'next/server';
import { getAllTools } from '@/lib/admin/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.ENABLE_ADMIN !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const tools = getAllTools();
    return NextResponse.json(tools);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database error' },
      { status: 500 }
    );
  }
}
