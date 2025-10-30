// Test setup for base package

// Mock fetch globally
global.fetch = jest.fn();

// Mock Headers
global.Headers = class Headers {
  private headers = new Map<string, string>();

  constructor(init?: HeadersInit) {
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.headers.set(key.toLowerCase(), value));
      } else if (init instanceof Headers) {
        init.forEach((value, key) => this.headers.set(key.toLowerCase(), value));
      } else {
        Object.entries(init).forEach(([key, value]) => this.headers.set(key.toLowerCase(), value));
      }
    }
  }

  get(name: string): string | null {
    return this.headers.get(name.toLowerCase()) || null;
  }

  set(name: string, value: string): void {
    this.headers.set(name.toLowerCase(), value);
  }

  has(name: string): boolean {
    return this.headers.has(name.toLowerCase());
  }

  delete(name: string): void {
    this.headers.delete(name.toLowerCase());
  }

  forEach(callback: (value: string, key: string) => void): void {
    this.headers.forEach(callback);
  }

  [Symbol.iterator]() {
    return this.headers[Symbol.iterator]();
  }
};

// Mock Response
global.Response = class Response {
  public ok: boolean;
  public status: number;
  public statusText: string;
  public headers: Headers;
  private _json: any;

  constructor(body: any, init: ResponseInit = {}) {
    this.ok = (init.status || 200) >= 200 && (init.status || 200) < 300;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Headers(init.headers);
    this._json = body;
  }

  async json(): Promise<any> {
    return Promise.resolve(this._json);
  }

  async text(): Promise<string> {
    return Promise.resolve(JSON.stringify(this._json));
  }
} as any;
