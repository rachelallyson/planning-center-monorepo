/**
 * Integration test helper: assert that runtime data matches a TypeScript type using Typia.
 * Use this in integration tests to ensure API responses conform to the declared types.
 */
import typia from 'typia';

/**
 * Asserts that `value` matches type `T` at runtime. Throws Typia's TypeGuardError if not.
 * Returns the value narrowed to `T` for use in the test.
 */
export function assertMatchesType<T>(value: unknown): T {
    return typia.assert<T>(value);
}
