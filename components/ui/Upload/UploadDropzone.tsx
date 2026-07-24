'use client';

import Button from '@/components/ui/Button';
import { extractExif } from '@/utils/photo-helpers/exif';
import { sha256Hex } from '@/utils/photo-helpers/checksum';
import {
  createSignedUploadUrl,
  finalizePhotoUpload
} from '@/utils/photo-helpers/server';
import { useRouter } from 'next/navigation';
import React, { useCallback, useRef, useState } from 'react';

type FileStatus =
  | 'queued'
  | 'reading'
  | 'uploading'
  | 'processing'
  | 'done'
  | 'duplicate'
  | 'error';

type UploadItem = {
  id: string;
  file: File;
  status: FileStatus;
  progress: number; // 0-100 transfer progress
  error?: string;
  locationTown?: string | null;
};

function putWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('content-type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

const statusLabel: Record<FileStatus, string> = {
  queued: 'Waiting…',
  reading: 'Reading photo info…',
  uploading: 'Uploading…',
  processing: 'Processing…',
  done: 'Done',
  duplicate: 'Done — possible duplicate',
  error: 'Failed'
};

export default function UploadDropzone({
  timelineId,
  familyId
}: {
  timelineId: string;
  familyId: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const patch = (id: string, changes: Partial<UploadItem>) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...changes } : it))
    );

  const uploadOne = async (item: UploadItem, attempt = 1): Promise<void> => {
    const { file, id } = item;
    try {
      patch(id, { status: 'reading', progress: 0, error: undefined });
      const [exif, checksum] = await Promise.all([
        extractExif(file),
        sha256Hex(file)
      ]);

      const signed = await createSignedUploadUrl(timelineId, file.name);
      if (!signed.ok) throw new Error(signed.error);

      patch(id, { status: 'uploading' });
      await putWithProgress(signed.signedUrl, file, (pct) =>
        patch(id, { progress: pct })
      );

      patch(id, { status: 'processing', progress: 100 });
      const result = await finalizePhotoUpload({
        timelineId,
        storagePath: signed.path,
        originalFilename: file.name,
        mimeType: file.type || 'application/octet-stream',
        capturedAt: exif.capturedAt,
        gpsLat: exif.gpsLat,
        gpsLng: exif.gpsLng,
        width: exif.width,
        height: exif.height,
        checksumSha256: checksum
      });
      if (!result.ok) throw new Error(result.error);

      patch(id, {
        status: result.duplicate ? 'duplicate' : 'done',
        locationTown: result.locationTown
      });
    } catch (err) {
      if (attempt < 2) {
        // One automatic retry — trip wifi drops mid-file all the time.
        return uploadOne(item, attempt + 1);
      }
      patch(id, {
        status: 'error',
        error: err instanceof Error ? err.message : 'Upload failed'
      });
    }
  };

  const startUpload = async (files: File[]) => {
    const newItems: UploadItem[] = files
      .filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: 'queued' as const,
        progress: 0
      }));
    if (newItems.length === 0) return;

    setItems((prev) => [...prev, ...newItems]);
    setBusy(true);
    // Sequential, one at a time: a bad connection on one photo never takes
    // down the batch, and progress stays honest.
    for (const item of newItems) {
      // eslint-disable-next-line no-await-in-loop
      await uploadOne(item);
    }
    setBusy(false);
    router.refresh();
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      startUpload(Array.from(e.dataTransfer.files));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timelineId]
  );

  const doneCount = items.filter(
    (i) => i.status === 'done' || i.status === 'duplicate'
  ).length;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-2 p-12 text-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          dragOver
            ? 'border-white bg-zinc-900'
            : 'border-zinc-700 hover:border-zinc-500'
        }`}
      >
        <p className="text-lg text-white">
          Drop photos here, or tap to choose
        </p>
        <p className="text-sm text-zinc-400">
          You can select as many as you like — they upload one at a time so a
          bad connection never loses the whole batch.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          hidden
          onChange={(e) => {
            startUpload(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-sm text-zinc-400">
            {doneCount} of {items.length} uploaded
          </p>
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="p-3 border rounded-md border-zinc-800"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-white truncate">
                    {item.file.name}
                  </span>
                  <span
                    className={`text-xs whitespace-nowrap ${
                      item.status === 'error'
                        ? 'text-red-400'
                        : item.status === 'duplicate'
                          ? 'text-yellow-400'
                          : 'text-zinc-400'
                    }`}
                  >
                    {statusLabel[item.status]}
                    {item.status === 'uploading' && ` ${item.progress}%`}
                  </span>
                </div>
                {(item.status === 'uploading' ||
                  item.status === 'processing') && (
                  <div className="h-1 mt-2 overflow-hidden rounded bg-zinc-800">
                    <div
                      className="h-full bg-white transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                {item.status === 'error' && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-red-400">{item.error}</span>
                    <Button
                      variant="slim"
                      type="button"
                      onClick={() => uploadOne(item)}
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {!busy && doneCount > 0 && (
            <div className="mt-6">
              <Button
                variant="slim"
                type="button"
                onClick={() => router.push(`/family/${familyId}/${timelineId}`)}
              >
                View timeline
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
