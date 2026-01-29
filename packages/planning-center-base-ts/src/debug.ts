/**
 * Debug logging for PCO clients: turn logs on/off and see everything that happens.
 *
 * Enable via client config:
 *   const client = new PcoClient({ auth: {...}, debug: true });
 *   // or with options:
 *   const client = new PcoClient({ auth: {...}, debug: { prefix: '[MyApp]', includePayloads: false } });
 *
 * Toggle at runtime:
 *   client.updateConfig({ debug: true });
 *   client.updateConfig({ debug: false });
 */

import type { PcoEvent } from './types/events';
import type { PcoClientConfig, PcoDebugOptions } from './types/config';

const DEFAULT_PREFIX = '[PCO]';

function normalizeOptions(debug: boolean | PcoDebugOptions | undefined): PcoDebugOptions | null {
    if (debug === undefined || debug === false) return null;
    if (debug === true) return { prefix: DEFAULT_PREFIX, includePayloads: false };
    return {
        prefix: debug.prefix ?? DEFAULT_PREFIX,
        includePayloads: debug.includePayloads ?? false,
        onLog: debug.onLog,
    };
}

function output(options: PcoDebugOptions, line: string, data?: unknown): void {
    const message = `${options.prefix} ${line}`;
    if (options.onLog) {
        options.onLog(message, data);
    } else {
        // eslint-disable-next-line no-console
        if (data !== undefined) console.log(message, data);
        else console.log(message);
    }
}

function formatEvent(event: PcoEvent, includePayloads: boolean): string {
    const ts = 'timestamp' in event ? event.timestamp : '';
    switch (event.type) {
        case 'request:start':
            return `→ ${event.method} ${event.endpoint}  (requestId: ${event.requestId}) ${ts}`;
        case 'request:complete':
            return `← ${event.method} ${event.endpoint}  ${event.status}  ${event.duration}ms  (requestId: ${event.requestId}) ${ts}`;
        case 'request:error':
            return `✗ ${event.method} ${event.endpoint}  ERROR  (requestId: ${event.requestId}) ${ts}`;
        case 'auth:success':
            return `auth:success  type=${event.authType} ${ts}`;
        case 'auth:failure':
            return `auth:failure  type=${event.authType} ${ts}`;
        case 'auth:refresh':
            return `auth:refresh  success=${event.success} type=${event.authType} ${ts}`;
        case 'rate:limit':
            return `rate:limit  remaining=${event.remaining} limit=${event.limit} reset=${event.resetTime} ${ts}`;
        case 'rate:available':
            return `rate:available  remaining=${event.remaining} limit=${event.limit} ${ts}`;
        case 'cache:hit':
            return `cache:hit  key=${event.key} ${ts}`;
        case 'cache:miss':
            return `cache:miss  key=${event.key} ${ts}`;
        case 'cache:set':
            return `cache:set  key=${event.key} ${event.ttl != null ? `ttl=${event.ttl}ms` : ''} ${ts}`;
        case 'cache:invalidate':
            return `cache:invalidate  key=${event.key} ${ts}`;
        case 'error':
            return `error  operation=${event.operation} ${ts}`;
        default:
            return `event  type=${(event as PcoEvent).type} ${ts}`;
    }
}

/** Minimal client interface for attaching the debug listener (avoids strict event type overloads). */
export interface PcoDebugListenable {
    on(type: string, handler: (e: PcoEvent) => void): void;
    off(type: string, handler: (e: PcoEvent) => void): void;
    getConfig(): PcoClientConfig;
}

/**
 * Attach a debug listener to a client that logs every event when config.debug is enabled.
 * Returns an unsubscribe function. The listener checks config on each event so you can
 * turn debug on/off at runtime via updateConfig({ debug: true }) or updateConfig({ debug: false }).
 */
export function attachDebugListener(
    client: PcoDebugListenable,
    getConfig: () => PcoClientConfig
): () => void {
    const handler = (event: PcoEvent): void => {
        const config = getConfig();
        const options = normalizeOptions(config.debug);
        if (!options) return;

        const line = formatEvent(event, options.includePayloads ?? false);
        if (options.includePayloads) {
            output(options, line, event);
        } else {
            output(options, line);
            if (event.type === 'request:error' && 'error' in event) {
                output(options, `   error: ${(event as { error: Error }).error.message}`);
            }
            if (event.type === 'auth:failure' && 'error' in event) {
                output(options, `   error: ${(event as { error: Error }).error.message}`);
            }
            if (event.type === 'error' && 'error' in event) {
                output(options, `   error: ${(event as { error: Error }).error.message}`);
            }
        }
    };

    const eventTypes: Array<PcoEvent['type']> = [
        'request:start',
        'request:complete',
        'request:error',
        'auth:success',
        'auth:failure',
        'auth:refresh',
        'rate:limit',
        'rate:available',
        'cache:hit',
        'cache:miss',
        'cache:set',
        'cache:invalidate',
        'error',
    ];

    for (const type of eventTypes) {
        client.on(type, handler);
    }

    return () => {
        for (const type of eventTypes) {
            client.off(type, handler);
        }
    };
}

/**
 * Create a one-off debug logger for use inside a package (e.g. matching, helpers).
 * Only logs when the given config has debug enabled. Safe to call from any module.
 */
export function createDebugLogger(config: { debug?: boolean | PcoDebugOptions } | null | undefined): {
    log: (message: string, data?: unknown) => void;
    enabled: boolean;
} {
    const options = normalizeOptions(config?.debug);
    return {
        enabled: options !== null,
        log(message: string, data?: unknown) {
            if (!options) return;
            if (options.includePayloads && data !== undefined) {
                output(options, message, data);
            } else {
                output(options, message);
            }
        },
    };
}

/**
 * Format an event as a single string (for tests or custom handlers).
 */
export function formatDebugEvent(event: PcoEvent, includePayloads = false): string {
    return formatEvent(event, includePayloads);
}
