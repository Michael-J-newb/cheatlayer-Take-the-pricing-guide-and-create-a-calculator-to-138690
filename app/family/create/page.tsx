import CreateFamilyForm from '@/components/ui/FamilyForms/CreateFamilyForm';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';

export default async function CreateFamilyPage() {
  const supabase = createClient();
  const user = await getUser(supabase);
  if (!user) {
    return redirect('/signin');
  }

  return (
    <section className="mb-32 bg-black">
      <div className="max-w-lg px-4 py-8 mx-auto sm:px-6 sm:pt-24 lg:px-8">
        <h1 className="text-4xl font-extrabold text-white">
          Create your family
        </h1>
        <p className="mt-3 mb-8 text-zinc-300">
          You&apos;ll be the owner — you can invite everyone else with a code
          right after.
        </p>
        <CreateFamilyForm />
      </div>
    </section>
  );
}
