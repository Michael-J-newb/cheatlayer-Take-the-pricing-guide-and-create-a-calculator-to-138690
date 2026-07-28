import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import archiver from 'archiver';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { PHOTOS_BUCKET } from '@/utils/supabase/storage';

// Streaming zip needs Node (archiver), not Edge.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DownloadBody = {
  mode: 'selected' | 'all' | 'liked';
  photoIds?: string[];
};

export async function POST(
  req: NextRequest,
  { params }: { params: { familyId: string; timelineId: string } }
) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  // Membership check through RLS: non-members see no timeline row.
  const { data: timeline } = await supabase
    .from('timelines')
    .select('id, family_id, name')
    .eq('id', params.timelineId)
    .maybeSingle();
  if (!timeline || timeline.family_id !== params.familyId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: DownloadBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  // Photo list is read through the user-scoped client too, so RLS decides
  // what's downloadable; "liked" filters to the caller's own likes.
  let query = supabase
    .from('photos')
    .select('id, storage_path, original_filename, photo_likes(user_id)')
    .eq('timeline_id', params.timelineId);
  if (body.mode === 'selected') {
    const ids = (body.photoIds ?? []).slice(0, 500);
    if (ids.length === 0) {
      return NextResponse.json({ error: 'Nothing selected' }, { status: 400 });
    }
    query = query.in('id', ids);
  }

  const { data: photos, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const wanted = (photos ?? []).filter(
    (p) =>
      body.mode !== 'liked' ||
      (p.photo_likes ?? []).some((l) => l.user_id === user.id)
  );
  if (wanted.length === 0) {
    return NextResponse.json({ error: 'No photos to download' }, { status: 400 });
  }

  const admin = createAdminClient();
  const archive = archiver('zip', { zlib: { level: 0 } }); // photos don't re-compress
  const warnings: string[] = [];

  // Kick off appends asynchronously; fetch each file just-in-time inside
  // the loop (admin download per file — nothing to expire mid-archive),
  // one retry then skip, with skips listed in warnings.txt.
  (async () => {
    const usedNames = new Set<string>();
    for (const photo of wanted) {
      let blob: Blob | null = null;
      for (let attempt = 0; attempt < 2 && !blob; attempt++) {
        const { data } = await admin.storage
          .from(PHOTOS_BUCKET)
          .download(photo.storage_path);
        blob = data ?? null;
      }
      if (!blob) {
        warnings.push(`Skipped (could not fetch): ${photo.original_filename}`);
        continue;
      }
      let name = photo.original_filename || `${photo.id}.jpg`;
      if (usedNames.has(name)) {
        name = `${photo.id.slice(0, 8)}-${name}`;
      }
      usedNames.add(name);
      archive.append(Buffer.from(await blob.arrayBuffer()), { name });
    }
    if (warnings.length > 0) {
      archive.append(warnings.join('\n'), { name: 'warnings.txt' });
    }
    await archive.finalize();
  })().catch((err) => archive.destroy(err));

  const safeName = timeline.name.replace(/[^a-zA-Z0-9 _-]/g, '').trim();
  const zipName = `${safeName || 'photos'}.zip`;

  return new NextResponse(
    Readable.toWeb(archive as unknown as Readable) as ReadableStream,
    {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipName}"`
      }
    }
  );
}
