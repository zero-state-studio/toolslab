/**
 * Decode a base64 string to bytes without blocking the main thread.
 *
 * The previous approach (`atob` followed by a per-character JS loop copying
 * `charCodeAt(i) & 0xff` into a Uint8Array) was a single long synchronous task.
 * On large inputs it spiked INP — base64-to-pdf measured 413ms in CrUX, and the
 * whole base64-to-* family sat in the "INP > 200ms (desktop)" group.
 *
 * Browsers decode a base64 `data:` URL natively and asynchronously, so the work
 * happens off the main thread and the interaction can paint immediately instead
 * of waiting on a multi-million-iteration JS loop.
 *
 * Input MUST already be validated and normalised standard base64 (every caller
 * runs `isValidBase64` / `normalizeBase64` first), so the `data:` URL never
 * receives malformed input that would decode leniently.
 */
export async function decodeBase64ToBytes(
  base64: string
): Promise<Uint8Array<ArrayBuffer>> {
  // Preferred path — browsers: native, off-main-thread decode via fetch.
  if (typeof fetch === 'function') {
    try {
      const res = await fetch(`data:application/octet-stream;base64,${base64}`);
      const buf = await res.arrayBuffer();
      return new Uint8Array(buf);
    } catch {
      // Some environments disallow fetching data: URLs — fall through.
    }
  }

  // Fallback — browsers without a usable data: fetch.
  if (typeof atob === 'function') {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i) & 0xff;
    }
    return bytes;
  }

  // Fallback — Node.js (SSR / tests without fetch or atob).
  // Copy into a fresh ArrayBuffer-backed view so the result is always a
  // standard (non-shared) Uint8Array usable directly as a BlobPart.
  const nodeBuf = Buffer.from(base64, 'base64');
  const bytes = new Uint8Array(nodeBuf.byteLength);
  bytes.set(nodeBuf);
  return bytes;
}
