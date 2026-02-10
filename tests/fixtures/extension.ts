import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'node:path';

/**
 * Extension fixture - WORKING VERSION
 */

type ExtensionFixtures = {
  context: BrowserContext;
  extensionId: string;
};

export const test = base.extend<ExtensionFixtures>({
  context: async ({}, use) => {
    const distPath = path.resolve(process.cwd(), 'dist');

    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${distPath}`,
        `--load-extension=${distPath}`,
      ],
    });

    // Wait for extension to initialize
    await context.pages()[0].waitForTimeout(2000);

    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    // Wait for service worker to be available
    let workers = context.serviceWorkers();

    // If no workers yet, wait for the first one
    if (workers.length === 0) {
      await context.waitForEvent('serviceworker', { timeout: 10000 });
      workers = context.serviceWorkers();
    }

    if (workers.length > 0) {
      const url = workers[0].url();
      const match = url.match(/chrome-extension:\/\/([a-z]+)\//);
      if (match) {
        await use(match[1]);
        return;
      }
    }

    // If we still can't extract the ID, throw an error instead of using invalid fallback
    throw new Error('Failed to extract extension ID from service worker URL');
  },
});

export { expect } from '@playwright/test';
