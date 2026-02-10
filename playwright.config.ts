import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

/**
 * Playwright configuration for Catchy Chrome Extension testing
 * Enterprise-grade setup with comprehensive reporting and retry logic
 */
export default defineConfig({
  testDir: './tests',

  // Global setup/teardown
  globalSetup: path.resolve('./tests/setup/global-setup.ts'),
  globalTeardown: path.resolve('./tests/setup/global-teardown.ts'),

  // Timeout configuration
  timeout: 30_000, // 30s per test
  expect: {
    timeout: 5_000, // 5s for assertions
  },

  // Test execution
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // Fail CI if test.only is committed
  retries: process.env.CI ? 2 : 0, // Retry on CI for flaky tests
  workers: 2, // Limit to 2 workers to reduce CPU load

  // Reporting
  reporter: [
    ['list'], // Console output
    ['html', { open: 'never' }], // HTML report for artifact upload
    ['json', { outputFile: 'test-results/results.json' }], // For CI summary parsing
    ...(process.env.CI ? [['github', {}] as const] : []), // GitHub Actions annotations
  ],

  // Output files
  outputDir: 'test-results/',

  use: {
    // Minimal config - let fixtures handle browser launch
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium-extension',
      use: {
        // No device presets - use minimal config for extensions
      },
    },
  ],

  // Web server for test pages (optional, can use fixture instead)
  // webServer: {
  //   command: 'bun run test:server',
  //   port: 3000,
  //   timeout: 120_000,
  //   reuseExistingServer: !process.env.CI,
  // },
});
