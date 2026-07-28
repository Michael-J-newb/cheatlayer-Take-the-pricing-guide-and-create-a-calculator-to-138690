import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import type { Database } from '@/types_db';

export const getFamiliesForUser = cache(
  async (supabase: SupabaseClient<Database>) => {
    const { data } = await supabase
      .from('families')
      .select('id, name, created_at, family_members(user_id, role)')
      .order('created_at', { ascending: true });
    return data ?? [];
  }
);

export const getFamily = cache(
  async (supabase: SupabaseClient<Database>, familyId: string) => {
    const { data } = await supabase
      .from('families')
      .select('id, name, created_by, created_at')
      .eq('id', familyId)
      .maybeSingle();
    return data;
  }
);

export const getFamilyMembers = cache(
  async (supabase: SupabaseClient<Database>, familyId: string) => {
    const { data } = await supabase
      .from('family_members')
      .select('user_id, role, joined_at, users(full_name, avatar_url)')
      .eq('family_id', familyId)
      .order('joined_at', { ascending: true });
    return data ?? [];
  }
);

export const getActiveInvite = cache(
  async (supabase: SupabaseClient<Database>, familyId: string) => {
    // RLS: only owners get rows back here.
    const { data } = await supabase
      .from('family_invites')
      .select('code, expires_at')
      .eq('family_id', familyId)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    return data;
  }
);
