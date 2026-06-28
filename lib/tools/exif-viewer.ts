/**
 * Read and strip EXIF / image metadata.
 *
 * Reading uses the `exifr` library (dynamically imported, browser-only) to
 * parse EXIF, GPS, IPTC and XMP. Stripping re-encodes the image through a
 * canvas, which drops all metadata. Pure helpers (grouping, GPS formatting,
 * privacy detection) are unit-tested. Everything runs client-side.
 */

export interface ExifField {
  label: string;
  value: string;
}

export interface ExifGroup {
  title: string;
  fields: ExifField[];
}

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}

const GROUP_KEYS: { title: string; keys: string[] }[] = [
  { title: 'Camera', keys: ['Make', 'Model', 'LensModel', 'LensMake', 'Software'] },
  {
    title: 'Exposure',
    keys: [
      'FNumber',
      'ExposureTime',
      'ISO',
      'FocalLength',
      'FocalLengthIn35mmFormat',
      'Flash',
      'ExposureProgram',
      'MeteringMode',
      'WhiteBalance',
    ],
  },
  {
    title: 'Image',
    keys: [
      'ImageWidth',
      'ImageHeight',
      'ExifImageWidth',
      'ExifImageHeight',
      'Orientation',
      'ColorSpace',
      'XResolution',
      'YResolution',
    ],
  },
  {
    title: 'Date & Time',
    keys: ['DateTimeOriginal', 'CreateDate', 'ModifyDate', 'OffsetTime'],
  },
  {
    title: 'Location',
    keys: ['latitude', 'longitude', 'GPSAltitude', 'GPSDateStamp'],
  },
];

/** Round a number to at most `n` decimals, dropping trailing zeros. */
function round(value: number, n = 4): number {
  const f = Math.pow(10, n);
  return Math.round(value * f) / f;
}

/** Stringify any EXIF value into something displayable. */
export function formatExifValue(value: unknown): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().replace('T', ' ').slice(0, 19);
  if (Array.isArray(value)) return value.map(formatExifValue).join(', ');
  if (typeof value === 'number') return String(round(value, 6));
  return String(value);
}

/** Extract GPS coordinates from a parsed EXIF object, if present and valid. */
export function extractGps(data: Record<string, unknown>): GpsCoordinates | null {
  const lat = data.latitude;
  const lon = data.longitude;
  if (typeof lat === 'number' && typeof lon === 'number' && !Number.isNaN(lat) && !Number.isNaN(lon)) {
    return { latitude: round(lat, 6), longitude: round(lon, 6) };
  }
  return null;
}

/** Whether the metadata exposes a precise location (a privacy concern). */
export function hasGps(data: Record<string, unknown>): boolean {
  return extractGps(data) !== null;
}

/** A Google Maps link for coordinates. */
export function mapsUrl(gps: GpsCoordinates): string {
  return `https://www.google.com/maps?q=${gps.latitude},${gps.longitude}`;
}

/**
 * Group a parsed EXIF object into display sections. Keys not in any known
 * group are collected under "Other". Empty groups are omitted.
 */
export function groupExifData(data: Record<string, unknown>): ExifGroup[] {
  const used = new Set<string>();
  const groups: ExifGroup[] = [];

  for (const { title, keys } of GROUP_KEYS) {
    const fields: ExifField[] = [];
    for (const key of keys) {
      if (key in data && data[key] != null && data[key] !== '') {
        used.add(key);
        const value = formatExifValue(data[key]);
        if (value) fields.push({ label: key, value });
      }
    }
    if (fields.length) groups.push({ title, fields });
  }

  const other: ExifField[] = [];
  for (const key of Object.keys(data)) {
    if (used.has(key)) continue;
    const value = formatExifValue(data[key]);
    if (value) other.push({ label: key, value });
  }
  if (other.length) groups.push({ title: 'Other', fields: other });

  return groups;
}

/** Total number of metadata fields across all groups. */
export function countFields(groups: ExifGroup[]): number {
  return groups.reduce((sum, g) => sum + g.fields.length, 0);
}

/** Read all metadata from an image File (browser only). */
export async function readExif(file: File): Promise<Record<string, unknown>> {
  const exifr = (await import('exifr')).default;
  const data = await exifr.parse(file, { gps: true, iptc: true, xmp: true });
  return (data as Record<string, unknown>) ?? {};
}

/**
 * Strip all metadata by re-encoding the image through a canvas (browser only).
 * Returns a new Blob with no EXIF. Output type matches the input where the
 * canvas supports it (JPEG/PNG/WebP), defaulting to JPEG.
 */
export async function stripExif(file: File): Promise<Blob> {
  const type = ['image/png', 'image/webp'].includes(file.type) ? file.type : 'image/jpeg';
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    ctx.drawImage(bitmap, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas is empty'))),
        type,
        type === 'image/jpeg' ? 0.92 : undefined
      );
    });
  } finally {
    bitmap.close();
  }
}
