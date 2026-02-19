// Test setup file
// This file runs before all tests

// Mock fetch globally for all tests
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

function hasMockClear(fn: typeof globalThis.fetch): fn is typeof globalThis.fetch & { mockClear: () => void } {
  if (typeof fn !== 'function' || fn === null) return false;
  const desc = Object.getOwnPropertyDescriptor(fn, 'mockClear');
  return typeof desc?.value === 'function';
}

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  if (hasMockClear(global.fetch)) global.fetch.mockClear();
});

// Clean up after all tests
afterAll(() => {
  jest.restoreAllMocks();
});
