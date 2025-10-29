/**
 * v1.0.0 Main PcoCheckInsClient Class
 */

import type { PcoCheckInsClientConfig } from './types/client';
import type { EventEmitter, PcoEvent, EventHandler, EventType } from '@rachelallyson/planning-center-base-ts';
import { 
    PcoEventEmitter, 
    PcoHttpClient, 
    PaginationHelper, 
    BatchExecutor 
} from '@rachelallyson/planning-center-base-ts';
import { EventsModule } from './modules/events';
import { CheckInsModule } from './modules/check-ins';
import { LocationsModule } from './modules/locations';
import { EventPeriodsModule } from './modules/event-periods';
import { EventTimesModule } from './modules/event-times';
import { StationsModule } from './modules/stations';
import { LabelsModule } from './modules/labels';
import { OptionsModule } from './modules/options';
import { CheckInGroupsModule } from './modules/check-in-groups';
import { CheckInTimesModule } from './modules/check-in-times';
import { PersonEventsModule } from './modules/person-events';
import { PreChecksModule } from './modules/pre-checks';
import { PassesModule } from './modules/passes';
import { HeadcountsModule } from './modules/headcounts';
import { AttendanceTypesModule } from './modules/attendance-types';
import { RosterListPersonsModule } from './modules/roster-list-persons';
import { OrganizationModule } from './modules/organization';
import { IntegrationLinksModule } from './modules/integration-links';
import { ThemesModule } from './modules/themes';

export class PcoCheckInsClient implements EventEmitter {
    public events: EventsModule;
    public checkIns: CheckInsModule;
    public locations: LocationsModule;
    public eventPeriods: EventPeriodsModule;
    public eventTimes: EventTimesModule;
    public stations: StationsModule;
    public labels: LabelsModule;
    public options: OptionsModule;
    public checkInGroups: CheckInGroupsModule;
    public checkInTimes: CheckInTimesModule;
    public personEvents: PersonEventsModule;
    public preChecks: PreChecksModule;
    public passes: PassesModule;
    public headcounts: HeadcountsModule;
    public attendanceTypes: AttendanceTypesModule;
    public rosterListPersons: RosterListPersonsModule;
    public organization: OrganizationModule;
    public integrationLinks: IntegrationLinksModule;
    public themes: ThemesModule;
    public batch: BatchExecutor;

    private httpClient: PcoHttpClient;
    private paginationHelper: PaginationHelper;
    private eventEmitter: PcoEventEmitter;
    private config: PcoCheckInsClientConfig;

    constructor(config: PcoCheckInsClientConfig) {
        // Set default base URL for check-ins API
        const { baseUrl, ...restConfig } = config;
        const fullConfig: any = {
            ...restConfig,
            baseURL: baseUrl || 'https://api.planningcenteronline.com',
        };

        this.config = config;
        this.eventEmitter = new PcoEventEmitter();
        this.httpClient = new PcoHttpClient(fullConfig, this.eventEmitter);
        this.paginationHelper = new PaginationHelper(this.httpClient);

        // Initialize modules
        this.events = new EventsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.checkIns = new CheckInsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.locations = new LocationsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.eventPeriods = new EventPeriodsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.eventTimes = new EventTimesModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.stations = new StationsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.labels = new LabelsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.options = new OptionsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.checkInGroups = new CheckInGroupsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.checkInTimes = new CheckInTimesModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.personEvents = new PersonEventsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.preChecks = new PreChecksModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.passes = new PassesModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.headcounts = new HeadcountsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.attendanceTypes = new AttendanceTypesModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.rosterListPersons = new RosterListPersonsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.organization = new OrganizationModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.integrationLinks = new IntegrationLinksModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.themes = new ThemesModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.batch = new BatchExecutor(this, this.eventEmitter);

        // Set up event handlers from config
        this.setupEventHandlers();
    }

    // EventEmitter implementation
    on<T extends PcoEvent>(eventType: T['type'], handler: EventHandler<T>): void {
        this.eventEmitter.on(eventType, handler);
    }

    off<T extends PcoEvent>(eventType: T['type'], handler: EventHandler<T>): void {
        this.eventEmitter.off(eventType, handler);
    }

    emit<T extends PcoEvent>(event: T): void {
        this.eventEmitter.emit(event);
    }

    /**
     * Get the current configuration
     */
    getConfig(): PcoCheckInsClientConfig {
        return { ...this.config };
    }

    /**
     * Update the configuration
     */
    updateConfig(updates: Partial<PcoCheckInsClientConfig>): void {
        this.config = { ...this.config, ...updates };
        
        const { baseUrl, ...restConfig } = this.config;
        const fullConfig: any = {
            ...restConfig,
            baseURL: baseUrl || 'https://api.planningcenteronline.com',
        };
        
        // Recreate HTTP client with new config
        this.httpClient = new PcoHttpClient(fullConfig, this.eventEmitter);
        this.paginationHelper = new PaginationHelper(this.httpClient);

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

    private setupEventHandlers(): void {
        // Set up config event handlers from events config
        if (this.config.events?.onError) {
            this.on('error', this.config.events.onError as any);
        }

        if (this.config.events?.onAuthFailure) {
            this.on('auth:failure', this.config.events.onAuthFailure as any);
        }

        if (this.config.events?.onRequestStart) {
            this.on('request:start', this.config.events.onRequestStart as any);
        }

        if (this.config.events?.onRequestComplete) {
            this.on('request:complete', this.config.events.onRequestComplete as any);
        }

        if (this.config.events?.onRateLimit) {
            this.on('rate:limit', this.config.events.onRateLimit as any);
        }
    }

    private updateModules(): void {
        // Recreate modules with new HTTP client
        this.events = new EventsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.checkIns = new CheckInsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.locations = new LocationsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.eventPeriods = new EventPeriodsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.eventTimes = new EventTimesModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.stations = new StationsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.labels = new LabelsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.options = new OptionsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.checkInGroups = new CheckInGroupsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.checkInTimes = new CheckInTimesModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.personEvents = new PersonEventsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.preChecks = new PreChecksModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.passes = new PassesModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.headcounts = new HeadcountsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.attendanceTypes = new AttendanceTypesModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.rosterListPersons = new RosterListPersonsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.organization = new OrganizationModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.integrationLinks = new IntegrationLinksModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.themes = new ThemesModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.batch = new BatchExecutor(this, this.eventEmitter);
    }
}

