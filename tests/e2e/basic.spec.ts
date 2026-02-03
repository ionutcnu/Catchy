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

    // Wait for extension to be ready before using context
    await context.pages()[0].waitForLoadState('domcontentloaded');
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

    // Wait for extension to inject shadow host
    await page.waitForSelector('#catchy-toast-host', { timeout: 5000 });

    const injected = await page.evaluate(() => {
      return !!document.querySelector('#catchy-toast-host');
    });

    console.log('🎯 Extension injected:', injected);
    expect(injected).toBe(true);
  });
});
