import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getTimeline } from '@/utils/timeline-helpers/queries';
import { recordTimelineView } from '@/utils/timeline-helpers/server';
import { getPhotosForTimeline } from '@/utils/photo-helpers/queries';
import { getFamilyMembers } from '@/utils/family-helpers/queries';
import { getSignedUrls } from '@/utils/supabase/storage';
import PhotoGrid, { GridPhoto } from '@/components/ui/PhotoGrid/PhotoGrid';

export default async function TimelinePage({
  params
}: {
  params: { familyId: string; timelineId: string };
}) {
  const supabase = createClient();
  const user = await getUser(supabase);
  if (!user) {
    return redirect('/signin');
  }

  const timeline = await getTimeline(supabase, params.timelineId);
  if (!timeline || timeline.family_id !== params.familyId) {
    return notFound();
  }

  const [photos, members] = await Promise.all([
    getPhotosForTimeline(supabase, params.timelineId, user.id),
    getFamilyMembers(supabase, params.familyId),
    // Fire-and-forget: clears this member's "new photos" badge.
    recordTimelineView(params.timelineId)
  ]);
  const isOwner = members.some(
    (m) => m.user_id === user.id && m.role === 'owner'
  );

  const signedUrls = await getSignedUrls(
    supabase,
    photos.map((p) => p.preview_storage_path ?? p.storage_path)
  );
  const gridPhotos: GridPhoto[] = photos.map((p) => ({
    ...p,
    displayUrl:
      signedUrls.get(p.preview_storage_path ?? p.storage_path) ?? null
  }));

  return (
    <section className="mb-32 bg-black">
      <div className="max-w-6xl px-4 py-8 mx-auto sm:px-6 sm:pt-24 lg:px-8">
        <Link
          href={`/family/${params.familyId}`}
          className="text-sm text-zinc-400 hover:text-white"
        >
          ← All trips
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div>
            <h1 className="text-4xl font-extrabold text-white">
              {timeline.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'}, in
              the order they were taken
            </p>
          </div>
          <Link
            href={`/family/${params.familyId}/${params.timelineId}/upload`}
            className="px-5 py-2.5 text-sm font-semibold text-black bg-white rounded-md hover:bg-zinc-200"
          >
            Add photos
          </Link>
        </div>

        <PhotoGrid
          photos={gridPhotos}
          timelineId={params.timelineId}
          familyId={params.familyId}
          currentUserId={user.id}
          isOwner={isOwner}
        />
      </div>
    </section>
  );
}
