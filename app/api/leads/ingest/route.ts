import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { upsertLeads, setWatermark, IngestPost } from '@/utils/supabase/leads';

interface IngestBody {
  posts: IngestPost[];
  last_post_id?: string;
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const user = await getUser(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: IngestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { posts, last_post_id } = body;

  if (!Array.isArray(posts)) {
    return NextResponse.json({ error: 'posts must be an array' }, { status: 400 });
  }

  for (const p of posts) {
    if (!p.poster_id || !p.post_id) {
      return NextResponse.json(
        { error: 'Each post must have poster_id and post_id' },
        { status: 400 }
      );
    }
  }

  try {
    await upsertLeads(supabase, user.id, posts);

    if (last_post_id) {
      await setWatermark(supabase, user.id, last_post_id);
    }

    return NextResponse.json({ ok: true, ingested: posts.length });
  } catch (err: any) {
    console.error('[POST /api/leads/ingest]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
