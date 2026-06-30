import { decodeBase64ToBytes } from '@/lib/utils/base64-decode';

/**
 * The helper replaced a synchronous `atob` + per-character loop that spiked INP
 * on large inputs. These tests pin the contract: byte-identical output to the
 * old path, regardless of which decode branch (fetch / atob / Buffer) runs.
 */
describe('decodeBase64ToBytes', () => {
  const toBase64 = (bytes: Uint8Array): string =>
    Buffer.from(bytes).toString('base64');

  it('returns a Uint8Array', async () => {
    const out = await decodeBase64ToBytes(toBase64(new Uint8Array([1, 2, 3])));
    expect(out).toBeInstanceOf(Uint8Array);
  });

  it('decodes ASCII content correctly', async () => {
    const base64 = Buffer.from('Hello, ToolsLab!').toString('base64');
    const out = await decodeBase64ToBytes(base64);
    expect(Buffer.from(out).toString('utf8')).toBe('Hello, ToolsLab!');
  });

  it('preserves high bytes (>127) without sign/charcode corruption', async () => {
    // PNG signature contains 0x89 (137) which a naive charCodeAt loop can mangle.
    const pngSig = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const out = await decodeBase64ToBytes(toBase64(pngSig));
    expect(Array.from(out)).toEqual(Array.from(pngSig));
  });

  it('round-trips every byte value 0..255', async () => {
    const all = new Uint8Array(256);
    for (let i = 0; i < 256; i++) all[i] = i;
    const out = await decodeBase64ToBytes(toBase64(all));
    expect(Array.from(out)).toEqual(Array.from(all));
  });

  it('decodes a PDF header', async () => {
    const pdf = new TextEncoder().encode('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const out = await decodeBase64ToBytes(toBase64(pdf));
    expect(Buffer.from(out.slice(0, 5)).toString('latin1')).toBe('%PDF-');
  });

  it('handles a large payload (1MB) producing the exact byte length', async () => {
    const size = 1024 * 1024;
    const big = new Uint8Array(size);
    for (let i = 0; i < size; i++) big[i] = i & 0xff;
    const out = await decodeBase64ToBytes(toBase64(big));
    expect(out.length).toBe(size);
    expect(out[0]).toBe(0);
    expect(out[size - 1]).toBe((size - 1) & 0xff);
  });
});
