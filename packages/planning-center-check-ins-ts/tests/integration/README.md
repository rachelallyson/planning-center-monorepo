# Integration Tests

Integration tests make real HTTP requests to the Planning Center Check-Ins API.

## Setup

1. Create a `.env.test` file in the package root directory
2. Add one of the following authentication methods:

### Option 1: Personal Access Token (Recommended)
```env
PCO_PERSONAL_ACCESS_TOKEN=your_token_here
```

Get a token from: https://api.planningcenteronline.com/oauth/applications

### Option 2: OAuth Access Token
```env
PCO_ACCESS_TOKEN=your_oauth_token_here
```

### Option 3: Basic Auth
```env
PCO_APP_ID=your_app_id
PCO_APP_SECRET=your_app_secret
```

## Running Integration Tests

```bash
npm run test:integration
```

This will:
- Load credentials from `.env.test`
- Make real HTTP requests to Planning Center servers
- Test actual API responses and data structures
- Validate that the client works with real data

## Test Coverage

Integration tests verify:
- ✅ Events Module - Getting events, event periods, check-ins
- ✅ CheckIns Module - Getting check-ins with filters
- ✅ Locations Module - Getting locations
- ✅ Organization Module - Getting organization info
- ✅ Real JSON:API response structures
- ✅ Error handling with real API errors

## Notes

- Integration tests are slower than unit tests (they make real HTTP requests)
- They require valid Planning Center credentials
- They will use your API rate limits (tests are designed to be conservative)
- These tests are excluded from regular `npm test` runs


