import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types_db';

type LeadStatus = Database['public']['Enums']['lead_status'];
type LeadRow = Database['public']['Tables']['nextdoor_leads']['Row'];

export interface IngestPost {
  poster_id: string;
  post_id: string;
  poster_name?: string | null;
  post_snippet?: string | null;
  neighborhood?: string | null;
}

export async function getLeadsByStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
  status: LeadStatus
): Promise<LeadRow[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('nextdoor_leads')
    .select('*')
    .eq('user_id', userId)
    .eq('status', status)
    .gt('expires_at', now)
    .order('first_seen_at', { ascending: false });

  if (error) throw new Error(`getLeadsByStatus failed: ${error.message}`);
  return data ?? [];
}

// Inserts new leads using ON CONFLICT DO NOTHING — never overwrites an
// existing lead's status, so dismissed/contacted leads stay that way
// even if the agent re-scans the same post.
export async function upsertLeads(
  supabase: SupabaseClient<Database>,
  userId: string,
  posts: IngestPost[]
): Promise<void> {
  if (posts.length === 0) return;

  const rows = posts.map((p) => ({
    user_id: userId,
    poster_id: p.poster_id,
    post_id: p.post_id,
    poster_name: p.poster_name ?? null,
    post_snippet: p.post_snippet ?? null,
    neighborhood: p.neighborhood ?? null,
    status: 'new' as LeadStatus
  }));

  const { error } = await supabase.from('nextdoor_leads').upsert(rows, {
    onConflict: 'user_id,poster_id,post_id',
    ignoreDuplicates: true
  });

  if (error) throw new Error(`upsertLeads failed: ${error.message}`);
}

export async function updateLeadStatus(
  supabase: SupabaseClient<Database>,
  leadId: string,
  status: LeadStatus
): Promise<void> {
  const { error } = await supabase
    .from('nextdoor_leads')
    .update({
      status,
      status_updated_at: new Date().toISOString()
    })
    .eq('id', leadId);

  if (error) throw new Error(`updateLeadStatus failed: ${error.message}`);
}

export async function getWatermark(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const { data, error } = await supabase
    .from('nextdoor_watermarks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`getWatermark failed: ${error.message}`);
  return data;
}

export async function setWatermark(
  supabase: SupabaseClient<Database>,
  userId: string,
  lastPostId: string,
  lastScannedAt: string = new Date().toISOString()
): Promise<void> {
  const { error } = await supabase.from('nextdoor_watermarks').upsert(
    {
      user_id: userId,
      last_post_id: lastPostId,
      last_scanned_at: lastScannedAt
    },
    { onConflict: 'user_id' }
  );

  if (error) throw new Error(`setWatermark failed: ${error.message}`);
}
