import { NextRequest, NextResponse } from 'next/server';
import { getToolById, updateTool } from '@/lib/admin/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (process.env.ENABLE_ADMIN !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const tool = getToolById(params.id);
    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }
    return NextResponse.json(tool);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (process.env.ENABLE_ADMIN !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const existing = getToolById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    updateTool(params.id, body);
    const updated = getToolById(params.id);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database error' },
      { status: 500 }
    );
  }
}
