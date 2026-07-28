import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { getFamiliesForUser } from '@/utils/family-helpers/queries';

export default async function HomePage() {
  const supabase = createClient();
  const user = await getUser(supabase);

  if (!user) {
    return redirect('/signin');
  }

  const families = await getFamiliesForUser(supabase);

  return (
    <section className="mb-32 bg-black">
      <div className="max-w-6xl px-4 py-8 mx-auto sm:px-6 sm:pt-24 lg:px-8">
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
          Your Families
        </h1>
        {families.length === 0 ? (
          <p className="mt-5 text-xl text-zinc-200">
            Create a family to start a shared photo timeline, or join one
            with an invite code.
          </p>
        ) : (
          <ul className="grid gap-4 mt-8 sm:grid-cols-2 lg:grid-cols-3">
            {families.map((family) => (
              <li key={family.id}>
                <Link
                  href={`/family/${family.id}`}
                  className="block p-6 border rounded-lg border-zinc-700 hover:border-zinc-500"
                >
                  <span className="text-xl font-semibold text-white">
                    {family.name}
                  </span>
                  <span className="block mt-1 text-sm text-zinc-400">
                    {family.family_members.length}{' '}
                    {family.family_members.length === 1 ? 'member' : 'members'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-4 mt-8">
          <Link
            href="/family/create"
            className="px-6 py-3 text-sm font-semibold text-black bg-white rounded-md hover:bg-zinc-200"
          >
            Create a family
          </Link>
          <Link
            href="/family/join"
            className="px-6 py-3 text-sm font-semibold text-white border rounded-md border-zinc-700 hover:bg-zinc-900"
          >
            Join with a code
          </Link>
        </div>
      </div>
    </section>
  );
}
