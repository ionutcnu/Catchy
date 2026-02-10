/**
 * Global teardown - runs once after all tests complete
 * Cleanup tasks (if needed)
 */
async function globalTeardown() {
  console.log('\n[Global Teardown] Starting...');

  // Optional: Clean up any global resources
  // For now, we don't need any cleanup

  console.log('[Global Teardown] Complete');
}

export default globalTeardown;
