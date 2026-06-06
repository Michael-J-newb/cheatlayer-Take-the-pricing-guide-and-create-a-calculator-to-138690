import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getLeadsByStatus } from '@/utils/supabase/leads';
import { Database } from '@/types_db';

type LeadStatus = Database['public']['Enums']['lead_status'];
const VALID_STATUSES: LeadStatus[] = ['new', 'contacted', 'dismissed'];

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const user = await getUser(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = (searchParams.get('status') ?? 'new') as LeadStatus;

  if (!VALID_STATUSES.includes(statusParam)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const leads = await getLeadsByStatus(supabase, user.id, statusParam);
    return NextResponse.json({ leads });
  } catch (err: any) {
    console.error('[GET /api/leads]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
