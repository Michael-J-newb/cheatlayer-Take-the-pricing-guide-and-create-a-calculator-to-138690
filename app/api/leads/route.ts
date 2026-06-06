import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getNewLeads, getLeadHistory } from '@/utils/supabase/leads';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const user = await getUser(supabase);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tab = new URL(request.url).searchParams.get('tab') ?? 'new';

  try {
    const leads =
      tab === 'history' ? await getLeadHistory(supabase) : await getNewLeads(supabase);
    return NextResponse.json({ leads });
  } catch (err: any) {
    console.error('[GET /api/leads]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
