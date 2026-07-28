'use client';

export async function sha256Hex(file: File): Promise<string | null> {
  try {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    // Checksums only power duplicate flagging; never block an upload on one.
    return null;
  }
}
