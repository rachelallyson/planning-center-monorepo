# Retry Logic Fix for PCO Contact Verification Delays

## Problem

When creating a person in PCO with email/phone contacts, PCO needs 30-90+ seconds to verify and index those contacts before they become searchable via the API. This causes a race condition where:

1. Person A is created with email/phone
2. Code waits 10 seconds
3. Code tries to find Person A, but contacts aren't verified yet
4. After retries fail, code creates Person B (duplicate) instead of matching Person A

## Solution

Added built-in retry logic to the `findOrCreate` method that automatically handles PCO contact verification delays.

### How It Works

The retry logic automatically activates when:

- `createIfNotFound: false` (trying to find existing person)
- Email or phone is provided (these need verification)
- `retryConfig.enabled` is not explicitly `false`

### Default Configuration

- **maxRetries**: 5 attempts
- **maxWaitTime**: 120 seconds (2 minutes)
- **initialDelay**: 10 seconds before first retry
- **backoffMultiplier**: 1.5x (exponential backoff)

Retry delays: 10s → 15s → 22.5s → 33.75s → 50.6s (total ~131s, capped at 120s)

### Usage

#### Basic Usage (Automatic Retry)

```typescript
// Retry logic automatically activates when createIfNotFound: false
// and email/phone are provided
const person = await client.people.findOrCreate({
  email: 'test@example.com',
  phone: '+1234567890',
  firstName: 'John',
  lastName: 'Doe',
  createIfNotFound: false, // Will retry automatically
  matchStrategy: 'exact'
});
```

#### Custom Retry Configuration

```typescript
const person = await client.people.findOrCreate({
  email: 'test@example.com',
  phone: '+1234567890',
  firstName: 'John',
  lastName: 'Doe',
  createIfNotFound: false,
  matchStrategy: 'exact',
  retryConfig: {
    maxRetries: 6,           // More retries
    maxWaitTime: 180000,     // 3 minutes max wait
    initialDelay: 15000,     // Start with 15s delay
    backoffMultiplier: 1.8   // Faster backoff
  }
});
```

#### Disable Retry Logic

```typescript
const person = await client.people.findOrCreate({
  email: 'test@example.com',
  phone: '+1234567890',
  firstName: 'John',
  lastName: 'Doe',
  createIfNotFound: false,
  retryConfig: {
    enabled: false // Disable automatic retries
  }
});
```

### Migration Guide

**Before (Manual Retries):**

```typescript
// Manual retry logic with fixed delays
let person;
let attempts = 0;
const maxAttempts = 5;

while (attempts < maxAttempts) {
  try {
    person = await client.people.findOrCreate({
      email: guest.email,
      phone: guest.phone,
      firstName: guest.firstName,
      createIfNotFound: false,
      matchStrategy: 'exact'
    });
    break; // Success!
  } catch (error) {
    attempts++;
    if (attempts >= maxAttempts) {
      // After all retries, create new person (BUG: creates duplicate!)
      person = await client.people.findOrCreate({
        email: guest.email,
        phone: guest.phone,
        firstName: guest.firstName,
        createIfNotFound: true, // Creates duplicate!
        matchStrategy: 'exact'
      });
    } else {
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 10000 * attempts));
    }
  }
}
```

**After (Automatic Retry):**

```typescript
// Let the library handle retries automatically
try {
  const person = await client.people.findOrCreate({
    email: guest.email,
    phone: guest.phone,
    firstName: guest.firstName,
    createIfNotFound: false, // Retry logic activates automatically
    matchStrategy: 'exact',
    retryConfig: {
      maxWaitTime: 120000 // Wait up to 2 minutes
    }
  });
  // Person found!
} catch (error) {
  // After 2 minutes of retries, person truly doesn't exist
  // Now it's safe to create (or handle error appropriately)
  const person = await client.people.findOrCreate({
    email: guest.email,
    phone: guest.phone,
    firstName: guest.firstName,
    createIfNotFound: true, // Safe to create now
    matchStrategy: 'exact'
  });
}
```

### Best Practices

1. **Use retry logic when searching for existing persons**: Set `createIfNotFound: false` and let the library handle retries automatically.

2. **Don't create immediately after retries fail**: If retries are exhausted, wait a bit longer or handle the error appropriately. The person might still be getting verified.

3. **Adjust retry config based on your needs**:
   - For faster feedback: reduce `maxWaitTime` and `maxRetries`
   - For higher reliability: increase `maxWaitTime` to 180-240 seconds

4. **Monitor retry logs**: The library logs retry attempts with `[PERSON_MATCH]` prefix for debugging.

### Logging

The retry logic logs the following for debugging:

```
[PERSON_MATCH] Attempt 1 failed, retrying in 10000ms
[PERSON_MATCH] Attempt 2 failed, retrying in 15000ms
[PERSON_MATCH] Found person after 3 attempts (waited 25000ms)
```

### Error Handling

After all retries are exhausted, the library throws an error:

```
Error: No matching person found after 5 attempts (waited 120000ms) and creation is disabled
```

This error indicates:

- The person truly doesn't exist, OR
- PCO is taking longer than expected to verify contacts

At this point, you can:

1. Wait longer and try again
2. Create a new person (if you're certain it doesn't exist)
3. Handle the error appropriately for your use case
