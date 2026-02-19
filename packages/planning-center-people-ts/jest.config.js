/**
 * Unit tests only: ky/oauth2 mocked so no real API calls.
 * Tests that need the real API (integration/, modules/, matching scoring/multi-step) are excluded here.
 * Run them with: npm run test:integration
 * Goal: integration failures = fix application code, not mocks.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  // Thresholds set to current coverage; raise as unit tests are added for modules/client.
  coverageThreshold: {
    global: { statements: 20, branches: 1, functions: 3, lines: 23 },
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/testing/**/*.ts',
    '!src/**/index.ts',
    '!src/error-scenarios.ts',
    '!src/modules/fields.ts',
    '!src/people/fields.ts',
    '!src/matching/**/*.ts',
    '!src/helpers.ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@rachelallyson/planning-center-base-ts$': '<rootDir>/../planning-center-base-ts',
    '^ky$': '<rootDir>/../planning-center-base-ts/tests/__mocks__/ky.ts',
    '^@badgateway/oauth2-client$': '<rootDir>/../planning-center-base-ts/tests/__mocks__/oauth2-client.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/integration/',
    '/tests/modules/',
    '/matching/scoring.test.ts',
    '/matching/multi-step.test.ts',
  ],
  transformIgnorePatterns: ['/node_modules/(?!@rachelallyson/)'],
};
