/**
 * Telling "PCO says this person is not there" apart from "PCO did not answer".
 *
 * The matcher used to be unable to make that distinction. Its search helpers
 * ended in `catch { return [] }`, so a 500, a 429 or a socket timeout arrived at
 * the matching logic as an EMPTY RESULT SET. Zero rows read as a clean no-match,
 * and a clean no-match is permission to create a person. During a PCO outage the
 * create path therefore did not fail; it succeeded, repeatedly, at making
 * duplicates. Classifying the error later cannot recover this, because by then
 * the exception has already been turned into an empty array.
 *
 * The fix is to stop destroying the exception at the point of the swallow. Every
 * search helper still returns its empty array (so no read-only caller changes
 * behaviour), but it now also records WHY the array is empty in a
 * `SearchFaultLedger` belonging to the current attempt. One attempt plus its
 * ledger collapses into a `SearchOutcome`, which is the three-valued answer the
 * old code could not express: found, genuinely absent, or unknown.
 *
 * Only `SearchOutcome.kind === 'empty'` may lead to creating a person.
 */

import { PcoApiError } from '@rachelallyson/planning-center-base-ts';

/** One swallowed failure, kept with enough detail to explain a refusal to create. */
export interface SearchFault {
    /** Which lookup failed, e.g. `search:email` or `verify:emails`. */
    operation: string;
    /** HTTP status when the failure came from PCO. */
    status?: number;
    /** Error class name, e.g. `PcoApiError`. */
    name: string;
    message: string;
    /** The original error, so callers can rethrow or inspect rate-limit headers. */
    cause: unknown;
}

/**
 * Whether an error is PCO answering "not there" rather than failing to answer.
 *
 * ONLY a 404. Every other status leaves us not knowing:
 *
 * - 401/403 mean we were not allowed to look, which is not evidence of absence.
 * - 422 means PCO could not read the query, so nothing was searched.
 * - 408/429/5xx and socket errors mean the request did not complete.
 *
 * Unrecognised errors are deliberately NOT definitive. The base client throws a
 * plain `Error('Rate limit exceeded after retries')` for an exhausted 429, and
 * `fetch` throws bare `TypeError`s for network faults; both must degrade rather
 * than be read as absence. Defaulting the unknown case to "degraded" is the
 * whole safety property of this module.
 *
 * This matches how OnArk's `personCreateGuard.isPersonDefinitivelyGone` already
 * classifies the same errors downstream, deliberately: the two must not disagree
 * about what a 404 means.
 *
 * Matched on `name` as well as `instanceof` because a monorepo consumer can end
 * up with two copies of the base package, and `instanceof` quietly returns false
 * across that boundary. A false negative here degrades a definitive 404, which
 * is the safe direction to be wrong in, but it would still fail jobs for no
 * reason.
 */
export function isDefinitiveAbsence(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const isPcoError = error instanceof PcoApiError || error.name === 'PcoApiError';
    return isPcoError && statusOf(error) === 404;
}

/** Read an HTTP status off an error when it carries one. */
function statusOf(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) return undefined;
    const status: unknown = Reflect.get(error, 'status');
    return typeof status === 'number' ? status : undefined;
}

/** Turn a caught error into a recordable fault. */
export function describeFault(operation: string, error: unknown): SearchFault {
    return {
        operation,
        status: statusOf(error),
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        cause: error,
    };
}

/**
 * The faults collected during a single search attempt.
 *
 * One ledger per attempt, never one per matcher: `PersonMatcher` is shared and
 * `findOrCreate` is async, so an instance field would leak faults between
 * concurrent calls and refuse creates for unrelated people.
 */
export class SearchFaultLedger {
    private readonly faults: SearchFault[] = [];

    /**
     * Record a swallowed error, unless it was PCO definitively saying "not there".
     *
     * Callers still handle the empty result exactly as before; this only preserves
     * the reason so the create decision can see it.
     */
    record(operation: string, error: unknown): void {
        if (isDefinitiveAbsence(error)) return;
        this.faults.push(describeFault(operation, error));
    }

    /** True when at least one lookup in this attempt did not complete. */
    get degraded(): boolean {
        return this.faults.length > 0;
    }

    /** The recorded faults, oldest first. */
    get causes(): SearchFault[] {
        return [...this.faults];
    }

    /** Fold a nested attempt's faults into this one. */
    absorb(other: SearchFaultLedger): void {
        this.faults.push(...other.causes);
    }
}

/**
 * What one search attempt established.
 *
 * `empty` is the only value that means PCO answered and the person is not there,
 * and therefore the only value from which a create may follow.
 */
export type SearchOutcome<TMatch> =
    | { kind: 'match'; match: TMatch }
    | { kind: 'empty' }
    | { kind: 'degraded'; faults: SearchFault[] };

/** One-line summary of what went wrong, for error messages and logs. */
export function summarizeFaults(faults: SearchFault[]): string {
    if (faults.length === 0) return 'no detail recorded';
    return faults
        .map((f) => `${f.operation}: ${f.status ? `HTTP ${f.status} ` : ''}${f.message}`)
        .join('; ');
}
