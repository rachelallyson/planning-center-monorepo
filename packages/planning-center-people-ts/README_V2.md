# Planning Center People TypeScript Client v2.0.0

A complete redesign of the Planning Center Online People API client with enhanced features, better developer experience, and comprehensive functionality.

## 🚀 What's New in v2.0.0

### ✨ **Complete API Redesign**

- **Class-based fluent API** instead of functional exports
- **Module-based architecture** with namespaced operations
- **Type-safe operations** throughout the entire API

### 🔧 **Core Features**

#### **1. Built-in Pagination Helper**

```typescript
// Get all people across all pages automatically
const result = await client.people.getAll({ include: ['emails', 'phone_numbers'] });
console.log(`Fetched ${result.data.length} people (${result.pagesFetched} pages)`);

// Single page
const page = await client.people.getPage({ per_page: 50, page: 1 });
```

#### **2. Smart Person Matching**

```typescript
// Find existing person or create new one with fuzzy matching
const person = await client.people.findOrCreate(
  {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@gmail.com
    matchStrategy: 'fuzzy'
  },
  {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@gmail.com
    status: 'active'
  }
);

// Age preference matching - prefer adults (18+)
const adultPerson = await client.people.findOrCreate({
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane@gmail.com
  agePreference: 'adults',
  agePreferenceLenient: true, // Include profiles without birthdates
  matchStrategy: 'fuzzy'
});

// Age preference matching - prefer children (under 18)
const childPerson = await client.people.findOrCreate({
  first_name: 'Bobby',
  last_name: 'Johnson',
  agePreference: 'children',
  matchStrategy: 'fuzzy'
});

// Match by age range
const youngAdult = await client.people.findOrCreate({
  first_name: 'Alice',
  last_name: 'Brown',
  minAge: 20,
  maxAge: 30,
  matchStrategy: 'fuzzy'
});

// Match by birth year
const millennial = await client.people.findOrCreate({
  first_name: 'David',
  last_name: 'Wilson',
  birthYear: 1990,
  matchStrategy: 'fuzzy'
});

// Automatically add missing contact information when a match is found
const person = await client.people.findOrCreate({
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane@gmail.com
  phone: '+1987654321',
  addMissingContactInfo: true  // Adds phone if person only has email, or email if person only has phone
});

// Multi-step search strategy - tries multiple matching approaches
// This maximizes matching success by trying different strategies in order
const person = await client.people.findOrCreate({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@gmail.com
  searchStrategy: 'multi-step', // Tries: fuzzy+age, fuzzy, exact+age, exact
  agePreference: 'adults',
  createIfNotFound: true
});

// Name-based search fallback with contact validation
// When email/phone search fails, falls back to name search but validates contact info
const person = await client.people.findOrCreate({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@gmail.com
  fallbackToNameSearch: true,
  contactValidation: 'domain'  // 'strict' | 'domain' | 'similarity'
});

// Phase-specific retry configurations for advanced control
const person = await client.people.findOrCreate({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@gmail.com
  searchStrategy: 'multi-step',
  retryConfigs: {
    initial: { maxRetries: 3, maxWaitTime: 30000 },    // Quick search
    aggressive: { maxRetries: 6, maxWaitTime: 60000 }  // Final search before create
  },
  createIfNotFound: true
});

// Verify a person exists (handles merges/deletions)
const exists = await client.people.verifyPersonExists('person-123', {
  timeout: 30000
});
```

#### **3a. Contact Validation Helpers**

```typescript
import { 
  emailDomainsMatch, 
  phoneNumbersSimilar, 
  validateContactSimilarity,
  calculateTrust,
  DEFAULT_TRUST_WINDOW
} from '@rachelallyson/planning-center-people-ts';

// Check if email domains match (handles typos and aliases)
emailDomainsMatch('user@gmail.com', 'other@googlemail.com'); // true
emailDomainsMatch('user@gmail.com', 'other@gmial.com'); // true (typo)

// Check if phone numbers are similar (handles formatting)
phoneNumbersSimilar('+15551234567', '555-123-4567'); // true
phoneNumbersSimilar('15551234567', '5551234567'); // true

// Validate contact similarity for name-based matches
const validation = validateContactSimilarity(
  'jane@gmail.com
  '+15551234567',
  ['john@gmail.com@work.com'],  // Person's emails
  ['+15551234567']  // Person's phones
);
// { emailMatch: true, phoneMatch: true, isValid: true }

// Calculate trust for cached person IDs
const trust = calculateTrust(personIdCreatedAt);
if (trust.shouldTrust) {
  // Use cached personId without verification
  return cachedPersonId;
} else {
  // Verify personId still exists in PCO
  const exists = await client.people.verifyPersonExists(cachedPersonId);
}
```

#### **4. Type-Safe Field Operations**

```typescript
// Automatic field definition lookup and type validation
await client.fields.setPersonFieldBySlug(
  personId, 
  'BIRTHDATE', 
  '1990-01-01'
);

// Or by field name
await client.fields.setPersonFieldByName(
  personId, 
  'Membership Status', 
  'Member'
);
```

#### **5. Enhanced Workflow Management**

