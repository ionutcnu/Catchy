#!/usr/bin/env node
/**
 * Parse Playwright JSON results and generate GitHub Actions summary
 * Outputs markdown table with test statistics
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const RESULTS_PATH = join(process.cwd(), 'test-results', 'results.json');

/**
 * Recursively collect all tests from Playwright suite tree
 *
 * Playwright can nest test.describe() blocks arbitrarily deep.
 * This function traverses the entire suite hierarchy to ensure
 * all tests are counted, not just top-level suites.
 *
 * @param {Array} suites - Array of suite objects from Playwright results
 * @returns {Array<{spec: Object, test: Object}>} All test objects with their specs
 */
function collectTests(suites) {
  const tests = [];
  for (const suite of suites) {
    // Collect specs from current suite
    if (suite.specs) {
      for (const spec of suite.specs) {
        if (spec.tests) {
          tests.push(...spec.tests.map(test => ({ spec, test })));
        }
      }
    }
    // Recursively process nested suites
    if (suite.suites && suite.suites.length > 0) {
      tests.push(...collectTests(suite.suites));
    }
  }
  return tests;
}

try {
  if (!existsSync(RESULTS_PATH)) {
    console.log('## ⚠️ Test Results Not Found\n');
    console.log('No test results file found. Tests may have failed to run.\n');
    process.exit(1);
  }

  const results = JSON.parse(readFileSync(RESULTS_PATH, 'utf-8'));

  // Calculate statistics from all tests (including nested suites)
  const allTests = collectTests(results.suites);
  const stats = allTests.reduce((acc, { test }) => {
    // Use final outcome from retries, not first attempt
    const status = test.outcome || test.results[test.results.length - 1]?.status || 'unknown';
    if (status === 'passed' || status === 'expected') acc.passed++;
    else if (status === 'failed' || status === 'unexpected' || status === 'flaky' || status === 'interrupted') acc.failed++;
    else if (status === 'skipped') acc.skipped++;
    else if (status === 'timedOut') acc.timedOut++;
    return acc;
  }, { passed: 0, failed: 0, skipped: 0, timedOut: 0 });

  const total = stats.passed + stats.failed + stats.skipped + stats.timedOut;
  const duration = ((results?.stats?.duration ?? 0) / 1000).toFixed(1);
  const passRate = total > 0 ? ((stats.passed / total) * 100).toFixed(1) : '0.0';

  // Determine overall status
  const overallStatus = stats.failed > 0 || stats.timedOut > 0 ? '❌' : '✅';
  const statusText = stats.failed > 0 || stats.timedOut > 0 ? 'Failed' : 'Passed';

  // Generate markdown summary
  console.log(`## 🎭 Playwright Test Results: ${overallStatus} ${statusText}\n`);
  console.log('| Metric | Count |');
  console.log('|--------|-------|');
  console.log(`| ✅ Passed | ${stats.passed} |`);
  console.log(`| ❌ Failed | ${stats.failed} |`);
  console.log(`| ⏭️ Skipped | ${stats.skipped} |`);
  if (stats.timedOut > 0) {
    console.log(`| ⏱️ Timed Out | ${stats.timedOut} |`);
  }
  console.log(`| 📊 Total | ${total} |`);
  console.log(`| 🎯 Pass Rate | ${passRate}% |`);
  console.log(`| ⏱️ Duration | ${duration}s |\n`);

  // Add failed test details if any (check final outcome after retries)
  if (stats.failed > 0 || stats.timedOut > 0) {
    console.log('### ❌ Failed Tests\n');
    allTests.forEach(({ spec, test }) => {
      const finalResult = test.results[test.results.length - 1];
      const finalOutcome = test.outcome || finalResult?.status;

      if (finalOutcome === 'failed' || finalOutcome === 'unexpected' ||
          finalOutcome === 'timedOut' || finalOutcome === 'flaky' || finalOutcome === 'interrupted') {
        const title = spec.title;
        const file = spec.file.replace(process.cwd(), '').replace(/^[/\\]/, '').replace(/\\/g, '/');
        const error = finalResult?.error?.message || 'Unknown error';
        console.log(`**${title}**`);
        console.log(`- File: \`${file}\``);
        console.log(`- Error: ${error.split('\n')[0]}`);
        console.log('');
      }
    });
  }

  console.log('---\n');
  console.log('📊 **View detailed HTML report** in the artifacts section below\n');
  console.log('📸 **Screenshots and traces** are available for failed tests\n');

  // Exit with error code if tests failed
  process.exit(stats.failed > 0 || stats.timedOut > 0 ? 1 : 0);

} catch (error) {
  console.log('## ⚠️ Error Generating Test Summary\n');
  console.log(`\`\`\`\n${error.message}\n\`\`\`\n`);
  process.exit(1);
}
