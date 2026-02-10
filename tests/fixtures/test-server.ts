import { test as base } from './extension';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Test server fixture - serves test HTML pages
 *
 * Usage:
 *   test('my test', async ({ page, testServer }) => {
 *     await page.goto(`${testServer.url}/minimal.html`);
 *   });
 */

type TestServerFixtures = {
  testServer: {
    url: string;
    server: http.Server;
  };
};

export const test = base.extend<TestServerFixtures>({
  testServer: async ({}, use) => {
    const testPagesDir = path.resolve(process.cwd(), 'test-pages');

    // Create simple HTTP server
    const server = http.createServer((req, res) => {
      // Security: Only serve files from test-pages directory
      if (!req.url) {
        res.writeHead(400);
        res.end('Bad Request');
        return;
      }

      // Remove query params and resolve file path
      const urlPath = req.url.split('?')[0];
      const filePath = path.join(testPagesDir, urlPath === '/' ? 'index.html' : urlPath);

      // Prevent directory traversal
      const normalizedPath = path.normalize(filePath);
      if (!normalizedPath.startsWith(testPagesDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      // Read and serve file
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }

        // Set MIME type based on file extension
        const ext = path.extname(filePath);
        const mimeTypes: Record<string, string> = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*', // Allow extension to access
        });
        res.end(data);
      });
    });

    // Start server on random available port
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        resolve();
      });
    });

    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to get server address');
    }

    const port = address.port;
    const url = `http://localhost:${port}`;

    console.log(`[Test Server] Started on ${url}`);

    // Provide server info to test
    await use({ url, server });

    // Cleanup
    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log('[Test Server] Stopped');
        resolve();
      });
      // Force resolve after 1 second to prevent hanging
      setTimeout(resolve, 1000);
    });
  },
});

export { expect } from '@playwright/test';
