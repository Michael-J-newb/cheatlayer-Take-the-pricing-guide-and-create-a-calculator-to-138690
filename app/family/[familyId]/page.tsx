import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import {
  getActiveInvite,
  getFamily,
  getFamilyMembers
} from '@/utils/family-helpers/queries';
import InviteCodeManager from '@/components/ui/FamilyForms/InviteCodeManager';

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

  const [members, invite] = await Promise.all([
    getFamilyMembers(supabase, params.familyId),
    getActiveInvite(supabase, params.familyId)
  ]);
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

        {/* Timeline cards land here in M3 */}

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
