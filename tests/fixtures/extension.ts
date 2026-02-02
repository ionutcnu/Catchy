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
    const workers = context.serviceWorkers();

    if (workers.length > 0) {
      const url = workers[0].url();
      const match = url.match(/chrome-extension:\/\/([a-z]+)\//);
      if (match) {
        await use(match[1]);
        return;
      }
    }

    await use('extension-loaded');
  },
});

export { expect } from '@playwright/test';
