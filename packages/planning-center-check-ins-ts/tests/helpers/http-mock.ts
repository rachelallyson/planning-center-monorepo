import type { PcoHttpClient } from '@rachelallyson/planning-center-base-ts';

export interface CapturedRequest {
  method: string;
  endpoint: string;
  params?: Record<string, unknown>;
  data?: unknown;
}

export function createHttpClientMock() {
  const calls: CapturedRequest[] = [];

  const httpClient: Partial<PcoHttpClient> = {
    request: jest.fn(async (req: any) => {
      calls.push({
        method: req.method,
        endpoint: req.endpoint,
        params: req.params,
        data: req.data,
      });
      // Return minimal JSON:API envelope
      return { status: 200, data: { data: [], links: {}, meta: {} }, duration: 0, requestId: 'test' } as any;
    }),
  };

  return { httpClient: httpClient as PcoHttpClient, calls };
}