```typescript
// Smart workflow operations with duplicate detection
const workflowCard = await client.workflows.addPersonToWorkflow(
  personId,
  workflowId,
  {
    note: 'Added from integration',
    skipIfExists: true,    // Skip if person already has a completed card
    skipIfActive: true     // Skip if person already has an active card
  }
);
```

#### **6. Debug logging and rate limit info**

```typescript
// Enable request logging when creating the client
const client = new PcoClient({
  auth: { /* ... */ },
  debug: true
});

// Check rate limit status (e.g. before a batch)
const info = client.getRateLimitInfo();
console.log(`Remaining: ${info.remaining}/${info.limit}, resets in ${info.windowResetsIn}ms`);
```

## 📖 **Quick Start**

### Installation

```bash
npm install @rachelallyson/planning-center-people-ts@latest
```

### Basic Usage

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

// Create a client
const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: 'your-access-token',
    refreshToken: 'your-refresh-token',
    onRefresh: (newTokens) => {
      // Save new tokens to your storage
      saveTokens(newTokens);
    }
  },
  events: {
    onError: (event) => console.error('PCO Error:', event.error),
    onAuthFailure: (event) => console.error('Auth failed:', event.error),
  }
});
```

### Working with People

```typescript
// Get all people (all pages)
const result = await client.people.getAll({
  include: ['emails', 'phone_numbers']
});
const allPeople = result.data;

// Create a person
const person = await client.people.create({
  first_name: 'Jane',
  last_name: 'Smith',
  status: 'active'
});

// Add contact information
const email = await client.people.addEmail(person.id, {
  address: 'jane@gmail.com
  primary: true
});

// Smart person matching
const foundOrCreated = await client.people.findOrCreate(
  { first_name: 'John', last_name: 'Doe', email: 'john@gmail.com
  { first_name: 'John', last_name: 'Doe', email: 'john@gmail.com
);
```

### Working with Fields

```typescript
// Get all field definitions
const fieldDefs = await client.fields.getAllFieldDefinitions();

// Set person field by slug
await client.fields.setPersonFieldBySlug(
  personId, 
  'BIRTHDATE', 
  '1990-01-01'
);

// Set person field by name
await client.fields.setPersonFieldByName(
  personId, 
  'Membership Status', 
  'Member'
);
```

### Working with Workflows

```typescript
// Get all workflows
const workflowsResult = await client.workflows.getAll();
const workflows = workflowsResult.data;

// Add person to workflow with smart duplicate detection
const workflowCard = await client.workflows.addPersonToWorkflow(
  personId,
  workflowId,
  {
    note: 'Added from integration',
    skipIfExists: true,
    skipIfActive: true
  }
);

// Add a note to the workflow card
const note = await client.workflows.createWorkflowCardNote(
  personId,
  workflowCard.id,
  { note: 'Follow up needed' }
);
```

## 🔄 **Migration from v1.x**

See the comprehensive [Migration Guide](docs/MIGRATION_V2.md) for detailed instructions on upgrading from v1.x to v2.0.0.

### Quick Migration Example

**v1.x (Old – functional API, removed):**

```typescript
import { createPcoClient, getPeople, createPerson } from '@rachelallyson/planning-center-people-ts';
const client = createPcoClient({ accessToken: token });
const people = await getPeople(client, { per_page: 100 });
const person = await createPerson(client, data);
```

**v2.0 (Current – class API, core package does HTTP):**

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';
const client = new PcoClient({ auth: { type: 'oauth', accessToken: token, refreshToken: refresh, onRefresh: async () => {}, onRefreshFailure: async () => {} } });
const result = await client.people.getAll({ include: ['emails'] });
const people = result.data;
const person = await client.people.create(data);
```

## 🏗️ **Architecture**

### Module Structure

- **`client.people`** - Person management and operations
- **`client.fields`** - Custom field operations
- **`client.workflows`** - Workflow and workflow card management
- **`client.contacts`** - Email, phone, address, and social profile operations
- **`client.households`** - Household management
- **`client.notes`** - Note and note category operations
- **`client.lists`** - List and list category operations

### Debug logging

Set `config.debug: true` when creating the client to log each request (start, complete, error). Use `client.getRateLimitInfo()` to check rate limit state.

## 🧪 **Testing**

We use **integration tests** with the real API. In the repo, tests use a real client from `tests/integration/test-config.ts` (see [tests/README_TESTING.md](tests/README_TESTING.md)). For your own tests or examples, create a real client with your credentials:

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
  },
});

const people = await client.people.getPage({ per_page: 10 });
```

## 📚 **Documentation**

- [Migration Guide](docs/MIGRATION_V2.md) - Complete v1.x to v2.0 migration
- [API Reference](docs/API_REFERENCE.md) - Detailed API documentation
- [Examples](examples/) - Comprehensive usage examples
- [Testing Guide](docs/TESTING.md) - Testing utilities and patterns

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 **License**

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 **Support**

- **Issues**: [GitHub Issues](https://github.com/rachelallyson/planning-center-people-ts/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rachelallyson/planning-center-people-ts/discussions)
- **Documentation**: [Full Documentation](https://github.com/rachelallyson/planning-center-people-ts/tree/main/docs)

---

**v2.0.0** represents a complete redesign focused on developer experience, performance, and maintainability. The new API provides all the features you requested that would have made your migration significantly easier and more robust.
