import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Global setup - runs once before all tests
 * Ensures extension is built before test execution
 */
async function globalSetup() {
  console.log('[Global Setup] Starting...');

  const distPath = path.resolve(process.cwd(), 'dist');
  const manifestPath = path.join(distPath, 'manifest.json');

  // Check if extension is already built
  if (fs.existsSync(manifestPath)) {
    console.log('[Global Setup] ✓ Extension already built (dist/manifest.json exists)');
    return;
  }

  console.log('[Global Setup] Building extension...');

  try {
    // Build extension (Windows-compatible command)
    execSync('bun run build', {
      stdio: 'inherit',
      shell: 'powershell.exe',
      cwd: process.cwd(),
    });

    console.log('[Global Setup] ✓ Extension built successfully');
  } catch (error) {
    console.error('[Global Setup] ✗ Failed to build extension:', error);
    throw new Error('Extension build failed. Run "bun run build" manually to debug.');
  }

  // Validate build output
  const requiredFiles = [
    'manifest.json',
    'background/index.js',
    'content/index.js',
    'content/inject.js',
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(distPath, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing required file after build: ${file}`);
    }
  }

  console.log('[Global Setup] ✓ All required files present');
  console.log('[Global Setup] Complete\n');
}

export default globalSetup;
