/**
 * The two outcomes `findOrCreate` used to report with one indistinguishable
 * `Error('No matching person found and creation is disabled')`.
 *
 * A caller who cannot tell a clean no-match from an outage has to guess, and the
 * cheap guess is "no match, so make one". Giving the two states distinct types
 * is what lets a caller retry the fault and only the fault.
 */

import type { SearchFault } from './search-outcome';
import { summarizeFaults } from './search-outcome';

/**
 * PCO answered, and the person genuinely is not there, but creation was disabled.
 *
 * The message is preserved byte for byte from the pre-fix error so that callers
 * matching on the string keep working; the type is the new, better way to check.
 */
export class NoMatchingPersonError extends Error {
    constructor(message = 'No matching person found and creation is disabled') {
        super(message);
        this.name = 'NoMatchingPersonError';
    }
}

/**
 * PCO did not answer, so nothing may be inferred from the absence of a match.
 *
 * Thrown rather than returned. A sentinel return value would rebuild the original
 * bug one level up, where a caller reads "no person" and creates one anyway. The
 * caller's correct response is to fail the unit of work and retry it later.
 *
 * The message deliberately avoids the phrases PCO uses for a genuine absence
 * ("could not be found", "Resource not found"), because downstream guards fall
 * back to matching on that wording when a status is not available. Reading this
 * error as a not-found is precisely the mistake it exists to prevent.
 */
export class PcoSearchUnavailableError extends Error {
    /** Every lookup in the final attempt that failed to complete. */
    readonly faults: SearchFault[];
    /** HTTP status of the first recorded fault, when it came from PCO. */
    readonly status?: number;

    constructor(faults: SearchFault[], action = 'create a person') {
        super(
            `PCO person search did not complete, so refusing to ${action} from an unanswered search ` +
            `(${summarizeFaults(faults)})`
        );
        this.name = 'PcoSearchUnavailableError';
        this.faults = faults;
        this.status = faults.find((f) => f.status !== undefined)?.status;
    }

    /**
     * The original error behind the first recorded fault, for rethrowing or
     * inspection (rate-limit headers, JSON:API error objects).
     *
     * Named `primaryCause` rather than `cause` so it cannot collide with the
     * built-in `Error.cause`, whose type varies by TS lib target.
     */
    get primaryCause(): unknown {
        return this.faults[0]?.cause;
    }
}
