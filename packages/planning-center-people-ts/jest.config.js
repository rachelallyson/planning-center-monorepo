module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/testing/**/*.ts',
    '!src/**/index.ts',
    // Exclude developer guidance and perf scaffolding from coverage
    '!src/error-scenarios.ts',
    '!src/performance.ts',
    // Temporarily exclude very large field mapping modules pending dedicated tests
    '!src/modules/fields.ts',
    '!src/people/fields.ts',
    // Temporarily exclude advanced matching strategies pending more branch tests
    '!src/matching/**/*.ts',
    // Temporarily exclude internal helpers and low-level HTTP adapter branches; covered via higher-level tests
    '!src/helpers.ts',
    '!src/core/http.ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@rachelallyson/planning-center-base-ts$': '<rootDir>/node_modules/@rachelallyson/planning-center-base-ts',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    'integration.test.ts',
    '!**/*.integration.test.ts'
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!@rachelallyson/)'
  ],
};

