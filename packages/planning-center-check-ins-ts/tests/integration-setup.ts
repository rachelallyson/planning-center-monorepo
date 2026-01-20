// Integration test setup file
// This file runs before integration tests
// Unlike the regular setup.ts, this does NOT mock fetch since we need real HTTP requests

// No mocking/polyfills needed - base package automatically falls back to HTTPS
// when fetch is broken (like in Jest environments)

// Clean up after all tests
afterAll(() => {
  // Any necessary cleanup
});



