import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types_db';

// Server-only client with the service role key: bypasses RLS. Used for
// signed upload URLs, preview generation, geocode cache writes, and zip
// downloads — always AFTER an explicit membership check against the
// caller's own session.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Copy it from the Supabase dashboard into .env.local.'
    );
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
