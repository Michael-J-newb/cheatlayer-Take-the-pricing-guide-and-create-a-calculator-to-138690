import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { updateLeadStatus } from '@/utils/supabase/leads';
import { Database } from '@/types_db';

type LeadStatus = Database['public']['Enums']['lead_status'];
const VALID_STATUSES: LeadStatus[] = ['new', 'contacted', 'dismissed'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const user = await getUser(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing lead id' }, { status: 400 });
  }

  let body: { status: LeadStatus };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!VALID_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    // RLS enforces user_id = auth.uid(), so cross-user updates are blocked at DB level.
    await updateLeadStatus(supabase, id, body.status);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[PATCH /api/leads/:id]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
