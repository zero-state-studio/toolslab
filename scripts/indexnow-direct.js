#!/usr/bin/env node

/**
 * Direct IndexNow submission (bypasses internal admin API).
 * Calls api.indexnow.org directly using the public key file hosted on the domain.
 *
 * Usage:
 *   node scripts/indexnow-direct.js <url> [<url> ...]
 *   node scripts/indexnow-direct.js --tool rot13-caesar-cipher
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://toolslab.dev'
).replace(/\/$/, '');
const KEY = process.env.INDEXNOW_KEY || '3f6e2560c38248588ea3fc34a1a817a5';
const HOST = new URL(SITE_URL).hostname;
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/IndexNow';
const LOCALES = ['', '/it', '/es', '/fr', '/de', '/pt'];

function toolUrls(toolId) {
  return LOCALES.map((l) => `${SITE_URL}${l}/tools/${toolId}`);
}

async function submit(urls) {
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };

  console.log(`📤 Submitting ${urls.length} URL(s) to IndexNow`);
  urls.forEach((u) => console.log(`   • ${u}`));

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (res.ok || res.status === 202) {
    console.log(`✅ IndexNow accepted (HTTP ${res.status})`);
  } else {
    console.error(`❌ IndexNow rejected (HTTP ${res.status}): ${text}`);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node scripts/indexnow-direct.js <url> [<url> ...]');
    console.log('  node scripts/indexnow-direct.js --tool <tool-id>');
    process.exit(1);
  }

  let urls;
  const toolIdx = args.indexOf('--tool');
  if (toolIdx !== -1) {
    const toolId = args[toolIdx + 1];
    if (!toolId) {
      console.error('❌ --tool requires a tool-id');
      process.exit(1);
    }
    urls = toolUrls(toolId);
  } else {
    urls = args;
  }

  for (const u of urls) {
    try {
      const o = new URL(u);
      if (o.hostname !== HOST) {
        console.error(`❌ URL host mismatch (${o.hostname} != ${HOST}): ${u}`);
        process.exit(1);
      }
    } catch {
      console.error(`❌ Invalid URL: ${u}`);
      process.exit(1);
    }
  }

  await submit(urls);
}

main().catch((e) => {
  console.error('❌ Unexpected error:', e);
  process.exit(1);
});
