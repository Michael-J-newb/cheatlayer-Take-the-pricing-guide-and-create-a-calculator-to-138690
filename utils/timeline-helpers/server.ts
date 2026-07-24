'use server';

import { createClient } from '@/utils/supabase/server';
import { getErrorRedirect, getStatusRedirect } from 'utils/helpers';
import { revalidatePath } from 'next/cache';

export async function createTimeline(formData: FormData) {
  const familyId = String(formData.get('familyId') ?? '');
  const name = String(formData.get('name') ?? '').trim();

  if (!name) {
    return getErrorRedirect(
      `/family/${familyId}/new-timeline`,
      'Name required.',
      'Give the trip or event a name, like "Summer 2026".'
    );
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return '/signin';
  }

  const { data: timeline, error } = await supabase
    .from('timelines')
    .insert({ family_id: familyId, name, created_by: user.id })
    .select('id')
    .single();

  if (error || !timeline) {
    return getErrorRedirect(
      `/family/${familyId}/new-timeline`,
      'Could not create timeline.',
      error?.message ?? 'Please try again.'
    );
  }

  revalidatePath(`/family/${familyId}`);
  return getStatusRedirect(
    `/family/${familyId}/${timeline.id}`,
    'Timeline created!',
    'Upload the first photos to bring it to life.'
  );
}
