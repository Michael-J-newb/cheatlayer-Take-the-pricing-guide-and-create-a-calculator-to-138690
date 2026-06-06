import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getLeadsByStatus } from '@/utils/supabase/leads';
import LeadsTable from '@/components/ui/Leads/LeadsTable';

export default async function LeadsPage() {
  const supabase = createClient();
  const user = await getUser(supabase);

  if (!user) {
    return redirect('/signin');
  }

  const initialLeads = await getLeadsByStatus(supabase, user.id, 'new');

  return (
    <section className="mb-32 bg-black min-h-screen">
      <div className="max-w-6xl px-4 py-8 mx-auto sm:px-6 sm:pt-24 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Nextdoor Leads</h1>
        <LeadsTable initialLeads={initialLeads} />
      </div>
    </section>
  );
}
