/**
 * Barcode Generator - Playwright verification test
 * Tests: code128 generation, ISSN + ISBN validation
 * Uses keyboard navigation to avoid Radix portal issues.
 */
const { chromium } = require('playwright');

const BASE = 'http://localhost:3000/tools/barcode-generator';
const WAIT_DEBOUNCE = 2500; // 600ms debounce + 1900ms render margin

async function run() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push('PAGE ERROR: ' + err.message));

  console.log('Navigating to barcode generator...');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const input = page.locator('input[id="value"]');

  // ── TEST 1: code128 ──────────────────────────────────────────────
  console.log('\n── TEST 1: code128 ──');
  await input.fill('Hello World 123');
  await page.waitForTimeout(WAIT_DEBOUNCE);
  const img1 = await page.locator('img').isVisible().catch(() => false);
  const err1 = await page.locator('[role="alert"]').textContent().catch(() => '');
  const verr1 = await page.locator('.text-destructive').first().textContent().catch(() => '');
  console.log(`code128 [Hello World 123]: img=${img1} alert="${err1?.trim()}" validErr="${verr1?.trim()}"`);
  await page.screenshot({ path: '/tmp/bc-01-code128.png' });

  // ── Change format to ISSN via keyboard ──────────────────────────
  // Click the Select trigger (first button matching format name)
  const selectTrigger = page.locator('[data-radix-select-trigger]').first();
  const hasTrigger = await selectTrigger.count();

  // Fallback: find any combobox
  const combobox = hasTrigger > 0
    ? selectTrigger
    : page.locator('[role="combobox"]').first();

  console.log('\nOpening format Select...');
  await combobox.click();
  await page.waitForTimeout(600);

  // Options render in a Radix portal — query from full document
  const optCount = await page.locator('[role="option"]').count();
  console.log(`Options visible: ${optCount}`);

  if (optCount > 0) {
    const optTexts = await page.locator('[role="option"]').allTextContents();
    console.log('Options:', optTexts.slice(0, 6), '...');

    // ── TEST 2: ISSN ────────────────────────────────────────────────
    console.log('\n── TEST 2: ISSN ──');
    const issnOpt = page.locator('[role="option"]').filter({ hasText: /^ISSN$/i });
    const issnCount = await issnOpt.count();
    if (issnCount > 0) {
      await issnOpt.first().click();
      await page.waitForTimeout(400);

      // Test WITHOUT dash → should fail
      await input.clear();
      await input.fill('07490158');
      await page.waitForTimeout(WAIT_DEBOUNCE);
      const errNoDash = await page.locator('.text-destructive').first().textContent().catch(() => '');
      const imgNoDash = await page.locator('img').isVisible().catch(() => false);
      console.log(`ISSN [07490158 no-dash]: img=${imgNoDash} error="${errNoDash?.trim()}"`);
      await page.screenshot({ path: '/tmp/bc-02-issn-nodash.png' });

      // Test WITH dash → should succeed
      await input.clear();
      await input.fill('0749-0158');
      await page.waitForTimeout(WAIT_DEBOUNCE);
      const imgWithDash = await page.locator('img').isVisible().catch(() => false);
      const errWithDash = await page.locator('.text-destructive').first().textContent().catch(() => '');
      const alertWithDash = await page.locator('[role="alert"]').textContent().catch(() => '');
      console.log(`ISSN [0749-0158 with-dash]: img=${imgWithDash} error="${errWithDash?.trim()}" alert="${alertWithDash?.trim()}"`);
      await page.screenshot({ path: '/tmp/bc-03-issn-withdash.png' });
    } else {
      console.log('ISSN option not found in dropdown');
    }

    // Re-open Select for ISBN
    await combobox.click();
    await page.waitForTimeout(600);

    // ── TEST 3: ISBN ────────────────────────────────────────────────
    console.log('\n── TEST 3: ISBN ──');
    const isbnOpt = page.locator('[role="option"]').filter({ hasText: /^ISBN$/i });
    const isbnCount = await isbnOpt.count();
    if (isbnCount > 0) {
      await isbnOpt.first().click();
      await page.waitForTimeout(400);

      // Test WITHOUT dashes → should fail
      await input.clear();
      await input.fill('9780306406157');
      await page.waitForTimeout(WAIT_DEBOUNCE);
      const errNoDash = await page.locator('.text-destructive').first().textContent().catch(() => '');
      const imgNoDash = await page.locator('img').isVisible().catch(() => false);
      console.log(`ISBN [9780306406157 no-dash]: img=${imgNoDash} error="${errNoDash?.trim()}"`);
      await page.screenshot({ path: '/tmp/bc-04-isbn-nodash.png' });

      // Test WITH dashes → should succeed
      await input.clear();
      await input.fill('978-0-306-40615-7');
      await page.waitForTimeout(WAIT_DEBOUNCE);
      const imgWithDash = await page.locator('img').isVisible().catch(() => false);
      const errWithDash = await page.locator('.text-destructive').first().textContent().catch(() => '');
      const alertWithDash = await page.locator('[role="alert"]').textContent().catch(() => '');
      console.log(`ISBN [978-0-306-40615-7 with-dash]: img=${imgWithDash} error="${errWithDash?.trim()}" alert="${alertWithDash?.trim()}"`);
      await page.screenshot({ path: '/tmp/bc-05-isbn-withdash.png' });
    } else {
      console.log('ISBN option not found in dropdown');
    }

  } else {
    console.log('⚠ No options found — Radix portal issue persists. Trying keyboard navigation...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Try keyboard: Tab to Select, use arrow keys
    await combobox.focus();
    await page.keyboard.press('Space'); // open select
    await page.waitForTimeout(400);
    const optCount2 = await page.locator('[role="option"]').count();
    console.log(`After Space key — options: ${optCount2}`);

    // Try typing to search
    await page.keyboard.type('ISSN');
    await page.waitForTimeout(300);
    const optCount3 = await page.locator('[role="option"]').count();
    console.log(`After typing ISSN — options: ${optCount3}`);
    await page.keyboard.press('Escape');

    // Inject JS to verify validation directly
    console.log('\nFalling back to JS injection to test validation...');
    const validationResult = await page.evaluate(() => {
      // The validation module should be accessible via global scope or we test via DOM
      // Trigger a React state change by simulating input events
      return {
        url: window.location.href,
        title: document.title,
      };
    });
    console.log('Page info:', validationResult);
    await page.screenshot({ path: '/tmp/bc-fallback.png' });
  }

  // ── Final: print all console errors ──────────────────────────────
  if (consoleErrors.length > 0) {
    console.log('\n⚠ Console errors captured:');
    consoleErrors.forEach((e) => console.log(' -', e));
  } else {
    console.log('\n✓ No console errors');
  }

  await browser.close();
  console.log('\nScreenshots saved to /tmp/bc-*.png');
}

run().catch(console.error);
