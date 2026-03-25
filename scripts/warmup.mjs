#!/usr/bin/env node
/**
 * Post-deploy cache warmup script
 *
 * Reads the sitemap from the live site and fetches every URL so that
 * Vercel's Edge Network caches all pages before the first real user arrives.
 *
 * Usage:
 *   node scripts/warmup.mjs                         # production
 *   SITE_URL=https://preview.toolslab.dev node scripts/warmup.mjs
 *   CONCURRENCY=20 node scripts/warmup.mjs          # faster (use carefully)
 */

const SITE_URL = (process.env.SITE_URL ?? 'https://toolslab.dev').replace(/\/$/, '');
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? '10', 10);
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS ?? '20000', 10);
const USER_AGENT = 'ToolsLab-Warmup/1.0 (+https://toolslab.dev)';

// ── Sitemap fetching ────────────────────────────────────────────────────────

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function extractTags(xml, tag) {
  const re = new RegExp(`<${tag}>([^<]+)<\\/${tag}>`, 'g');
  return [...xml.matchAll(re)].map((m) => m[1].trim());
}

async function collectUrls() {
  const xml = await fetchText(`${SITE_URL}/sitemap.xml`);

  // Sitemap index → recurse into child sitemaps
  if (xml.includes('<sitemapindex')) {
    const childSitemaps = extractTags(xml, 'loc');
    console.log(`📋 Sitemap index: found ${childSitemaps.length} child sitemaps`);
    const nested = await Promise.all(childSitemaps.map((u) => fetchText(u).then((x) => extractTags(x, 'loc'))));
    return nested.flat();
  }

  return extractTags(xml, 'loc');
}

// ── URL warming ─────────────────────────────────────────────────────────────

async function warmUrl(url) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const ms = Date.now() - start;

    // Vercel sets x-vercel-cache: HIT | MISS | STALE | BYPASS
    const cacheStatus =
      res.headers.get('x-vercel-cache') ??
      res.headers.get('cf-cache-status') ??
      res.headers.get('x-cache') ??
      '—';

    const statusIcon = res.ok ? '✓' : '✗';
    const cacheIcon = cacheStatus === 'HIT' ? '🟢' : cacheStatus === 'MISS' ? '🔴' : '🟡';
    console.log(`  ${statusIcon} [${res.status}] ${ms.toString().padStart(5)}ms ${cacheIcon} ${cacheStatus.padEnd(5)} ${url}`);

    return { url, ok: res.ok, status: res.status, ms, cacheStatus };
  } catch (err) {
    console.error(`  ✗ [ERR] ${url}: ${err.message}`);
    return { url, ok: false, status: 0, ms: Date.now() - start, error: err.message };
  }
}

// ── Concurrency pool ────────────────────────────────────────────────────────

async function runPool(urls, concurrency) {
  const results = [];
  const queue = [...urls];

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      if (url) results.push(await warmUrl(url));
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
  return results;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔥 ToolsLab Cache Warmup');
  console.log(`📡 Site       : ${SITE_URL}`);
  console.log(`⚡ Concurrency: ${CONCURRENCY}`);
  console.log(`⏱  Timeout    : ${TIMEOUT_MS}ms\n`);

  let urls;
  try {
    urls = await collectUrls();
  } catch (err) {
    console.error(`❌ Failed to fetch sitemap: ${err.message}`);
    process.exit(1);
  }

  // Deduplicate and sort (homepage first, then tool pages, then rest)
  urls = [...new Set(urls)].sort((a, b) => {
    const score = (u) =>
      u === SITE_URL || u === `${SITE_URL}/` ? 0 : u.includes('/tools/') ? 1 : 2;
    return score(a) - score(b);
  });

  console.log(`🌐 ${urls.length} URLs to warm\n`);

  const wallStart = Date.now();
  const results = await runPool(urls, CONCURRENCY);
  const elapsed = ((Date.now() - wallStart) / 1000).toFixed(1);

  // Summary
  const ok = results.filter((r) => r.ok).length;
  const errors = results.filter((r) => !r.ok).length;
  const hits = results.filter((r) => r.cacheStatus === 'HIT').length;
  const misses = results.filter((r) => r.cacheStatus === 'MISS').length;
  const avgMs = Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length);

  console.log(`\n─────────────────────────────────────`);
  console.log(`✅ Done in ${elapsed}s`);
  console.log(`   Requests : ${ok} ok / ${errors} errors`);
  console.log(`   Cache    : ${hits} HIT / ${misses} MISS`);
  console.log(`   Avg TTFB : ${avgMs}ms`);
  console.log(`─────────────────────────────────────\n`);

  if (errors > 0) {
    console.error(`⚠️  ${errors} URL(s) failed — check output above`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
