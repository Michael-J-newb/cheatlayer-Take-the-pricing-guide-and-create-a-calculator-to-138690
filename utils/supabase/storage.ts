import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types_db';

export const PHOTOS_BUCKET = 'family-photos';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * Batch-sign storage paths (one API call, not N). Works with the
 * user-scoped server client: storage RLS grants reads to family members.
 * Returns a map keyed by path; paths that failed to sign are absent.
 */
export async function getSignedUrls(
  supabase: SupabaseClient<Database>,
  paths: string[]
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;

  const { data } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  for (const entry of data ?? []) {
    if (entry.signedUrl && entry.path) {
      urls.set(entry.path, entry.signedUrl);
    }
  }
  return urls;
}
