/**
 * Diagnostic: detect which version of BarcodeGenerator is running.
 */
const { chromium } = require('playwright');
const BASE = 'http://localhost:3000/tools/barcode-generator';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGE ERROR: ' + e.message));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Detect new vs old UI
  const hasQuickPresets = await page.getByText('Quick Presets').isVisible().catch(() => false);
  const hasGenerateButton = await page.getByRole('button', { name: /generate/i }).isVisible().catch(() => false);
  const hasTwoColumnGrid = await page.locator('.lg\\:grid-cols-2').count();
  const hasAutoUpdate = !hasGenerateButton; // new code has no Generate button
  const inputVisible = await page.locator('input[id="value"]').isVisible().catch(() => false);
  const selectTriggers = await page.locator('button[role="combobox"]').count();
  const anyButtons = await page.locator('button').count();

  console.log('=== DIAGNOSTIC ===');
  console.log('Has Quick Presets (new UI):', hasQuickPresets);
  console.log('Has Generate Button (old UI):', hasGenerateButton);
  console.log('Has 2-column grid (new layout):', hasTwoColumnGrid > 0);
  console.log('Has auto-update (no Generate btn):', hasAutoUpdate);
  console.log('Input visible:', inputVisible);
  console.log('Combobox triggers:', selectTriggers);
  console.log('Total buttons:', anyButtons);

  // List all button texts
  const btnTexts = await page.locator('button').allTextContents();
  console.log('Button texts:', btnTexts);

  // Try filling input and waiting
  const input = page.locator('input[id="value"]');
  await input.fill('TEST123');
  await page.waitForTimeout(3000); // wait 3s for any debounce + render

  const imgCount = await page.locator('img').count();
  const imgVisible = await page.locator('img').first().isVisible().catch(() => false);
  const anyError = await page.locator('[role="alert"]').count();
  const validErr = await page.locator('.text-destructive').first().textContent().catch(() => '');

  console.log('\n=== AFTER FILL "TEST123" (3s wait) ===');
  console.log('img count:', imgCount);
  console.log('img[0] visible:', imgVisible);
  console.log('alert count:', anyError);
  console.log('validErr:', validErr);

  // Check canvas (bwip-js uses canvas)
  const canvasCount = await page.locator('canvas').count();
  console.log('canvas count:', canvasCount);

  // Try bwip-js directly via page.evaluate
  const bwipTest = await page.evaluate(() => {
    try {
      const canvas = document.createElement('canvas');
      // Check if bwipjs is available globally
      if (typeof window !== 'undefined' && window.bwipjs) {
        return 'bwipjs global available';
      }
      return 'bwipjs not in global scope (expected for module)';
    } catch (e) {
      return 'error: ' + e.message;
    }
  });
  console.log('bwip-js global test:', bwipTest);

  await page.screenshot({ path: '/tmp/bc-diag.png' });

  if (errors.length) {
    console.log('\nConsole errors:');
    errors.forEach(e => console.log(' -', e));
  }

  await browser.close();
}

run().catch(console.error);
