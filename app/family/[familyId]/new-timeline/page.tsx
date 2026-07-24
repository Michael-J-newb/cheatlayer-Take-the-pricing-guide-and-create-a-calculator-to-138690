import CreateTimelineForm from '@/components/ui/FamilyForms/CreateTimelineForm';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getFamily } from '@/utils/family-helpers/queries';

export default async function NewTimelinePage({
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
    return notFound();
  }

  return (
    <section className="mb-32 bg-black">
      <div className="max-w-lg px-4 py-8 mx-auto sm:px-6 sm:pt-24 lg:px-8">
        <h1 className="text-4xl font-extrabold text-white">
          Start a new timeline
        </h1>
        <p className="mt-3 mb-8 text-zinc-300">
          One timeline per trip or event — everyone in {family.name} will see
          it and can add their photos.
        </p>
        <CreateTimelineForm familyId={family.id} />
      </div>
    </section>
  );
}
