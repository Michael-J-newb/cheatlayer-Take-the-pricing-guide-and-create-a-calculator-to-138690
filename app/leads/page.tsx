import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getNewLeads } from '@/utils/supabase/leads';
import LeadsTable from '@/components/ui/Leads/LeadsTable';

export default async function LeadsPage() {
  const supabase = createClient();
  const user = await getUser(supabase);

  if (!user) return redirect('/signin');

  const initialLeads = await getNewLeads(supabase);

  return (
    <section className="mb-32 bg-black min-h-screen">
      <div className="max-w-6xl px-4 py-8 mx-auto sm:px-6 sm:pt-24 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Nextdoor Leads</h1>
          <span className="text-sm text-zinc-500">
            {initialLeads.length} new in the last 7 days
          </span>
        </div>
        <LeadsTable initialLeads={initialLeads} />
      </div>
    </section>
  );
}
