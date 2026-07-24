/**
 * Storage path convention: familyId/timelineId/<uuid>-<sanitized name>.
 * The first segment is the family id — storage RLS policies key off it.
 */
export function buildPhotoPath(
  familyId: string,
  timelineId: string,
  filename: string
) {
  const sanitized = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(-100)
    .replace(/^[._-]+/, '');
  return `${familyId}/${timelineId}/${crypto.randomUUID()}-${sanitized || 'photo'}`;
}

export function previewPathFor(storagePath: string) {
  return `${storagePath}.preview.jpg`;
}
