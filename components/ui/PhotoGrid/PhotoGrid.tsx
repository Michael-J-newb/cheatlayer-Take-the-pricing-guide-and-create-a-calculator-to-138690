'use client';

import Button from '@/components/ui/Button';
import LikeButton from './LikeButton';
import UploaderPill from './UploaderPill';
import { deletePhoto, setCoverPhoto } from '@/utils/photo-helpers/server';
import type { TimelinePhoto } from '@/utils/photo-helpers/queries';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

export type GridPhoto = TimelinePhoto & {
  displayUrl: string | null; // signed preview (or original) URL
};

type Props = {
  photos: GridPhoto[];
  timelineId: string;
  familyId: string;
  currentUserId: string;
  isOwner: boolean;
};

export default function PhotoGrid({
  photos,
  timelineId,
  familyId,
  currentUserId,
  isOwner
}: Props) {
  const router = useRouter();
  const [uploaderFilter, setUploaderFilter] = useState<string | null>(null);
  const [likedOnly, setLikedOnly] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const uploaders = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const p of photos) {
      if (!map.has(p.uploader_id)) map.set(p.uploader_id, p.uploader_name);
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [photos]);

  const visible = photos.filter(
    (p) =>
      (!uploaderFilter || p.uploader_id === uploaderFilter) &&
      (!likedOnly || p.liked_by_me)
  );

  const dupeChecksums = useMemo(() => {
    const seen = new Map<string, number>();
    for (const p of photos) {
      if (p.checksum_sha256) {
        seen.set(p.checksum_sha256, (seen.get(p.checksum_sha256) ?? 0) + 1);
      }
    }
    return new Set(
      Array.from(seen.entries())
        .filter(([, n]) => n > 1)
        .map(([sum]) => sum)
    );
  }, [photos]);

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const download = async (mode: 'selected' | 'all' | 'liked') => {
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/family/${familyId}/${timelineId}/download`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode,
            photoIds: mode === 'selected' ? Array.from(selected) : undefined
          })
        }
      );
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photos-${mode}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Download failed — please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const onDelete = async (photoId: string) => {
    if (!confirm('Delete this photo for the whole family?')) return;
    const result = await deletePhoto(photoId);
    if (!result.ok) {
      alert(result.error ?? 'Could not delete photo.');
      return;
    }
    router.refresh();
  };

  const onSetCover = async (photoId: string) => {
    const result = await setCoverPhoto(timelineId, photoId);
    if (result.ok) router.refresh();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mt-6">
        {uploaders.map((u) => (
          <UploaderPill
            key={u.id}
            userId={u.id}
            name={u.name}
            active={uploaderFilter === u.id}
            onClick={() =>
              setUploaderFilter((cur) => (cur === u.id ? null : u.id))
            }
          />
        ))}
        <button
          type="button"
          onClick={() => setLikedOnly((v) => !v)}
          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            likedOnly
              ? 'bg-red-900 text-red-200 ring-2 ring-white'
              : 'bg-zinc-800 text-zinc-300'
          }`}
        >
          ♥ Liked by me
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => {
            setSelectMode((v) => !v);
            setSelected(new Set());
          }}
          className="text-xs text-zinc-300 hover:text-white"
        >
          {selectMode ? 'Cancel selection' : 'Select photos'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mt-4">
        {selectMode && (
          <Button
            variant="slim"
            type="button"
            disabled={selected.size === 0}
            loading={downloading}
            onClick={() => download('selected')}
          >
            Download selected ({selected.size})
          </Button>
        )}
        <Button
          variant="slim"
          type="button"
          loading={downloading}
          disabled={photos.length === 0}
          onClick={() => download('all')}
        >
          Download all
        </Button>
        <Button
          variant="slim"
          type="button"
          loading={downloading}
          disabled={!photos.some((p) => p.liked_by_me)}
          onClick={() => download('liked')}
        >
          Download my liked photos
        </Button>
      </div>

      {visible.length === 0 ? (
        <p className="mt-12 text-zinc-400">
          {photos.length === 0
            ? 'No photos yet — be the first to add some.'
            : 'No photos match this filter.'}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 mt-8 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((photo) => (
            <li
              key={photo.id}
              className={`relative overflow-hidden border rounded-lg group border-zinc-800 ${
                selectMode && selected.has(photo.id) ? 'ring-2 ring-white' : ''
              }`}
            >
              {selectMode && (
                <input
                  type="checkbox"
                  checked={selected.has(photo.id)}
                  onChange={() => toggleSelected(photo.id)}
                  className="absolute z-10 w-5 h-5 top-2 left-2"
                  aria-label={`Select ${photo.original_filename}`}
                />
              )}
              <button
                type="button"
                className="block w-full aspect-square bg-zinc-900"
                onClick={() => selectMode && toggleSelected(photo.id)}
              >
                {photo.displayUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.displayUrl}
                    alt={photo.original_filename}
                    loading="lazy"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="flex items-center justify-center w-full h-full text-xs text-zinc-600">
                    Preview unavailable
                  </span>
                )}
              </button>

              <div className="p-2 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <UploaderPill
                    userId={photo.uploader_id}
                    name={photo.uploader_name}
                  />
                  <LikeButton
                    photoId={photo.id}
                    initialCount={photo.like_count}
                    initialLiked={photo.liked_by_me}
                  />
                </div>
                <p className="text-xs text-zinc-400">
                  {new Date(photo.sort_key).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                  {photo.captured_at_source === 'upload_fallback' && (
                    <span title="No capture date in the photo — showing upload time">
                      {' '}
                      · date estimated
                    </span>
                  )}
                </p>
                {photo.location_town && (
                  <p className="text-xs text-zinc-500">{photo.location_town}</p>
                )}
                {photo.checksum_sha256 &&
                  dupeChecksums.has(photo.checksum_sha256) && (
                    <p className="text-xs text-yellow-500">
                      Possible duplicate
                    </p>
                  )}
                <div className="flex gap-3 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => onSetCover(photo.id)}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      Set as cover
                    </button>
                  )}
                  {photo.uploader_id === currentUserId && (
                    <button
                      type="button"
                      onClick={() => onDelete(photo.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
