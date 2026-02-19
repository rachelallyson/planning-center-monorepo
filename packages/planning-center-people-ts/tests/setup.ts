// Test setup file
// This file runs before all tests

// Load environment variables from .env.test if it exists
import { config } from 'dotenv';
import { resolve } from 'path';

try {
  config({ path: resolve(__dirname, '../.env.test'), quiet: true });
} catch {
  // Ignore if .env.test doesn't exist or can't be loaded
}

// Store the original fetch before any mocking
const originalFetch = global.fetch;

function isJestMockedFetch(f: typeof global.fetch): f is typeof fetch & { mockClear?: () => void } {
  return typeof f === 'function' && f !== null && 'mockClear' in f;
}
function isJestMockWithMock(f: typeof global.fetch): f is typeof fetch & { mock?: object } {
  return typeof f === 'function' && f !== null && 'mock' in f;
}

// Check if credentials are available (tests with credentials need real API calls)
const hasCredentials = 
  !!process.env.PCO_ACCESS_TOKEN ||
  !!process.env.PCO_PERSONAL_ACCESS_TOKEN ||
  (!!process.env.PCO_APP_ID && !!process.env.PCO_APP_SECRET);

// Determine if this is an integration test by checking the test file path
// Integration tests are in the 'integration' directory or have 'integration' in their filename
let isIntegrationTest = false;
try {
  const testPath = expect.getState().testPath || '';
  isIntegrationTest = 
    testPath.includes('/integration/') ||
    testPath.includes('integration.test.ts') ||
    testPath.includes('integration.test.js');
} catch {
  // If we can't determine, assume it's not an integration test
  isIntegrationTest = false;
}

// Only mock fetch for unit tests (tests that don't need real API calls)
// If credentials are available OR it's an integration test, use real fetch
const shouldMockFetch = !hasCredentials && !isIntegrationTest;

if (shouldMockFetch) {
  // Mock fetch globally for unit tests only
  global.fetch = jest.fn();
  
  // Mock console methods to reduce noise in unit tests
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    if (isJestMockedFetch(global.fetch)) global.fetch.mockClear?.();
  });
  
  // Clean up after all tests
  afterAll(() => {
    jest.restoreAllMocks();
  });
} else {
  // For integration tests or tests with credentials, ensure real fetch is used
  if (isJestMockWithMock(global.fetch) && global.fetch.mock) {
    global.fetch = originalFetch;
  }
}
