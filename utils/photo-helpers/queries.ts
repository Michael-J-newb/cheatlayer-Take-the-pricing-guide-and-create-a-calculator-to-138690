import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import type { Database } from '@/types_db';

export type TimelinePhoto = {
  id: string;
  storage_path: string;
  preview_storage_path: string | null;
  original_filename: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  captured_at: string | null;
  captured_at_source: 'exif' | 'upload_fallback';
  location_town: string | null;
  uploaded_at: string;
  checksum_sha256: string | null;
  uploader_id: string;
  uploader_name: string | null;
  like_count: number;
  liked_by_me: boolean;
  sort_key: string;
};

export const getPhotosForTimeline = cache(
  async (
    supabase: SupabaseClient<Database>,
    timelineId: string,
    currentUserId: string
  ): Promise<TimelinePhoto[]> => {
    const [{ data: photos }, { data: myLikes }] = await Promise.all([
      supabase
        .from('photos')
        .select(
          'id, storage_path, preview_storage_path, original_filename, mime_type, width, height, captured_at, captured_at_source, location_town, uploaded_at, checksum_sha256, uploader_id, users(full_name), photo_likes(count)'
        )
        .eq('timeline_id', timelineId),
      supabase
        .from('photo_likes')
        .select('photo_id')
        .eq('user_id', currentUserId)
    ]);

    const likedSet = new Set((myLikes ?? []).map((l) => l.photo_id));

    return (photos ?? [])
      .map((p) => ({
        id: p.id,
        storage_path: p.storage_path,
        preview_storage_path: p.preview_storage_path,
        original_filename: p.original_filename,
        mime_type: p.mime_type,
        width: p.width,
        height: p.height,
        captured_at: p.captured_at,
        captured_at_source: p.captured_at_source,
        location_town: p.location_town,
        uploaded_at: p.uploaded_at,
        checksum_sha256: p.checksum_sha256,
        uploader_id: p.uploader_id,
        uploader_name: p.users?.full_name ?? null,
        like_count: p.photo_likes?.[0]?.count ?? 0,
        liked_by_me: likedSet.has(p.id),
        sort_key: p.captured_at ?? p.uploaded_at
      }))
      .sort((a, b) => (a.sort_key < b.sort_key ? -1 : 1));
  }
);
