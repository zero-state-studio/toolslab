#!/usr/bin/env node
/**
 * Regenerates lib/tools/skeleton-heights.ts.
 *
 * Tool implementations are code-split and mount only after hydration. The
 * Suspense fallback has to reserve exactly the room the real tool will take,
 * or everything below it jumps (CLS). This measures each tool's empty height
 * at mobile and desktop widths against a running production build.
 *
 * Usage:
 *   npm run build && npm run start -- -p 3111
 *   node scripts/measure-skeleton-heights.js [baseUrl]     # default http://localhost:3111
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://localhost:3111';
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'lib/tools/skeleton-heights.ts');
const VIEWPORTS = [
  { key: 'sm', width: 390, height: 844 },
  { key: 'lg', width: 1280, height: 900 },
];

function toolIds() {
  const src = fs.readFileSync(
    path.join(ROOT, 'components/tools/LazyToolLoader.tsx'),
    'utf8'
  );
  return [...src.matchAll(/'([a-z0-9-]+)':\s*lazy\(/g)].map((m) => m[1]);
}

async function measure(page, id) {
  await page.goto(`${BASE}/tools/${id}`, { waitUntil: 'load', timeout: 20000 });
  // Wait for the real tool to replace the skeleton.
  await page
    .waitForFunction(
      () => {
        const c = document.querySelector('[class*="col-span-9"]');
        return (
          c &&
          c.firstElementChild &&
          !c.firstElementChild.className.includes('animate-pulse')
        );
      },
      { timeout: 10000 }
    )
    .catch(() => {});
  await page.waitForTimeout(700);
  return page.evaluate(() => {
    const c = document.querySelector('[class*="col-span-9"]');
    const el = c && c.firstElementChild;
    return el ? Math.round(el.getBoundingClientRect().height) : null;
  });
}

(async () => {
  const ids = toolIds();
  const heights = {};
  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await ctx.newPage();
    for (const id of ids) {
      let h = null;
      try {
        h = await measure(page, id);
      } catch (err) {
        console.warn(`  ${id} (${vp.key}): ${err.message}`);
      }
      (heights[id] = heights[id] || {})[vp.key] = h;
    }
    await ctx.close();
  }
  await browser.close();

  const measured = Object.keys(heights)
    .sort()
    .filter((id) => heights[id].sm && heights[id].lg);
  const skipped = ids.filter((id) => !measured.includes(id));
  if (skipped.length) console.warn('no measurement:', skipped.join(', '));

  const rows = measured
    .map((id) => `  '${id}': [${heights[id].sm}, ${heights[id].lg}],`)
    .join('\n');

  fs.writeFileSync(
    OUT,
    `/**
 * Height in px of each tool's UI when it first renders, empty: [mobile, >=1024px].
 *
 * Tool implementations are code-split and only mount after hydration, so the
 * Suspense fallback decides how much room the rest of the page gets until then.
 * A single fixed skeleton height was 392px against real tools spanning 82px to
 * 1868px, and every mismatch pushed the content below the tool (donation box,
 * related tools, how-to-use) up or down — the 0.146 CLS Search Console flags.
 * Reserving each tool's own height makes the swap a no-op for layout.
 *
 * Regenerate after UI changes: npm run skeleton:measure (see scripts/measure-skeleton-heights.js).
 */
export const TOOL_SKELETON_HEIGHTS: Record<string, [number, number]> = {
${rows}
};

/** Fallback for tools with no measurement yet — the old fixed skeleton height. */
export const DEFAULT_SKELETON_HEIGHT: [number, number] = [392, 392];
`
  );
  console.log(`wrote ${measured.length} tools to ${path.relative(ROOT, OUT)}`);
})();
