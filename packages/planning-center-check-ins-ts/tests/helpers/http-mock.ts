import type { PcoHttpClient } from '@rachelallyson/planning-center-base-ts';

export interface CapturedRequest {
  method: string;
  endpoint: string;
  params?: Record<string, string | number | boolean>;
  data?: object;
}

/** Minimal request shape passed to PcoHttpClient.request */
interface MockRequestShape {
  method: string;
  endpoint: string;
  params?: Record<string, string | number | boolean>;
  data?: object;
}

function isPcoHttpClientLike(m: object): m is PcoHttpClient {
  return typeof Object.getOwnPropertyDescriptor(m, 'request')?.value === 'function';
}

export function createHttpClientMock(): { httpClient: PcoHttpClient; calls: CapturedRequest[] } {
  const calls: CapturedRequest[] = [];

  const mockRequest = jest.fn(async (req: MockRequestShape) => {
    calls.push({
      method: req.method,
      endpoint: req.endpoint,
      params: req.params,
      data: req.data,
    });
    // Return single-item data so getSingle/getById don't throw "Got empty data array"
    return { status: 200, data: { data: [{ id: 'mock-id', type: 'Event' }], links: {}, meta: {} }, headers: {}, duration: 0, requestId: 'test' };
  });

  const mock = { request: mockRequest };
  if (!isPcoHttpClientLike(mock)) throw new Error('Mock must have request method');
  return { httpClient: mock, calls };
}



