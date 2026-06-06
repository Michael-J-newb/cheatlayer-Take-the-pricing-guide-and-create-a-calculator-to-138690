import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { bulkDismiss } from '@/utils/supabase/leads';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const user = await getUser(supabase);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { ids: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: 'ids must be a non-empty array' }, { status: 400 });
  }

  try {
    const dismissed = await bulkDismiss(supabase, body.ids);
    return NextResponse.json({ dismissed });
  } catch (err: any) {
    console.error('[POST /api/leads/bulk-dismiss]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
