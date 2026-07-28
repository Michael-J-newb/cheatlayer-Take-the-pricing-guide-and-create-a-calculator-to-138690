'use client';

import exifr from 'exifr';

export type PhotoExif = {
  capturedAt: string | null;
  gpsLat: number | null;
  gpsLng: number | null;
  width: number | null;
  height: number | null;
};

/**
 * Best-effort EXIF extraction in the browser (handles JPEG/HEIC/PNG/TIFF).
 * Returns nulls rather than throwing — missing or unparseable EXIF is the
 * expected case (screenshots, share-stripped exports), not an error.
 */
export async function extractExif(file: File): Promise<PhotoExif> {
  try {
    const data = await exifr.parse(file, {
      pick: [
        'DateTimeOriginal',
        'CreateDate',
        'GPSLatitude',
        'GPSLongitude',
        'ExifImageWidth',
        'ExifImageHeight'
      ],
      gps: true
    });

    const captured: Date | undefined =
      data?.DateTimeOriginal ?? data?.CreateDate;

    return {
      capturedAt:
        captured instanceof Date && !isNaN(captured.getTime())
          ? captured.toISOString()
          : null,
      gpsLat: typeof data?.latitude === 'number' ? data.latitude : null,
      gpsLng: typeof data?.longitude === 'number' ? data.longitude : null,
      width: typeof data?.ExifImageWidth === 'number' ? data.ExifImageWidth : null,
      height:
        typeof data?.ExifImageHeight === 'number' ? data.ExifImageHeight : null
    };
  } catch {
    return {
      capturedAt: null,
      gpsLat: null,
      gpsLng: null,
      width: null,
      height: null
    };
  }
}
