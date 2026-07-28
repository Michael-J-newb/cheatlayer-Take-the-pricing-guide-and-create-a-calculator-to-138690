import UploadDropzone from '@/components/ui/Upload/UploadDropzone';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getTimeline } from '@/utils/timeline-helpers/queries';

export default async function UploadPage({
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

  return (
    <section className="mb-32 bg-black">
      <div className="max-w-3xl px-4 py-8 mx-auto sm:px-6 sm:pt-24 lg:px-8">
        <Link
          href={`/family/${params.familyId}/${params.timelineId}`}
          className="text-sm text-zinc-400 hover:text-white"
        >
          ← Back to {timeline.name}
        </Link>
        <h1 className="mt-4 text-4xl font-extrabold text-white">
          Add photos to {timeline.name}
        </h1>
        <p className="mt-3 mb-8 text-zinc-300">
          Photo dates and places come from the photos themselves. Photos
          without a date fall back to upload time — they&apos;ll show as
          &quot;date estimated.&quot;
        </p>
        <UploadDropzone
          timelineId={params.timelineId}
          familyId={params.familyId}
        />
      </div>
    </section>
  );
}
