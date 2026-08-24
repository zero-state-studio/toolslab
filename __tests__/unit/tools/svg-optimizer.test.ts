import {
  isSvg,
  svgByteSize,
  computeSavedPercent,
  buildSvgoConfig,
  optimizeSvg,
} from '@/lib/tools/svg-optimizer';

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <!-- a comment -->
  <metadata>made in some editor</metadata>
  <rect x="0" y="0" width="100" height="100" fill="#ff0000"/>
</svg>`;

describe('SVG Optimizer', () => {
  describe('isSvg', () => {
    it('detects SVG markup', () => {
      expect(isSvg('<svg xmlns="...">')).toBe(true);
      expect(isSvg('<svg>\n</svg>')).toBe(true);
    });
    it('rejects non-SVG', () => {
      expect(isSvg('<div>hi</div>')).toBe(false);
      expect(isSvg('not markup at all')).toBe(false);
      expect(isSvg('svguard')).toBe(false);
    });
  });

  describe('svgByteSize', () => {
    it('counts ASCII bytes', () => {
      expect(svgByteSize('abc')).toBe(3);
    });
    it('counts multibyte UTF-8', () => {
      expect(svgByteSize('é')).toBe(2);
    });
  });

  describe('computeSavedPercent', () => {
    it('computes savings', () => {
      expect(computeSavedPercent(100, 60)).toBe(40);
    });
    it('never goes negative', () => {
      expect(computeSavedPercent(100, 120)).toBe(0);
    });
    it('handles zero original', () => {
      expect(computeSavedPercent(0, 0)).toBe(0);
    });
  });

  describe('buildSvgoConfig', () => {
    it('uses the default preset', () => {
      const cfg = buildSvgoConfig();
      expect((cfg.plugins as any[])[0]).toBe('preset-default');
    });
    it('honors multipass and prettify options', () => {
      const cfg = buildSvgoConfig({ multipass: false, prettify: true });
      expect(cfg.multipass).toBe(false);
      expect((cfg.js2svg as any).pretty).toBe(true);
    });
  });

  describe('optimizeSvg', () => {
    it('optimizes and reports savings', async () => {
      const r = await optimizeSvg(SAMPLE);
      expect(r.success).toBe(true);
      expect(r.data).toContain('<svg');
      // comment and metadata are stripped
      expect(r.data).not.toContain('a comment');
      expect(r.data).not.toContain('metadata');
      expect(r.optimizedSize!).toBeLessThan(r.originalSize!);
      expect(r.savedPercent!).toBeGreaterThan(0);
    });

    it('keeps the viewBox attribute', async () => {
      const r = await optimizeSvg(SAMPLE);
      expect(r.data).toContain('viewBox');
    });

    it('errors on empty input', async () => {
      const r = await optimizeSvg('');
      expect(r.success).toBe(false);
    });

    it('errors on non-SVG input', async () => {
      const r = await optimizeSvg('<html></html>');
      expect(r.success).toBe(false);
      expect(r.error).toMatch(/does not look like an SVG/);
    });
  });
});
