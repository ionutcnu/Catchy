import { test as base, expect, chromium } from '@playwright/test';
import path from 'node:path';

/**
 * Basic smoke test - NO FIXTURES, direct like simple-test.js
 */

const test = base.extend({
  context: async ({}, use) => {
    const distPath = path.resolve(process.cwd(), 'dist');
    console.log('Loading extension from:', distPath);

    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${distPath}`,
        `--load-extension=${distPath}`,
      ],
    });

    await context.pages()[0].waitForTimeout(2000);
    await use(context);
    await context.close();
  },
});

test.describe('Basic Extension Test', () => {
  test('should load extension', async ({ context }) => {
    console.log('Service workers:', context.serviceWorkers().length);

    const page = await context.newPage();
    await page.goto('https://example.com');

    console.log('📄 Page loaded');

    await page.waitForTimeout(3000);

    const injected = await page.evaluate(() => {
      return !!document.querySelector('#catchy-toast-host');
    });

    console.log('🎯 Extension injected:', injected);
    expect(injected).toBe(true);
  });
});
