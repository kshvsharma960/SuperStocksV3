/**
 * Jest Configuration for Comprehensive Error Testing
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Test file patterns
  testMatch: [
    '**/wwwroot/js/tests/**/*.test.js',
    '**/wwwroot/js/tests/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/wwwroot/js/tests/setup/test-setup.js'
  ],
  
  // Module paths
  moduleDirectories: [
    'node_modules',
    'wwwroot/js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'wwwroot/js/**/*.js',
    '!wwwroot/js/tests/**',
    '!wwwroot/js/vendor/**',
    '!wwwroot/js/lib/**'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './wwwroot/js/enhanced-error-handler.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './wwwroot/js/dashboard-data-manager.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/wwwroot/js/$1'
  },
  
  // Global setup and teardown
  globalSetup: '<rootDir>/wwwroot/js/tests/setup/global-setup.js',
  globalTeardown: '<rootDir>/wwwroot/js/tests/setup/global-teardown.js',
  
  // Test results processor
  testResultsProcessor: '<rootDir>/wwwroot/js/tests/setup/results-processor.js',
  
  // Reporters
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-reports',
      filename: 'error-testing-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'Error Handling Test Report'
    }],
    ['jest-junit', {
      outputDirectory: './test-reports',
      outputName: 'junit.xml',
      suiteName: 'Error Handling Tests'
    }]
  ],
  
  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Watch mode configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/test-reports/'
  ],
  
  // Snapshot configuration
  updateSnapshot: false,
  
  // Bail configuration
  bail: false,
  
  // Max workers for parallel execution
  maxWorkers: '50%',
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache'
};