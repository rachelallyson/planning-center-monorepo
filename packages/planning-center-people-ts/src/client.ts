/**
 * v2.0.0 Main PcoClient Class
 */

import type { PeopleClientConfig } from './types/client';
import type {
    EventEmitter as BaseEventEmitter,
    PcoEvent,
    EventHandler,
    EventType,
    EventRequestStartEvent,
    EventRequestCompleteEvent,
    RequestErrorEvent,
    AuthSuccessEvent,
    EventAuthFailureEvent,
    AuthRefreshEvent,
    EventRateLimitEvent,
    RateAvailableEvent,
    CacheHitEvent,
    CacheMissEvent,
    CacheSetEvent,
    CacheInvalidateEvent,
    EventErrorEvent,
} from '@rachelallyson/planning-center-base-ts';
import {
    PcoEventEmitter,
    PcoHttpClient,
    PaginationHelper,
    BatchExecutor,
    attachDebugListener,
    createDebugLogger,
} from '@rachelallyson/planning-center-base-ts';
import type { PcoDebugListenable } from '@rachelallyson/planning-center-base-ts';
import { PeopleModule } from './modules/people';
import { FieldsModule } from './modules/fields';
import { WorkflowsModule } from './modules/workflows';
import { ContactsModule } from './modules/contacts';
import { HouseholdsModule } from './modules/households';
import { NotesModule } from './modules/notes';
import { ListsModule } from './modules/lists';
import { CampusModule } from './modules/campus';
import { ServiceTimeModule } from './modules/service-time';
import { FormsModule } from './modules/forms';
import { ReportsModule } from './modules/reports';

export class PcoClient implements BaseEventEmitter {
    public people: PeopleModule;
    public fields: FieldsModule;
    public workflows: WorkflowsModule;
    public contacts: ContactsModule;
    public households: HouseholdsModule;
    public notes: NotesModule;
    public lists: ListsModule;
    public campus: CampusModule;
    public serviceTime: ServiceTimeModule;
    public forms: FormsModule;
    public reports: ReportsModule;
    public batch: BatchExecutor;

    private httpClient: PcoHttpClient;
    private paginationHelper: PaginationHelper;
    private eventEmitter: PcoEventEmitter;
    private config: PeopleClientConfig;
    private debugUnsubscribe: (() => void) | null = null;

    constructor(config: PeopleClientConfig) {
        this.config = config;
        this.eventEmitter = new PcoEventEmitter();
        this.httpClient = new PcoHttpClient(config, this.eventEmitter);
        this.paginationHelper = new PaginationHelper(this.httpClient, () => this.getConfig());

        // Initialize modules
        this.people = new PeopleModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.fields = new FieldsModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.workflows = new WorkflowsModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.contacts = new ContactsModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.households = new HouseholdsModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.notes = new NotesModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.lists = new ListsModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.campus = new CampusModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.serviceTime = new ServiceTimeModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.forms = new FormsModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.reports = new ReportsModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.batch = new BatchExecutor(this, this.eventEmitter);

        // Debug: subscribe to all events when debug is enabled (listener checks config each time so runtime toggle works)
        if (config.debug) {
            this.debugUnsubscribe = attachDebugListener(this as unknown as PcoDebugListenable, () => this.config);
            createDebugLogger(config).log('client  debug enabled', { eventListener: true });
        }
    }

    // EventEmitter implementation - overloads for proper type narrowing
    on(eventType: 'request:start', handler: EventHandler<EventRequestStartEvent>): void;
    on(eventType: 'request:complete', handler: EventHandler<EventRequestCompleteEvent>): void;
    on(eventType: 'request:error', handler: EventHandler<RequestErrorEvent>): void;
    on(eventType: 'auth:success', handler: EventHandler<AuthSuccessEvent>): void;
    on(eventType: 'auth:failure', handler: EventHandler<EventAuthFailureEvent>): void;
    on(eventType: 'auth:refresh', handler: EventHandler<AuthRefreshEvent>): void;
    on(eventType: 'rate:limit', handler: EventHandler<EventRateLimitEvent>): void;
    on(eventType: 'rate:available', handler: EventHandler<RateAvailableEvent>): void;
    on(eventType: 'cache:hit', handler: EventHandler<CacheHitEvent>): void;
    on(eventType: 'cache:miss', handler: EventHandler<CacheMissEvent>): void;
    on(eventType: 'cache:set', handler: EventHandler<CacheSetEvent>): void;
    on(eventType: 'cache:invalidate', handler: EventHandler<CacheInvalidateEvent>): void;
    on(eventType: 'error', handler: EventHandler<EventErrorEvent>): void;
    on<T extends PcoEvent>(eventType: T['type'], handler: EventHandler<T>): void {
        // TypeScript can't narrow T['type'] to specific literal types, but the runtime types match
        // The overloads above handle the specific cases, this is for dynamic usage
        (this.eventEmitter as BaseEventEmitter).on(eventType, handler);
    }

