'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { buildPhotoPath, previewPathFor } from '@/utils/photo-helpers/paths';
import { PHOTOS_BUCKET } from '@/utils/supabase/storage';
import { reverseGeocodeTown } from '@/utils/geocode/reverseGeocode';
import { revalidatePath } from 'next/cache';

const PREVIEW_MAX_DIMENSION = 1600;
const PREVIEW_JPEG_QUALITY = 78;
const SIGNED_UPLOAD_TTL_SECONDS = 60 * 60 * 2; // generous: big files, trip wifi

type SignedUploadResult =
  | {
      ok: true;
      path: string;
      token: string;
      signedUrl: string;
    }
  | { ok: false; error: string };

async function requireTimelineMembership(timelineId: string) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { user: null, familyId: null };

  // RLS: non-members get no row back.
  const { data: timeline } = await supabase
    .from('timelines')
    .select('id, family_id')
    .eq('id', timelineId)
    .maybeSingle();

  return { user, familyId: timeline?.family_id ?? null };
}

export async function createSignedUploadUrl(
  timelineId: string,
  filename: string
): Promise<SignedUploadResult> {
  const { user, familyId } = await requireTimelineMembership(timelineId);
  if (!user || !familyId) {
    return { ok: false, error: 'Not a member of this timeline.' };
  }

  const path = buildPhotoPath(familyId, timelineId, filename);
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(PHOTOS_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Could not sign upload.' };
  }
  return {
    ok: true,
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl
  };
}

type FinalizeInput = {
  timelineId: string;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  capturedAt: string | null;
  gpsLat: number | null;
  gpsLng: number | null;
  width: number | null;
  height: number | null;
  checksumSha256: string | null;
};

type FinalizeResult =
  | { ok: true; photoId: string; duplicate: boolean; locationTown: string | null }
  | { ok: false; error: string };

function isHeic(mimeType: string, filename: string) {
  return (
    mimeType === 'image/heic' ||
    mimeType === 'image/heif' ||
    /\.heic$/i.test(filename) ||
    /\.heif$/i.test(filename)
  );
}

async function generatePreview(
  storagePath: string,
  mimeType: string,
  originalFilename: string
): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data: blob, error } = await admin.storage
      .from(PHOTOS_BUCKET)
      .download(storagePath);
    if (error || !blob) return null;

    let input = Buffer.from(await blob.arrayBuffer());

    if (isHeic(mimeType, originalFilename)) {
      // sharp's prebuilt libvips has no HEIC decoder (codec licensing);
      // heic-convert (WASM libheif) handles the decode, sharp the resize.
      const heicConvert = (await import('heic-convert')).default;
      input = Buffer.from(
        await heicConvert({ buffer: input, format: 'JPEG', quality: 0.9 })
      );
    }

    const sharp = (await import('sharp')).default;
    const preview = await sharp(input)
      .rotate() // respect EXIF orientation
      .resize(PREVIEW_MAX_DIMENSION, PREVIEW_MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: PREVIEW_JPEG_QUALITY })
      .toBuffer();

    const previewPath = previewPathFor(storagePath);
    const { error: uploadError } = await admin.storage
      .from(PHOTOS_BUCKET)
      .upload(previewPath, preview, {
        contentType: 'image/jpeg',
        upsert: true
      });
    return uploadError ? null : previewPath;
  } catch {
    // A missing preview never fails the upload; the grid falls back to the
    // original (renders fine everywhere except HEIC on non-Safari).
    return null;
  }
}

export async function finalizePhotoUpload(
  input: FinalizeInput
): Promise<FinalizeResult> {
  const { user, familyId } = await requireTimelineMembership(input.timelineId);
  if (!user || !familyId) {
    return { ok: false, error: 'Not a member of this timeline.' };
  }
  if (!input.storagePath.startsWith(`${familyId}/${input.timelineId}/`)) {
    return { ok: false, error: 'Storage path does not match timeline.' };
  }

  const supabase = createClient();

  // Duplicate *flagging* only — same checksum in this timeline. Never blocks.
  let duplicate = false;
  if (input.checksumSha256) {
    const { data: dupe } = await supabase
      .from('photos')
      .select('id')
      .eq('timeline_id', input.timelineId)
      .eq('checksum_sha256', input.checksumSha256)
      .limit(1)
      .maybeSingle();
    duplicate = !!dupe;
  }

  const [previewPath, locationTown] = await Promise.all([
    generatePreview(input.storagePath, input.mimeType, input.originalFilename),
    input.gpsLat !== null && input.gpsLng !== null
      ? reverseGeocodeTown(input.gpsLat, input.gpsLng)
      : Promise.resolve(null)
  ]);

  // Insert through the user-scoped client so RLS (member + own uploader_id)
  // stays the enforcement point, not app code.
  const { data: photo, error } = await supabase
    .from('photos')
    .insert({
      timeline_id: input.timelineId,
      uploader_id: user.id,
      storage_path: input.storagePath,
      preview_storage_path: previewPath,
      original_filename: input.originalFilename,
      mime_type: input.mimeType,
      width: input.width,
      height: input.height,
      captured_at: input.capturedAt,
      captured_at_source: input.capturedAt ? 'exif' : 'upload_fallback',
      gps_lat: input.gpsLat,
      gps_lng: input.gpsLng,
      location_town: locationTown,
      checksum_sha256: input.checksumSha256
    })
    .select('id')
    .single();

  if (error || !photo) {
    return { ok: false, error: error?.message ?? 'Could not save photo.' };
  }

  revalidatePath(`/family/${familyId}/${input.timelineId}`);
  revalidatePath(`/family/${familyId}`);
  return { ok: true, photoId: photo.id, duplicate, locationTown };
}
