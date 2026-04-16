import { NextResponse } from 'next/server';
import { upsertToolFromRegistry, getAllTools } from '@/lib/admin/db';
import { tools as registryTools } from '@/lib/tools';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (process.env.ENABLE_ADMIN !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    let synced = 0;
    for (const tool of registryTools) {
      upsertToolFromRegistry({
        id: tool.id,
        name: tool.name,
        icon: tool.icon,
        categories: tool.categories,
        searchVolume: tool.searchVolume,
      });
      synced++;
    }

    const allTools = getAllTools();
    return NextResponse.json({
      synced,
      total: allTools.length,
      message: `Synced ${synced} tools from registry`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync error' },
      { status: 500 }
    );
  }
}