    off(eventType: 'request:start', handler: EventHandler<EventRequestStartEvent>): void;
    off(eventType: 'request:complete', handler: EventHandler<EventRequestCompleteEvent>): void;
    off(eventType: 'request:error', handler: EventHandler<RequestErrorEvent>): void;
    off(eventType: 'auth:success', handler: EventHandler<AuthSuccessEvent>): void;
    off(eventType: 'auth:failure', handler: EventHandler<EventAuthFailureEvent>): void;
    off(eventType: 'auth:refresh', handler: EventHandler<AuthRefreshEvent>): void;
    off(eventType: 'rate:limit', handler: EventHandler<EventRateLimitEvent>): void;
    off(eventType: 'rate:available', handler: EventHandler<RateAvailableEvent>): void;
    off(eventType: 'cache:hit', handler: EventHandler<CacheHitEvent>): void;
    off(eventType: 'cache:miss', handler: EventHandler<CacheMissEvent>): void;
    off(eventType: 'cache:set', handler: EventHandler<CacheSetEvent>): void;
    off(eventType: 'cache:invalidate', handler: EventHandler<CacheInvalidateEvent>): void;
    off(eventType: 'error', handler: EventHandler<EventErrorEvent>): void;
    off<T extends PcoEvent>(eventType: T['type'], handler: EventHandler<T>): void {
        // TypeScript can't narrow T['type'] to specific literal types, but the runtime types match
        // The overloads above handle the specific cases, this is for dynamic usage
        (this.eventEmitter as BaseEventEmitter).off(eventType, handler);
    }

    emit<T extends PcoEvent>(event: T): void {
        this.eventEmitter.emit(event);
    }

    /**
     * Get the current configuration
     */
    getConfig(): PeopleClientConfig {
        return { ...this.config };
    }

    /**
     * Update the configuration
     */
    updateConfig(updates: Partial<PeopleClientConfig>): void {
        const hadDebug = Boolean(this.config.debug);
        this.config = { ...this.config, ...updates };
        const hasDebug = Boolean(this.config.debug);

        const logger = createDebugLogger(this.config);
        if (logger.enabled) logger.log('client.updateConfig', { updates });

        // Attach or detach debug listener when debug is toggled
        if (hadDebug && !hasDebug && this.debugUnsubscribe) {
            this.debugUnsubscribe();
            this.debugUnsubscribe = null;
        } else if (!hadDebug && hasDebug) {
            this.debugUnsubscribe = attachDebugListener(this as unknown as PcoDebugListenable, () => this.config);
        }

        // Recreate HTTP client with new config
        this.httpClient = new PcoHttpClient(this.config, this.eventEmitter);
        this.paginationHelper = new PaginationHelper(this.httpClient, () => this.getConfig());

        // Update modules with new HTTP client
        this.updateModules();
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return this.httpClient.getPerformanceMetrics();
    }

    /**
     * Get rate limit information
     */
    getRateLimitInfo() {
        return this.httpClient.getRateLimitInfo();
    }

    /**
     * Clear all event listeners
     */
    removeAllListeners(eventType?: EventType): void {
        this.eventEmitter.removeAllListeners(eventType);
    }

    /**
     * Get the number of listeners for an event type
     */
    listenerCount(eventType: EventType): number {
        return this.eventEmitter.listenerCount(eventType);
    }

    /**
     * Get all registered event types
     */
    eventTypes(): EventType[] {
        return this.eventEmitter.eventTypes();
    }


    private updateModules(): void {
        // Recreate modules with new HTTP client
        this.people = new PeopleModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.fields = new FieldsModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.workflows = new WorkflowsModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.contacts = new ContactsModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.households = new HouseholdsModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.notes = new NotesModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.lists = new ListsModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.campus = new CampusModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.serviceTime = new ServiceTimeModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.forms = new FormsModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.reports = new ReportsModule(this.httpClient, this.paginationHelper, this.eventEmitter, () => this.getConfig());
        this.batch = new BatchExecutor(this, this.eventEmitter);
    }
}
