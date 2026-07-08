const { chromium } = require('playwright');

const BASE = 'http://localhost:3000/tools/barcode-generator';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Test code128 (default format, no change needed)
  const input = page.locator('input[id="value"]');
  await input.fill('Hello World 123');
  await page.waitForTimeout(1500);
  const img128 = await page.locator('img').isVisible().catch(() => false);
  console.log('code128 [Hello World 123]: img=' + img128);

  // Open the select to change format
  const trigger = page.locator('button').filter({ hasText: /^[a-z0-9]+$/i }).first();
  await trigger.click();
  await page.waitForTimeout(500);

  const optCount = await page.locator('[role="option"]').count();
  console.log('Options in dropdown:', optCount);

  if (optCount > 0) {
    const opts = await page.locator('[role="option"]').allTextContents();
    console.log('Options:', opts);

    // Test ISSN
    const issnOpt = page.locator('[role="option"]').filter({ hasText: 'ISSN' });
    if (await issnOpt.count() > 0) {
      await issnOpt.click();
      await page.waitForTimeout(400);

      // Test WITHOUT dash (old format) — should fail
      await input.fill('07490158');
      await page.waitForTimeout(1500);
      const errNoDash = await page.locator('.text-destructive').first().textContent().catch(() => '');
      console.log('ISSN [07490158 no-dash] error:', errNoDash?.trim());

      // Test WITH dash (correct format) — should succeed
      await input.fill('0749-0158');
      await page.waitForTimeout(1500);
      const imgIssn = await page.locator('img').isVisible().catch(() => false);
      const errIssn = await page.locator('[role="alert"]').textContent().catch(() => '');
      const verrIssn = await page.locator('.text-destructive').first().textContent().catch(() => '');
      console.log('ISSN [0749-0158 with-dash]: img=' + imgIssn + ' alert=' + errIssn?.trim() + ' valErr=' + verrIssn?.trim());
      await page.screenshot({ path: '/tmp/barcode-issn-ok.png' });
    }

    // Re-open and test ISBN
    await trigger.click();
    await page.waitForTimeout(400);
    const isbnOpt = page.locator('[role="option"]').filter({ hasText: 'ISBN' });
    if (await isbnOpt.count() > 0) {
      await isbnOpt.click();
      await page.waitForTimeout(400);
      await input.fill('978-0-306-40615-7');
      await page.waitForTimeout(1500);
      const imgIsbn = await page.locator('img').isVisible().catch(() => false);
      const errIsbn = await page.locator('[role="alert"]').textContent().catch(() => '');
      const verrIsbn = await page.locator('.text-destructive').first().textContent().catch(() => '');
      console.log('ISBN [978-0-306-40615-7]: img=' + imgIsbn + ' alert=' + errIsbn?.trim() + ' valErr=' + verrIsbn?.trim());
      await page.screenshot({ path: '/tmp/barcode-isbn-ok.png' });
    }
  } else {
    // Detect if old or new code by checking error message behavior
    // Stay on code128, test that basic generation works
    await page.keyboard.press('Escape');
    console.log('WARNING: Could not open dropdown - Radix portal issue');

    // Check the server version via network request
    const response = await page.evaluate(async () => {
      const r = await fetch('/api/health').catch(() => null);
      return r ? r.status : 'no health endpoint';
    });
    console.log('Server health:', response);
  }

  // Check if old error message text still exists in bundle
  const pageContent = await page.content();
  const hasOldMsg = pageContent.includes('only accepts numeric characters');
  const hasNewMsg = pageContent.includes('must be in the format');
  console.log('\nCode version detection:');
  console.log('Has OLD error msg in HTML:', hasOldMsg);
  console.log('Has NEW error msg in HTML:', hasNewMsg);

  await browser.close();
}

main().catch(console.error);
