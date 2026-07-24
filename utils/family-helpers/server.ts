'use server';

import { createClient } from '@/utils/supabase/server';
import { getErrorRedirect, getStatusRedirect } from 'utils/helpers';
import { revalidatePath } from 'next/cache';

const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 8;
const INVITE_TTL_DAYS = 30;

function newInviteCode() {
  const bytes = new Uint8Array(INVITE_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < bytes.length; i++) {
    code += INVITE_CODE_ALPHABET[bytes[i] % INVITE_CODE_ALPHABET.length];
  }
  return code;
}

export async function createFamily(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  if (!name) {
    return getErrorRedirect(
      '/family/create',
      'Name required.',
      'Please give your family a name.'
    );
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return '/signin';
  }

  const { data: family, error } = await supabase
    .from('families')
    .insert({ name, created_by: user.id })
    .select('id')
    .single();

  if (error || !family) {
    return getErrorRedirect(
      '/family/create',
      'Could not create family.',
      error?.message ?? 'Please try again.'
    );
  }

  const { error: memberError } = await supabase
    .from('family_members')
    .insert({ family_id: family.id, user_id: user.id, role: 'owner' });

  if (memberError) {
    return getErrorRedirect(
      '/family/create',
      'Could not create family.',
      memberError.message
    );
  }

  revalidatePath('/');
  return getStatusRedirect(
    `/family/${family.id}`,
    'Family created!',
    'Generate an invite code to bring everyone in.'
  );
}

export async function joinFamilyByCode(formData: FormData) {
  const code = String(formData.get('code') ?? '')
    .trim()
    .toUpperCase();
  if (!code) {
    return getErrorRedirect(
      '/family/join',
      'Code required.',
      'Please enter the invite code you were sent.'
    );
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return '/signin';
  }

  const { data: familyId, error } = await supabase.rpc(
    'join_family_with_code',
    { _code: code }
  );

  if (error || !familyId) {
    return getErrorRedirect(
      '/family/join',
      'Could not join.',
      'That invite code is invalid or expired. Ask the family owner for a fresh one.'
    );
  }

  revalidatePath('/');
  return getStatusRedirect(`/family/${familyId}`, 'Welcome!', '');
}

export async function generateInviteCode(formData: FormData) {
  const familyId = String(formData.get('familyId') ?? '');
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return '/signin';
  }

  // Keep a single active code per family: clear previous ones first.
  // RLS restricts both statements to owners.
  await supabase.from('family_invites').delete().eq('family_id', familyId);

  const code = newInviteCode();
  const expiresAt = new Date(
    Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error } = await supabase.from('family_invites').insert({
    family_id: familyId,
    code,
    created_by: user.id,
    expires_at: expiresAt
  });

  if (error) {
    return getErrorRedirect(
      `/family/${familyId}`,
      'Could not create invite code.',
      'Only the family owner can generate invite codes.'
    );
  }

  revalidatePath(`/family/${familyId}`);
  return getStatusRedirect(
    `/family/${familyId}`,
    'Invite code ready.',
    `Share code ${code} with your family. It works until it expires in ${INVITE_TTL_DAYS} days.`
  );
}

export async function revokeInviteCode(formData: FormData) {
  const familyId = String(formData.get('familyId') ?? '');
  const supabase = createClient();

  const { error } = await supabase
    .from('family_invites')
    .delete()
    .eq('family_id', familyId);

  if (error) {
    return getErrorRedirect(
      `/family/${familyId}`,
      'Could not revoke code.',
      error.message
    );
  }

  revalidatePath(`/family/${familyId}`);
  return getStatusRedirect(`/family/${familyId}`, 'Invite code revoked.', '');
}
