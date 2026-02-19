// Integration test setup file
// This file runs before integration tests.

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.test so PCO_PERSONAL_ACCESS_TOKEN etc. are available for createTestClient()
try {
  config({ path: resolve(__dirname, '../.env.test'), quiet: true });
} catch {
  // ignore
}

// Integration tests use the real ky and hit the live PCO API when credentials are set.

afterAll(() => {
  // Any necessary cleanup
});

