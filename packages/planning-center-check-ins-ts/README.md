# @rachelallyson/planning-center-check-ins-ts

A strictly typed TypeScript client for Planning Center Online Check-Ins API with batch operations and enhanced developer experience.

## Installation

```bash
npm install @rachelallyson/planning-center-check-ins-ts
```

## Quick Start

```typescript
import { PcoCheckInsClient } from '@rachelallyson/planning-center-check-ins-ts';

const client = new PcoCheckInsClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token-here'
  }
});

// Get all events
const events = await client.events.getAll();

// Get check-ins for an event
const checkIns = await client.checkIns.getAll({
  filter: ['attendee', 'not_checked_out']
});

// Get a specific check-in
const checkIn = await client.checkIns.getById('123', ['person', 'event']);
```

## Features

- **Type-safe**: Full TypeScript support with complete type definitions for all 24 Check-Ins API resource types
- **Modular architecture**: 19 specialized modules organized by resource domain
- **Batch operations**: Execute multiple operations with dependency resolution
- **Event system**: Monitor requests, errors, and rate limits
- **Rate limiting**: Automatic rate limit handling (100 requests per 20 seconds)
- **Error handling**: Comprehensive error handling with typed errors
- **Pagination**: Built-in pagination helpers
- **JSON:API compliant**: Full support for JSON:API 1.0 specification

## Modules

The client exposes 19 specialized modules:

- **events** - Event management (recurring events)
- **checkIns** - Check-in records (attendance)
- **locations** - Location management
- **eventPeriods** - Event period management
- **eventTimes** - Specific check-in times
- **stations** - Check-in stations
- **labels** - Labels for check-ins, events, and locations
- **options** - Check-in options
- **checkInGroups** - Group check-ins
- **checkInTimes** - When check-ins occurred
- **personEvents** - Person-event relationships
- **preChecks** - Pre-check records
- **passes** - Pass management
- **headcounts** - Headcount tracking
- **attendanceTypes** - Attendance type definitions
- **rosterListPersons** - Roster list persons
- **organization** - Organization info
- **integrationLinks** - Integration links
- **themes** - Themes for check-ins

## Documentation

For complete documentation, see the [monorepo documentation site](../../docs/content/index.mdx).

## Testing

### Unit Tests (Mocked Data)

Run unit tests with mocked HTTP responses:
```bash
npm test
```

### Integration Tests (Real API Data)

Integration tests make real HTTP requests to Planning Center servers:

```bash
# First, create .env.test with your credentials
# See tests/integration/README.md for setup instructions

npm run test:integration
```

Integration tests verify:
- Real API responses and data structures
- End-to-end functionality with actual Planning Center data
- Error handling with real API errors
- JSON:API compliance with real responses

## License

MIT
