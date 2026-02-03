/**
 * Fixtures index - exports all custom fixtures
 *
 * Import in test files:
 *   import { test, expect } from '../fixtures';
 */

export { test, expect } from './test-server';

// Re-export types for convenience
export type { Page, BrowserContext, Locator } from '@playwright/test';
