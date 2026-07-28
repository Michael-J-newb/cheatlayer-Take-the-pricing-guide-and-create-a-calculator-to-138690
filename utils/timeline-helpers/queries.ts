import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import type { Database } from '@/types_db';

export type TimelineCard = {
  id: string;
  name: string;
  created_at: string;
  cover_photo_id: string | null;
  photo_count: number;
  first_captured: string | null;
  last_captured: string | null;
  cover_storage_path: string | null;
  new_photo_count: number;
};

export const getTimelinesForFamily = cache(
  async (
    supabase: SupabaseClient<Database>,
    familyId: string,
    currentUserId?: string
  ): Promise<TimelineCard[]> => {
    const [{ data: timelines }, { data: views }] = await Promise.all([
      supabase
        .from('timelines')
        .select(
          // photos! disambiguates: timelines↔photos also relate via cover_photo_id
          'id, name, created_at, cover_photo_id, photos!photos_timeline_id_fkey(id, storage_path, preview_storage_path, captured_at, uploaded_at, uploader_id)'
        )
        .eq('family_id', familyId)
        .order('created_at', { ascending: false }),
      currentUserId
        ? supabase
            .from('timeline_views')
            .select('timeline_id, last_viewed_at')
        : Promise.resolve({ data: [] as { timeline_id: string; last_viewed_at: string }[] })
    ]);

    const lastViewed = new Map(
      (views ?? []).map((v) => [v.timeline_id, v.last_viewed_at])
    );

    return (timelines ?? []).map((timeline) => {
      const photos = timeline.photos ?? [];
      const sortKey = (p: (typeof photos)[number]) =>
        p.captured_at ?? p.uploaded_at;
      const sorted = [...photos].sort((a, b) =>
        sortKey(a) < sortKey(b) ? -1 : 1
      );
      const explicitCover = timeline.cover_photo_id
        ? photos.find((p) => p.id === timeline.cover_photo_id)
        : undefined;
      const cover = explicitCover ?? sorted[0];

      const viewedAt = lastViewed.get(timeline.id);
      const newPhotoCount = currentUserId
        ? photos.filter(
            (p) =>
              p.uploader_id !== currentUserId &&
              (!viewedAt || p.uploaded_at > viewedAt)
          ).length
        : 0;

      return {
        id: timeline.id,
        name: timeline.name,
        created_at: timeline.created_at,
        cover_photo_id: timeline.cover_photo_id,
        photo_count: photos.length,
        first_captured: sorted[0] ? sortKey(sorted[0]) : null,
        last_captured: sorted.length
          ? sortKey(sorted[sorted.length - 1])
          : null,
        cover_storage_path: cover
          ? cover.preview_storage_path ?? cover.storage_path
          : null,
        new_photo_count: newPhotoCount
      };
    });
  }
);

export const getTimeline = cache(
  async (supabase: SupabaseClient<Database>, timelineId: string) => {
    const { data } = await supabase
      .from('timelines')
      .select('id, family_id, name, created_by, created_at, cover_photo_id')
      .eq('id', timelineId)
      .maybeSingle();
    return data;
  }
);
