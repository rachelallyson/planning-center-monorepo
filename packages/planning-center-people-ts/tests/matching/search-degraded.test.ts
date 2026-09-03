/**
 * The invariant: a caller must never reach "create a new person" off a search
 * that FAILED rather than one that returned empty.
 *
 * Every test in the "must not create" group fails against the pre-fix matcher,
 * where `searchByEmail`/`searchByPhone` ended in `catch { return [] }` and the
 * empty array was read as a clean no-match. That conflation is what turned the
 * 2025-08-28 PCO outage into one guest imported over 3,000 times.
 */

import { PcoApiError } from '@rachelallyson/planning-center-base-ts';
import { PersonMatcher } from '../../src/matching/matcher';
import { NoMatchingPersonError, PcoSearchUnavailableError } from '../../src/matching/errors';
import { isDefinitiveAbsence } from '../../src/matching/search-outcome';
import type { PersonMatcherDeps } from '../../src/modules/people';
import type { PersonResource } from '../../src/types';

const mockPeopleModule: jest.Mocked<PersonMatcherDeps> = {
  search: jest.fn(),
  getEmails: jest.fn(),
  getPhoneNumbers: jest.fn(),
  create: jest.fn(),
  addEmail: jest.fn(),
  addPhoneNumber: jest.fn(),
  setPrimaryCampus: jest.fn(),
  getById: jest.fn(),
};

const person: PersonResource = {
  id: '1',
  type: 'Person',
  first_name: 'John',
  last_name: 'Doe',
};

/** A PCO error with a given status, built the way the HTTP client builds them. */
function pcoError(status: number, statusText: string): PcoApiError {
  return new PcoApiError(statusText, status, statusText, []);
}

/** No contacts anywhere, so nothing can be verified into a match. */
function noContacts(): void {
  mockPeopleModule.getEmails.mockResolvedValue({ data: [] });
  mockPeopleModule.getPhoneNumbers.mockResolvedValue({ data: [] });
}

/** The create path, wired so a create would succeed if it were reached. */
function creatable(): void {
  mockPeopleModule.create.mockResolvedValue({ data: person });
  mockPeopleModule.getById.mockResolvedValue(person);
}

const guest = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@gmail.com',
};

/** The error a call rejected with. Fails the test if it resolved instead. */
async function rejection(call: Promise<PersonResource>): Promise<Error> {
  try {
    await call;
  } catch (error) {
    if (error instanceof Error) return error;
    throw error;
  }
  throw new Error('expected the call to reject, but it resolved');
}

/** Narrow to the unavailable error, or rethrow whatever came instead. */
function asUnavailable(error: Error): PcoSearchUnavailableError {
  if (error instanceof PcoSearchUnavailableError) return error;
  throw error;
}

