import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { setDisposition } from '@/utils/supabase/leads';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const user = await getUser(supabase);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;
  if (!id) return NextResponse.json({ error: 'Missing lead id' }, { status: 400 });

  let body: { disposition: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.disposition || typeof body.disposition !== 'string') {
    return NextResponse.json({ error: 'disposition is required' }, { status: 400 });
  }

  try {
    await setDisposition(supabase, id, body.disposition);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[PATCH /api/leads/:id]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
