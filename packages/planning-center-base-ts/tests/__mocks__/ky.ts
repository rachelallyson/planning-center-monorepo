/**
 * Minimal shared mock for ky (used by PcoHttpClient).
 * Used only by unit tests so they don't hit the network.
 * Returns basic JSON:API shapes: list -> { data: [one item] }, single -> { data: one resource }, 404 for id 999999999.
 *
 * Integration-style tests (tests/integration/, tests/modules/, matching scoring/multi-step) should run
 * WITHOUT this mock (real API) so failures indicate real bugs in application code.
 */

function getPath(input: string | URL | Request): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.pathname + input.search;
  try {
    const url = (input as Request).url;
    if (typeof url === 'string') return new URL(url).pathname;
  } catch {
    // ignore
  }
  return '';
}

function pathSegments(path: string): string[] {
  try {
    const u = path.startsWith('http') ? new URL(path) : { pathname: path };
    const p = 'pathname' in u ? u.pathname : path;
    return p.split('/').filter(Boolean);
  } catch {
    return path.split('/').filter(Boolean);
  }
}

function lastSegmentId(path: string): string | null {
  const segs = pathSegments(path);
  const last = segs[segs.length - 1];
  if (last == null) return null;
  if (/^\d+$/.test(last)) return last;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(last)) return last;
  return null;
}

function isListPath(path: string): boolean {
  return lastSegmentId(path) === null;
}

const NON_EXISTENT_IDS = new Set(['999999999', '999999']);

function createMockResponse(overrides?: { status?: number; data?: unknown }): Response {
  const data = overrides?.data ?? { data: { type: 'Person', id: '1', attributes: {} } };
  const status = overrides?.status ?? 200;
  return {
    ok: status < 400,
    status,
    statusText: status === 404 ? 'Not Found' : status === 204 ? 'No Content' : 'OK',
    headers: new Headers(),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    body: null,
    bodyUsed: false,
    url: '',
    redirected: false,
    type: 'basic',
    clone: () => createMockResponse(overrides),
  } as Response;
}

function inferType(path: string): string {
  const segs = pathSegments(path);
  const last = segs[segs.length - 1] ?? '';
  const segmentForType = lastSegmentId(path) != null && segs.length >= 2 ? (segs[segs.length - 2] ?? last) : last;
  if (segmentForType === 'people') return 'Person';
  if (segmentForType === 'campuses' || segmentForType === 'campus') return 'Campus';
  if (segmentForType === 'households') return 'Household';
  const pascal = segmentForType.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  if (pascal.length > 2 && pascal.endsWith('s')) return pascal.slice(0, -1);
  return pascal || 'Person';
}

function responseForGet(path: string): Response {
  const pathStr = getPath(path);
  const id = lastSegmentId(pathStr);
  if (id != null && NON_EXISTENT_IDS.has(id)) {
    return createMockResponse({ status: 404, data: { errors: [{ title: 'Not Found', status: '404' }] } });
  }
  // Singular sub-resource endpoints (e.g. GET /forms/1/category)
  const segs = pathSegments(pathStr);
  const last = segs[segs.length - 1] ?? '';
  if (segs.length >= 3 && last === 'category') {
    return createMockResponse({
      data: {
        data: {
          type: 'FormCategory',
          id: '1',
          attributes: { name: 'General' },
        },
      },
    });
  }
  if (isListPath(pathStr)) {
    const type = inferType(pathStr);
    const single =
      type === 'Person'
        ? { type, id: '1', attributes: { first_name: 'Test', last_name: 'User', status: 'active' } }
        : { type, id: '1', attributes: { name: 'Main' } };
    return createMockResponse({
      data: { data: [single], meta: { total_count: 1 }, links: { next: null, prev: null } },
    });
  }
  const resourceId = id ?? '1';
  const type = inferType(pathStr);
  const attrs = type === 'Person' ? { first_name: 'Test', last_name: 'User', status: 'active' } : { name: 'Main' };
  return createMockResponse({
    data: { data: { type, id: resourceId, attributes: attrs } },
  });
}

function bodyAttributes(body: unknown): Record<string, unknown> {
  if (body == null || typeof body !== 'object') return {};
  const b = body as { data?: { attributes?: Record<string, unknown> } };
  return (b.data?.attributes != null && typeof b.data.attributes === 'object') ? b.data.attributes : {};
}

function responseForPost(path: string, body?: unknown): Response {
  const pathStr = getPath(path);
  const type = inferType(pathStr);
  const attrs = bodyAttributes(body);
  return createMockResponse({ data: { data: { type, id: '1', attributes: attrs } } });
}

function responseForPatch(path: string, body?: unknown): Response {
  const pathStr = getPath(path);
  const id = lastSegmentId(pathStr) ?? '1';
  const type = inferType(pathStr);
  const attrs = bodyAttributes(body);
  return createMockResponse({ data: { data: { type, id, attributes: attrs } } });
}

function responseForDelete(_path: string): Response {
  return createMockResponse({ status: 204, data: {} });
}

const mockInstance = {
  get: jest.fn((input: string | URL | Request) => Promise.resolve(responseForGet(getPath(input)))),
  post: jest.fn((input: string | URL | Request, options?: { json?: unknown; body?: string }) => {
    const body = options?.json ?? (options?.body != null ? (() => { try { return JSON.parse(options.body as string); } catch { return undefined; } })() : undefined);
    return Promise.resolve(responseForPost(getPath(input), body));
  }),
  patch: jest.fn((input: string | URL | Request, options?: { json?: unknown; body?: string }) => {
    const body = options?.json ?? (options?.body != null ? (() => { try { return JSON.parse(options.body as string); } catch { return undefined; } })() : undefined);
    return Promise.resolve(responseForPatch(getPath(input), body));
  }),
  put: jest.fn((input: string | URL | Request, options?: { json?: unknown; body?: string }) => {
    const body = options?.json ?? (options?.body != null ? (() => { try { return JSON.parse(options.body as string); } catch { return undefined; } })() : undefined);
    return Promise.resolve(responseForPatch(getPath(input), body));
  }),
  delete: jest.fn((input: string | URL | Request) => Promise.resolve(responseForDelete(getPath(input)))),
  head: jest.fn(() => Promise.resolve(createMockResponse({ status: 200 }))),
  extend: jest.fn(function (this: typeof mockInstance) {
    return this;
  }),
};

const mockKy = jest.fn((input: string | URL | Request) => Promise.resolve(responseForGet(getPath(input))));
(mockKy as { create: () => typeof mockInstance }).create = () => mockInstance;
(mockKy as { extend: () => typeof mockKy }).extend = () => mockKy;

export default mockKy;
