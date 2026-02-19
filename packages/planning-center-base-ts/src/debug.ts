import type { PcoClientConfig, PcoDebugOptions } from './config';

const DEFAULT_PREFIX = '[PCO]';

function normalize(debug: boolean | PcoDebugOptions | undefined): PcoDebugOptions | null {
  if (!debug) return null;
  if (debug === true) return { prefix: DEFAULT_PREFIX, includePayloads: false };
  return {
    prefix: debug.prefix ?? DEFAULT_PREFIX,
    includePayloads: debug.includePayloads ?? false,
    onLog: debug.onLog,
  };
}

function output(opts: PcoDebugOptions, line: string, data?: object): void {
  const payload = opts.includePayloads ? data : undefined;
  if (opts.onLog) opts.onLog(line, payload);
  else if (payload !== undefined) console.log(line, payload);
  else console.log(line);
}

/** Create a debug logger from client config. Returns { enabled, log }; log no-ops when debug is off. */
export function createDebugLogger(config: { debug?: boolean | PcoDebugOptions } | null | undefined): {
  log: (message: string, data?: object) => void;
  enabled: boolean;
} {
  const opts = normalize(config?.debug);
  return {
    enabled: opts !== null,
    log(message: string, data?: object) {
      if (!opts) return;
      output(opts, `${opts.prefix} ${message}`, data);
    },
  };
}

/** Log outbound request (when config.debug is set). */
export function logRequestStart(
  config: PcoClientConfig | null | undefined,
  data: { method: string; endpoint: string; requestId: string; params?: Record<string, string | number | boolean | undefined | null> },
): void {
  const opts = normalize(config?.debug);
  if (!opts) return;
  output(opts, `→ ${data.method} ${data.endpoint} ${data.requestId}`, opts.includePayloads ? data : undefined);
}

/** Log request completion (when config.debug is set). */
export function logRequestComplete(
  config: PcoClientConfig | null | undefined,
  data: { method: string; endpoint: string; status: number; duration: number; requestId: string },
): void {
  const opts = normalize(config?.debug);
  if (!opts) return;
  output(opts, `← ${data.method} ${data.endpoint} ${data.status} ${data.duration}ms`);
}

/** Log request error (when config.debug is set). */
export function logRequestError(
  config: PcoClientConfig | null | undefined,
  data: { method: string; endpoint: string; requestId: string; error: Error },
): void {
  const opts = normalize(config?.debug);
  if (!opts) return;
  const line = `✗ ${data.method} ${data.endpoint} ${data.error.message}`;
  if (opts.onLog) opts.onLog(line);
  else console.error(line);
}
