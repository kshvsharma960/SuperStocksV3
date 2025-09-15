/**
 * Global Test Teardown
 * Runs once after all tests
 */

module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Cleanup global resources
  if (global.__TEST_CONFIG__) {
    delete global.__TEST_CONFIG__;
  }
  
  // Cleanup any test files or temporary resources
  console.log('✅ Global test teardown completed');
};