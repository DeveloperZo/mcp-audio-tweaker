// Jest configuration for comprehensive testing
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json'
  ],
  
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts'
  ],
  
  // Module path mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'node'
      }
    }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Verbose output for debugging
  verbose: true,
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  
  // Global test setup
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  
  // Performance monitoring
  slowTestThreshold: 5,
  
  // Error reporting
  errorOnDeprecated: true,
  
  // Test organization
  displayName: {
    name: 'MCP Audio Tweaker Tests',
    color: 'blue'
  },
  
  // Test reporting
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/html-report',
      filename: 'test-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'MCP Audio Tweaker Test Report'
    }]
  ],
  
  // Test categories
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
    },
    {
      displayName: 'Integration Tests', 
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      testTimeout: 45000
    },
    {
      displayName: 'Performance Tests',
      testMatch: ['<rootDir>/tests/integration/performance.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      testTimeout: 60000
    }
  ]
};
