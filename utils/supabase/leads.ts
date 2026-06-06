import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types_db';

type Lead = Database['public']['Tables']['leads']['Row'];

// New leads: unactioned, not flagged irrelevant, within the 7-day active window.
// Ordered by AI score descending so the best opportunities surface first.
export async function getNewLeads(
  supabase: SupabaseClient<Database>
): Promise<Lead[]> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .is('disposition', null)
    .eq('not_relevant', false)
    .gte('created_at', cutoff)
    .order('score', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(`getNewLeads: ${error.message}`);
  return data ?? [];
}

// Actioned leads for the history tab. Capped at 200 — this is a review view,
// not a full audit log.
export async function getLeadHistory(
  supabase: SupabaseClient<Database>
): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .not('disposition', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw new Error(`getLeadHistory: ${error.message}`);
  return data ?? [];
}

// Set a single lead's disposition. Any non-empty string is valid — the real
// schema uses free-text, not an enum.
export async function setDisposition(
  supabase: SupabaseClient<Database>,
  leadId: string,
  disposition: string
): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ disposition })
    .eq('id', leadId);

  if (error) throw new Error(`setDisposition: ${error.message}`);
}

// Bulk dismiss via DB function — atomic, only affects leads still in the
// new queue (disposition IS NULL).
export async function bulkDismiss(
  supabase: SupabaseClient<Database>,
  leadIds: string[]
): Promise<number> {
  const { data, error } = await supabase.rpc('bulk_dismiss_leads', {
    lead_ids: leadIds
  });

  if (error) throw new Error(`bulkDismiss: ${error.message}`);
  return (data as number) ?? 0;
}
