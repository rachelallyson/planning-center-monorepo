# Retry Logic Duplicate Prevention Test

## Overview

This integration test verifies that the retry logic prevents duplicate person creation when PCO takes time to verify/index contacts after a person is created.

## The Bug Scenario

1. **Person A is created** with email `duplicate.test.1762532251432@onark.app` and phone `+17481561059`
2. **PCO needs 30-90+ seconds** to verify/index the contacts before they become searchable
3. **Code immediately tries to find Person A** (before contacts are verified)
4. **Without retry logic**: Search fails → Code creates Person B (duplicate) ❌
5. **With retry logic**: Search retries with exponential backoff → Finds Person A ✅

## Running the Test

### Prerequisites

1. Set up authentication in `.env.test`:

   ```bash
   # Option 1: Personal Access Token
   PCO_PERSONAL_ACCESS_TOKEN=your_token_here
   
   # Option 2: OAuth (with refresh)
   PCO_ACCESS_TOKEN=your_access_token
   PCO_REFRESH_TOKEN=your_refresh_token
   ```

2. Navigate to the package directory:

   ```bash
   cd packages/planning-center-people-ts
   ```

### Run All Retry Logic Tests

```bash
npm run test:integration -- --testNamePattern="Retry Logic"
```

### Run Specific Test Cases

```bash
# Test that retry logic prevents duplicates
npm run test:integration -- --testNamePattern="should find existing person after contact verification delay with retry logic"

# Test the bug scenario (without retry)
npm run test:integration -- --testNamePattern="should demonstrate the bug scenario without retry logic"

# Test custom retry configuration
npm run test:integration -- --testNamePattern="should handle retry logic with custom configuration"
```

## Test Cases

### 1. Retry Logic Prevents Duplicate Creation ✅

**Test**: `should find existing person after contact verification delay with retry logic`

**What it does**:

- Creates a person with email/phone
- Immediately tries to find that person (before contacts verified)
- Uses retry logic with exponential backoff (10s → 15s → 22.5s → 33.75s → 50.6s)
- Verifies the same person is found (no duplicate created)

**Expected result**: ✅ Finds existing person after retries, no duplicate created

**Timeout**: 3 minutes (allows for retries)

### 2. Bug Scenario Demonstration ⚠️

**Test**: `should demonstrate the bug scenario without retry logic`

**What it does**:

- Creates a person with email/phone
- Immediately tries to find WITHOUT retry logic
- Shows that search fails if contacts aren't verified yet
- Demonstrates why retry logic is needed

**Expected result**:

- If contacts not verified: Search fails (expected)
- If contacts already verified: Search succeeds (PCO was fast)

**Timeout**: 2 minutes

### 3. Custom Retry Configuration 🔧

**Test**: `should handle retry logic with custom configuration`

**What it does**:

- Tests retry logic with custom settings:
  - More retries (6 instead of 5)
  - Longer max wait (3 minutes instead of 2)
  - Different delays and backoff

**Expected result**: ✅ Works with custom configuration

**Timeout**: 4 minutes

### 4. Edge Cases 🎯

**Tests**:

- Retry logic disabled when `createIfNotFound: true`
- Retry logic disabled when no email/phone provided

**Expected result**: ✅ Retry logic only activates when appropriate

## Understanding Test Output

### Success Output

```
🧪 Test: Retry logic prevents duplicate creation
📧 Test email: duplicate.test.1234567890@onark.app
📞 Test phone: +17481561234

Step 1: Creating initial person with email/phone...
✅ Initial person created: 181158409 (took 1234ms)
✅ Person has email and phone contacts

Step 2: Immediately searching for existing person (before contacts verified)...
⚠️  This simulates the race condition - contacts may not be searchable yet
[PERSON_MATCH] Attempt 1 failed, retrying in 10000ms
[PERSON_MATCH] Attempt 2 failed, retrying in 15000ms
[PERSON_MATCH] Found person after 3 attempts (waited 25000ms)
✅ Found existing person: 181158409 (took 25000ms)
✅ SUCCESS: Found existing person, no duplicate created!

Step 3: Verifying no duplicate was created...
✅ Person found in search results (same ID)
✅ Verified: No duplicate person created
```

### Failure Output (if retry logic doesn't work)

```
❌ Failed to find person after 120000ms: No matching person found after 5 attempts (waited 120000ms) and creation is disabled
```

This indicates:

- PCO is taking longer than 2 minutes to verify contacts (unlikely but possible)
- There might be an issue with the retry logic
- The person truly doesn't exist (shouldn't happen in this test)

## Troubleshooting

### Test Fails Immediately

**Problem**: Test fails right away without retrying

**Possible causes**:

1. Retry logic not activating (check `createIfNotFound: false` and email/phone provided)
2. Error in retry logic implementation
3. PCO API error (not related to contact verification)

**Solution**: Check console logs for `[PERSON_MATCH]` messages - they should appear if retry logic is working

### Test Times Out

**Problem**: Test exceeds timeout (3-4 minutes)

**Possible causes**:

1. PCO is taking longer than expected to verify contacts
2. Network issues
3. Rate limiting

**Solution**:

- Increase test timeout in the test file
- Check PCO API status
- Verify network connectivity

### Test Creates Duplicate

**Problem**: Test creates a duplicate person instead of finding existing one

**Possible causes**:

1. Retry logic not working correctly
2. `createIfNotFound: true` is being used when it shouldn't be
3. Person IDs don't match (different person found)

**Solution**:

- Check that `createIfNotFound: false` is set in the search call
- Verify retry logic is activating (check logs)
- Ensure person IDs match: `expect(foundPerson.id).toBe(initialPerson.id)`

## Expected Behavior

### With Retry Logic ✅

1. Person created → Contacts added
2. Immediate search → Fails (contacts not verified)
3. Retry after 10s → Fails (contacts still not verified)
4. Retry after 15s → Fails (contacts still not verified)
5. Retry after 22.5s → **Success!** (contacts verified)
6. Same person found → No duplicate created

### Without Retry Logic ❌

1. Person created → Contacts added
2. Immediate search → Fails (contacts not verified)
3. Code gives up → Creates new person → **Duplicate!**

## Notes

- **PCO Contact Verification Time**: Can take 30-90+ seconds, but sometimes happens faster
- **Test Timing**: Tests are designed to handle both fast and slow PCO verification
- **Cleanup**: All test persons are automatically deleted after tests complete
- **Rate Limiting**: Tests respect PCO rate limits and may take longer if rate limited

## Related Files

- **Implementation**: `src/matching/matcher.ts` - Contains retry logic
- **Configuration**: `src/modules/people.ts` - `PersonMatchOptions` interface with `retryConfig`
- **Documentation**: `RETRY_LOGIC_FIX.md` - Detailed explanation of the fix
