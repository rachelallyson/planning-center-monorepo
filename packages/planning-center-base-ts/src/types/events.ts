/**
 * v2.0.0 Event System Types
 */

export type EventType =
    | 'request:start'
    | 'request:complete'
    | 'request:error'
    | 'auth:success'
    | 'auth:failure'
    | 'auth:refresh'
    | 'rate:limit'
    | 'rate:available'
    | 'cache:hit'
    | 'cache:miss'
    | 'cache:set'
    | 'cache:invalidate'
    | 'error';

export interface BaseEvent {
    type: EventType;
    timestamp: string;
    requestId?: string;
}

export interface RequestStartEvent extends BaseEvent {
    type: 'request:start';
    endpoint: string;
    method: string;
    requestId: string;
}

export interface RequestCompleteEvent extends BaseEvent {
    type: 'request:complete';
    endpoint: string;
    method: string;
    status: number;
    duration: number;
    requestId: string;
}

export interface RequestErrorEvent extends BaseEvent {
    type: 'request:error';
    endpoint: string;
    method: string;
    error: Error;
    requestId: string;
}

export interface AuthSuccessEvent extends BaseEvent {
    type: 'auth:success';
    authType: 'oauth' | 'basic';
}

export interface AuthFailureEvent extends BaseEvent {
    type: 'auth:failure';
    authType: 'oauth' | 'basic';
    error: Error;
}

export interface AuthRefreshEvent extends BaseEvent {
    type: 'auth:refresh';
    authType: 'oauth';
    success: boolean;
}

export interface RateLimitEvent extends BaseEvent {
    type: 'rate:limit';
    limit: number;
    remaining: number;
    resetTime: string;
}

export interface RateAvailableEvent extends BaseEvent {
    type: 'rate:available';
    limit: number;
    remaining: number;
}

export interface CacheHitEvent extends BaseEvent {
    type: 'cache:hit';
    key: string;
}

export interface CacheMissEvent extends BaseEvent {
    type: 'cache:miss';
    key: string;
}

export interface CacheSetEvent extends BaseEvent {
    type: 'cache:set';
    key: string;
    ttl?: number;
}

export interface CacheInvalidateEvent extends BaseEvent {
    type: 'cache:invalidate';
    key: string;
}

export interface ErrorEvent extends BaseEvent {
    type: 'error';
    error: Error;
    operation: string;
    context?: Record<string, any>;
}

export type PcoEvent =
    | RequestStartEvent
    | RequestCompleteEvent
    | RequestErrorEvent
    | AuthSuccessEvent
    | AuthFailureEvent
    | AuthRefreshEvent
    | RateLimitEvent
    | RateAvailableEvent
    | CacheHitEvent
    | CacheMissEvent
    | CacheSetEvent
    | CacheInvalidateEvent
    | ErrorEvent;

export type EventHandler<T extends PcoEvent = PcoEvent> = (event: T) => void | Promise<void>;

export interface EventEmitter {
    // Overloads for each event type to enable proper type narrowing
    on(eventType: 'request:start', handler: EventHandler<RequestStartEvent>): void;
    on(eventType: 'request:complete', handler: EventHandler<RequestCompleteEvent>): void;
    on(eventType: 'request:error', handler: EventHandler<RequestErrorEvent>): void;
    on(eventType: 'auth:success', handler: EventHandler<AuthSuccessEvent>): void;
    on(eventType: 'auth:failure', handler: EventHandler<AuthFailureEvent>): void;
    on(eventType: 'auth:refresh', handler: EventHandler<AuthRefreshEvent>): void;
    on(eventType: 'rate:limit', handler: EventHandler<RateLimitEvent>): void;
    on(eventType: 'rate:available', handler: EventHandler<RateAvailableEvent>): void;
    on(eventType: 'cache:hit', handler: EventHandler<CacheHitEvent>): void;
    on(eventType: 'cache:miss', handler: EventHandler<CacheMissEvent>): void;
    on(eventType: 'cache:set', handler: EventHandler<CacheSetEvent>): void;
    on(eventType: 'cache:invalidate', handler: EventHandler<CacheInvalidateEvent>): void;
    on(eventType: 'error', handler: EventHandler<ErrorEvent>): void;
    // Fallback for dynamic event types
    on<T extends PcoEvent>(eventType: T['type'], handler: EventHandler<T>): void;

    off(eventType: 'request:start', handler: EventHandler<RequestStartEvent>): void;
    off(eventType: 'request:complete', handler: EventHandler<RequestCompleteEvent>): void;
    off(eventType: 'request:error', handler: EventHandler<RequestErrorEvent>): void;
    off(eventType: 'auth:success', handler: EventHandler<AuthSuccessEvent>): void;
    off(eventType: 'auth:failure', handler: EventHandler<AuthFailureEvent>): void;
    off(eventType: 'auth:refresh', handler: EventHandler<AuthRefreshEvent>): void;
    off(eventType: 'rate:limit', handler: EventHandler<RateLimitEvent>): void;
    off(eventType: 'rate:available', handler: EventHandler<RateAvailableEvent>): void;
    off(eventType: 'cache:hit', handler: EventHandler<CacheHitEvent>): void;
    off(eventType: 'cache:miss', handler: EventHandler<CacheMissEvent>): void;
    off(eventType: 'cache:set', handler: EventHandler<CacheSetEvent>): void;
    off(eventType: 'cache:invalidate', handler: EventHandler<CacheInvalidateEvent>): void;
    off(eventType: 'error', handler: EventHandler<ErrorEvent>): void;
    // Fallback for dynamic event types
    off<T extends PcoEvent>(eventType: T['type'], handler: EventHandler<T>): void;

    emit<T extends PcoEvent>(event: T): void;
}

