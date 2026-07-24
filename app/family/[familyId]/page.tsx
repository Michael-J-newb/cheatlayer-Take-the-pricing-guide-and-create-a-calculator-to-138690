import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import {
  getActiveInvite,
  getFamily,
  getFamilyMembers
} from '@/utils/family-helpers/queries';
import { getTimelinesForFamily } from '@/utils/timeline-helpers/queries';
import { getSignedUrls } from '@/utils/supabase/storage';
import InviteCodeManager from '@/components/ui/FamilyForms/InviteCodeManager';

function formatDateRange(first: string | null, last: string | null) {
  if (!first) return null;
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  const from = fmt(first);
  const to = last ? fmt(last) : from;
  return from === to ? from : `${from} – ${to}`;
}

export default async function FamilyPage({
  params
}: {
  params: { familyId: string };
}) {
  const supabase = createClient();
  const user = await getUser(supabase);
  if (!user) {
    return redirect('/signin');
  }

  const family = await getFamily(supabase, params.familyId);
  if (!family) {
    // RLS returns nothing for non-members — same as not existing.
    return notFound();
  }

  const [members, invite, timelines] = await Promise.all([
    getFamilyMembers(supabase, params.familyId),
    getActiveInvite(supabase, params.familyId),
    getTimelinesForFamily(supabase, params.familyId, user.id)
  ]);
  const coverUrls = await getSignedUrls(
    supabase,
    timelines
      .map((t) => t.cover_storage_path)
      .filter((p): p is string => p !== null)
  );
  const isOwner = members.some(
    (m) => m.user_id === user.id && m.role === 'owner'
  );

  return (
    <section className="mb-32 bg-black">
      <div className="max-w-6xl px-4 py-8 mx-auto sm:px-6 sm:pt-24 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-extrabold text-white">{family.name}</h1>
          <Link
            href={`/family/${family.id}/new-timeline`}
            className="px-5 py-2.5 text-sm font-semibold text-black bg-white rounded-md hover:bg-zinc-200"
          >
            New trip
          </Link>
        </div>

        {timelines.length === 0 ? (
          <p className="mt-8 text-lg text-zinc-300">
            No trips yet. Start one and everyone can pile their photos in.
          </p>
        ) : (
          <ul className="grid gap-4 mt-8 sm:grid-cols-2 lg:grid-cols-3">
            {timelines.map((timeline) => {
              const coverUrl = timeline.cover_storage_path
                ? coverUrls.get(timeline.cover_storage_path)
                : undefined;
              const dateRange = formatDateRange(
                timeline.first_captured,
                timeline.last_captured
              );
              return (
                <li key={timeline.id}>
                  <Link
                    href={`/family/${family.id}/${timeline.id}`}
                    className="block overflow-hidden border rounded-lg border-zinc-700 hover:border-zinc-500"
                  >
                    <div className="relative aspect-video bg-zinc-900">
                      {timeline.new_photo_count > 0 && (
                        <span className="absolute z-10 px-2 py-0.5 text-xs font-semibold text-black bg-white rounded-full top-2 right-2">
                          +{timeline.new_photo_count} new
                        </span>
                      )}
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverUrl}
                          alt={`Cover photo for ${timeline.name}`}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-zinc-600">
                          No photos yet
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <span className="text-lg font-semibold text-white">
                        {timeline.name}
                      </span>
                      <span className="block mt-1 text-sm text-zinc-400">
                        {timeline.photo_count}{' '}
                        {timeline.photo_count === 1 ? 'photo' : 'photos'}
                        {dateRange ? ` · ${dateRange}` : ''}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="grid gap-6 mt-12 md:grid-cols-2">
          <div className="p-6 border rounded-lg border-zinc-700">
            <h2 className="text-lg font-semibold text-white">Members</h2>
            <ul className="mt-3 space-y-2">
              {members.map((member) => (
                <li
                  key={member.user_id}
                  className="flex items-center justify-between text-zinc-200"
                >
                  <span>
                    {member.users?.full_name ?? 'Family member'}
                    {member.user_id === user.id && (
                      <span className="text-zinc-500"> (you)</span>
                    )}
                  </span>
                  {member.role === 'owner' && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-300">
                      owner
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {isOwner && (
            <InviteCodeManager
              familyId={family.id}
              activeCode={invite?.code ?? null}
              expiresAt={invite?.expires_at ?? null}
            />
          )}
        </div>
      </div>
    </section>
  );
}
