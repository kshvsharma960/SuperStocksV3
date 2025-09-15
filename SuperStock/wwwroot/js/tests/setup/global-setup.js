/**
 * Global Test Setup
 * Runs once before all tests
 */

module.exports = async () => {
  console.log('🚀 Setting up comprehensive error testing environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TEST_TIMEOUT = '30000';
  
  // Setup global test configuration
  global.__TEST_CONFIG__ = {
    apiBaseUrl: 'http://localhost:3000/api',
    testDataPath: './wwwroot/js/tests/data',
    mockDataEnabled: true,
    verboseLogging: false,
    coverageThreshold: 80
  };
  
  // Initialize test database or mock services if needed
  console.log('✅ Global test setup completed');
};