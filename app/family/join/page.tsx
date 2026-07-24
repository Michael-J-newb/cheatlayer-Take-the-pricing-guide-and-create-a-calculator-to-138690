import JoinFamilyForm from '@/components/ui/FamilyForms/JoinFamilyForm';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';

export default async function JoinFamilyPage() {
  const supabase = createClient();
  const user = await getUser(supabase);
  if (!user) {
    return redirect('/signin');
  }

  return (
    <section className="mb-32 bg-black">
      <div className="max-w-lg px-4 py-8 mx-auto sm:px-6 sm:pt-24 lg:px-8">
        <h1 className="text-4xl font-extrabold text-white">Join a family</h1>
        <p className="mt-3 mb-8 text-zinc-300">
          Enter the invite code a family member sent you.
        </p>
        <JoinFamilyForm />
      </div>
    </section>
  );
}