describe('search failure must never reach a create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    noContacts();
    creatable();
  });

  const matcher = () => new PersonMatcher(mockPeopleModule);

  describe('the outage case', () => {
    it('refuses to create when the search 500s', async () => {
      mockPeopleModule.search.mockRejectedValue(pcoError(500, 'Internal Server Error'));

      await expect(matcher().findOrCreate(guest)).rejects.toThrow(PcoSearchUnavailableError);
      expect(mockPeopleModule.create).not.toHaveBeenCalled();
    });

    it('refuses to create when the search is rate limited', async () => {
      mockPeopleModule.search.mockRejectedValue(pcoError(429, 'Too Many Requests'));

      await expect(matcher().findOrCreate(guest)).rejects.toThrow(PcoSearchUnavailableError);
      expect(mockPeopleModule.create).not.toHaveBeenCalled();
    });

    it('refuses to create when the socket times out', async () => {
      // Not a PcoApiError at all. An unrecognised error must degrade, not be read
      // as absence, or every network fault becomes a duplicate.
      mockPeopleModule.search.mockRejectedValue(new Error('fetch failed'));

      await expect(matcher().findOrCreate(guest)).rejects.toThrow(PcoSearchUnavailableError);
      expect(mockPeopleModule.create).not.toHaveBeenCalled();
    });

    it('refuses to create when the exhausted-429 error from the base client surfaces', async () => {
      mockPeopleModule.search.mockRejectedValue(new Error('Rate limit exceeded after retries'));

      await expect(matcher().findOrCreate(guest)).rejects.toThrow(PcoSearchUnavailableError);
      expect(mockPeopleModule.create).not.toHaveBeenCalled();
    });

    it('refuses to create when auth fails, which is not evidence of absence', async () => {
      mockPeopleModule.search.mockRejectedValue(pcoError(401, 'Unauthorized'));

      await expect(matcher().findOrCreate(guest)).rejects.toThrow(PcoSearchUnavailableError);
      expect(mockPeopleModule.create).not.toHaveBeenCalled();
    });

    it('refuses to create when the phone lookup fails even though the email lookup was clean', async () => {
      // One failed lookup is enough. The person could have been found by the leg
      // that did not answer.
      mockPeopleModule.search.mockImplementation(async (criteria: { phone?: string }) => {
        if (criteria.phone) throw pcoError(503, 'Service Unavailable');
        return { data: [] };
      });

      await expect(
        matcher().findOrCreate({ ...guest, phone: '+15555550123' })
      ).rejects.toThrow(PcoSearchUnavailableError);
      expect(mockPeopleModule.create).not.toHaveBeenCalled();
    });

    it('refuses to create when a candidate was returned but its contacts could not be read', async () => {
      // The search worked, so the old code saw no fault at all. But verification
      // is part of the search: dropping every candidate produces the same empty
      // result as finding nobody, and it is just as untrustworthy.
      mockPeopleModule.search.mockResolvedValue({ data: [person] });
      mockPeopleModule.getEmails.mockRejectedValue(pcoError(500, 'Internal Server Error'));

      await expect(matcher().findOrCreate(guest)).rejects.toThrow(PcoSearchUnavailableError);
      expect(mockPeopleModule.create).not.toHaveBeenCalled();
    });

    it('refuses to create when every multi-step strategy throws', async () => {
      mockPeopleModule.search.mockRejectedValue(pcoError(502, 'Bad Gateway'));

      await expect(
        matcher().findOrCreate({ ...guest, searchStrategy: 'multi-step' })
      ).rejects.toThrow(PcoSearchUnavailableError);
      expect(mockPeopleModule.create).not.toHaveBeenCalled();
    });

    it('carries the status and the original error on the thrown failure', async () => {
      const cause = pcoError(503, 'Service Unavailable');
      mockPeopleModule.search.mockRejectedValue(cause);

      const error = asUnavailable(await rejection(matcher().findOrCreate(guest)));

      expect(error.status).toBe(503);
      expect(error.primaryCause).toBe(cause);
      expect(error.faults[0].operation).toBe('search:email');
    });

    it('does not word the failure so a not-found check could match it', async () => {
      // OnArk's personCreateGuard falls back to matching PCO's not-found wording
      // when no status is available. Reading this error as a not-found is exactly
      // the mistake it exists to prevent.
      mockPeopleModule.search.mockRejectedValue(pcoError(500, 'Internal Server Error'));

      const error = await rejection(matcher().findOrCreate(guest));

      expect(error.message).not.toContain('could not be found');
      expect(error.message).not.toContain('Resource not found');
      expect(error.name).toBe('PcoSearchUnavailableError');
    });
  });

  describe('a genuine empty answer still creates', () => {
    it('creates when PCO answers cleanly with nobody', async () => {
      mockPeopleModule.search.mockResolvedValue({ data: [] });

      const result = await matcher().findOrCreate(guest);

      expect(mockPeopleModule.create).toHaveBeenCalled();
      expect(result.id).toBe('1');
    });

    it('creates when the email is invalid, since nothing was asked of PCO', async () => {
      mockPeopleModule.search.mockResolvedValue({ data: [] });

      await matcher().findOrCreate({ ...guest, email: 'not-an-email' });

      expect(mockPeopleModule.create).toHaveBeenCalled();
    });
  });

  describe('404 is absence, 5xx is not', () => {
    it('classifies a 404 as definitive and anything else as degraded', () => {
      expect(isDefinitiveAbsence(pcoError(404, 'Not Found'))).toBe(true);
      expect(isDefinitiveAbsence(pcoError(500, 'Internal Server Error'))).toBe(false);
      expect(isDefinitiveAbsence(pcoError(429, 'Too Many Requests'))).toBe(false);
      expect(isDefinitiveAbsence(pcoError(403, 'Forbidden'))).toBe(false);
      expect(isDefinitiveAbsence(pcoError(422, 'Unprocessable Entity'))).toBe(false);
      expect(isDefinitiveAbsence(new Error('fetch failed'))).toBe(false);
      expect(isDefinitiveAbsence('not an error')).toBe(false);
    });

    it('creates on a 404 from the search but not on a 500', async () => {
      mockPeopleModule.search.mockRejectedValue(pcoError(404, 'Not Found'));
      await matcher().findOrCreate(guest);
      expect(mockPeopleModule.create).toHaveBeenCalled();

      jest.clearAllMocks();
      noContacts();
      creatable();
      mockPeopleModule.search.mockRejectedValue(pcoError(500, 'Internal Server Error'));
      await expect(matcher().findOrCreate(guest)).rejects.toThrow(PcoSearchUnavailableError);
      expect(mockPeopleModule.create).not.toHaveBeenCalled();
    });

    it('treats a 404 on a candidate lookup as "this person has no emails"', async () => {
      // The person was deleted between the search and the verify. That is a real
      // answer, not an outage, so the candidate is dropped and the create proceeds.
      mockPeopleModule.search.mockResolvedValue({ data: [person] });
      mockPeopleModule.getEmails.mockRejectedValue(pcoError(404, 'Not Found'));

      await matcher().findOrCreate(guest);

      expect(mockPeopleModule.create).toHaveBeenCalled();
    });
  });

  describe('the aggressive pre-create search', () => {
    const aggressive = {
      ...guest,
      retryConfigs: { aggressive: { maxRetries: 2, maxWaitTime: 0, initialDelay: 0, backoffMultiplier: 1 } },
    };

    it('refuses to create when the last attempt could not reach PCO', async () => {
      mockPeopleModule.search.mockRejectedValue(pcoError(500, 'Internal Server Error'));

      await expect(matcher().findOrCreate(aggressive)).rejects.toThrow(PcoSearchUnavailableError);
      expect(mockPeopleModule.create).not.toHaveBeenCalled();
    });

    it('refuses to create when a clean empty is followed by an outage', async () => {
      // The whole point of this loop is that an earlier no-match may be stale. If
      // the most recent attempt cannot confirm the absence, an older clean empty
      // does not license a create.
      mockPeopleModule.search
        .mockResolvedValueOnce({ data: [] })
        .mockRejectedValue(pcoError(500, 'Internal Server Error'));

      await expect(matcher().findOrCreate(aggressive)).rejects.toThrow(PcoSearchUnavailableError);
      expect(mockPeopleModule.create).not.toHaveBeenCalled();
    });

    it('creates when an outage is followed by a clean empty', async () => {
      mockPeopleModule.search
        .mockRejectedValueOnce(pcoError(500, 'Internal Server Error'))
        .mockResolvedValue({ data: [] });

      await matcher().findOrCreate(aggressive);

      expect(mockPeopleModule.create).toHaveBeenCalled();
    });
  });

  describe('createOnDegradedSearch, the escape hatch', () => {
    it('restores the old create-anyway behaviour when explicitly opted in', async () => {
      mockPeopleModule.search.mockRejectedValue(pcoError(500, 'Internal Server Error'));

      await matcher().findOrCreate({ ...guest, createOnDegradedSearch: true });

      expect(mockPeopleModule.create).toHaveBeenCalled();
    });
  });

  describe('createIfNotFound: false reports which of the two happened', () => {
    const findOnly = {
      ...guest,
      createIfNotFound: false,
      retryConfig: { maxRetries: 1, maxWaitTime: 0, initialDelay: 0, backoffMultiplier: 1 },
    };

    it('throws NoMatchingPersonError when PCO answered with nobody', async () => {
      mockPeopleModule.search.mockResolvedValue({ data: [] });

      const error = await rejection(matcher().findOrCreate(findOnly));

      expect(error).toBeInstanceOf(NoMatchingPersonError);
      // Preserved byte for byte for callers that match on the string.
      expect(error.message).toBe('No matching person found and creation is disabled');
    });

    it('throws PcoSearchUnavailableError when PCO did not answer', async () => {
      mockPeopleModule.search.mockRejectedValue(pcoError(500, 'Internal Server Error'));

      const error = await rejection(matcher().findOrCreate(findOnly));

      expect(error).toBeInstanceOf(PcoSearchUnavailableError);
      expect(error).not.toBeInstanceOf(NoMatchingPersonError);
    });

    it('reports the two cases distinguishably without the retry loop', async () => {
      // retryConfig.enabled: false takes the non-retry branch of findOrCreate.
      const noRetry = { ...findOnly, retryConfig: { enabled: false } };

      mockPeopleModule.search.mockResolvedValue({ data: [] });
      await expect(matcher().findOrCreate(noRetry)).rejects.toThrow(NoMatchingPersonError);

      mockPeopleModule.search.mockRejectedValue(pcoError(500, 'Internal Server Error'));
      await expect(matcher().findOrCreate(noRetry)).rejects.toThrow(PcoSearchUnavailableError);
    });
  });

  describe('findMatchWithOutcome, for callers who would rather not catch', () => {
    it('reports empty when PCO answered with nobody', async () => {
      mockPeopleModule.search.mockResolvedValue({ data: [] });

      await expect(matcher().findMatchWithOutcome(guest)).resolves.toEqual({ kind: 'empty' });
    });

    it('reports degraded when PCO did not answer', async () => {
      mockPeopleModule.search.mockRejectedValue(pcoError(500, 'Internal Server Error'));

      const outcome = await matcher().findMatchWithOutcome(guest);

      expect(outcome.kind).toBe('degraded');
    });

    it('leaves findMatch returning null in both cases, as before', async () => {
      mockPeopleModule.search.mockResolvedValue({ data: [] });
      await expect(matcher().findMatch(guest)).resolves.toBeNull();

      mockPeopleModule.search.mockRejectedValue(pcoError(500, 'Internal Server Error'));
      await expect(matcher().findMatch(guest)).resolves.toBeNull();
    });
  });

  describe('concurrency', () => {
    it('does not leak one call\'s outage into another call\'s decision', async () => {
      // The fault ledger is per attempt, never on the instance. A shared instance
      // field would refuse creates for unrelated people during any outage.
      const shared = matcher();
      mockPeopleModule.search.mockImplementation(async (criteria: { email?: string }) => {
        if (criteria.email === 'down@gmail.com') throw pcoError(500, 'Internal Server Error');
        return { data: [] };
      });

      const [degraded, clean] = await Promise.allSettled([
        shared.findOrCreate({ ...guest, email: 'down@gmail.com' }),
        shared.findOrCreate({ ...guest, email: 'fine@gmail.com' }),
      ]);

      expect(degraded.status).toBe('rejected');
      expect(clean.status).toBe('fulfilled');
    });
  });
});
