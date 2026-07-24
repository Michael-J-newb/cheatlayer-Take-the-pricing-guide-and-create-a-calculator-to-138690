import 'server-only';
import { createAdminClient } from '@/utils/supabase/admin';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'family-photo-timeline/1.0 (personal family app)';
const TIMEOUT_MS = 5000;

// Two decimal places ≈ ~1km — coarse enough to cache aggressively and to
// never leak a street-level location, fine enough to name the town.
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * lat/lng → "Town, Region" via cached Nominatim lookups. Errors and cache
 * misses degrade to null — geocoding must never fail an upload.
 */
export async function reverseGeocodeTown(
  lat: number,
  lng: number
): Promise<string | null> {
  const roundedLat = round2(lat);
  const roundedLng = round2(lng);
  const admin = createAdminClient();

  const { data: cached } = await admin
    .from('geocode_cache')
    .select('location_town')
    .eq('rounded_lat', roundedLat)
    .eq('rounded_lng', roundedLng)
    .maybeSingle();
  if (cached) {
    return cached.location_town;
  }

  let town: string | null = null;
  try {
    const params = new URLSearchParams({
      lat: String(roundedLat),
      lon: String(roundedLng),
      format: 'jsonv2',
      zoom: '10' // city-level result, no street detail
    });
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (res.ok) {
      const body = await res.json();
      const a = body?.address ?? {};
      const locality =
        a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? null;
      const region = a.state ?? a.country ?? null;
      town = locality
        ? region
          ? `${locality}, ${region}`
          : locality
        : null;
    }
  } catch {
    // Rate limit, timeout, or network failure — cache the miss as null so
    // a batch upload doesn't hammer the API retrying the same spot.
  }

  await admin
    .from('geocode_cache')
    .upsert({ rounded_lat: roundedLat, rounded_lng: roundedLng, location_town: town });

  return town;
}
