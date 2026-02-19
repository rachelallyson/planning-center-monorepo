/**
 * Type guards and safe property access without type assertions.
 * Uses Reflect.get for property access so no 'as' is required.
 */

/** Return string id from an object if present and string. */
export function getStringId(obj: object): string | undefined {
  const v = Reflect.get(obj, 'id');
  return typeof v === 'string' ? v : undefined;
}

/** Return message from an object (e.g. Error-like) if present and string. */
export function getMessage(obj: object): string | undefined {
  const v = Reflect.get(obj, 'message');
  return typeof v === 'string' ? v : undefined;
}

/** Extract HTTP status from an error-like object (e.g. API error with status or response.status). */
export function getStatusFromError(error: object): number | undefined {
  const status = Reflect.get(error, 'status');
  if (typeof status === 'number') return status;
  const response = Reflect.get(error, 'response');
  if (response && typeof response === 'object') {
    const s = Reflect.get(response, 'status');
    if (typeof s === 'number') return s;
  }
  return undefined;
}
