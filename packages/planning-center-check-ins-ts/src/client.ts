/**
 * Check-ins API client. Use this to access events, check-ins, locations, event times,
 * stations, labels, options, and related resources. Create with PcoCheckInsClientConfig;
 * use module methods (e.g. events.getById, checkIns.getAll) for typed requests.
 */

import type { PcoCheckInsClientConfig } from './types/client';
import { PcoHttpClient, PaginationHelper } from '@rachelallyson/planning-center-base-ts';
import { EventsModule } from './modules/events';
import { CheckInsModule } from './modules/check-ins';
import { LocationsModule } from './modules/locations';
import { EventTimesModule } from './modules/event-times';
import { StationsModule } from './modules/stations';
import { LabelsModule } from './modules/labels';
import { OptionsModule } from './modules/options';
import { CheckInGroupsModule } from './modules/check-in-groups';
import { PreChecksModule } from './modules/pre-checks';
import { PassesModule } from './modules/passes';
import { HeadcountsModule } from './modules/headcounts';
import { AttendanceTypesModule } from './modules/attendance-types';
import { RosterListPersonsModule } from './modules/roster-list-persons';
import { OrganizationModule } from './modules/organization';
import { IntegrationLinksModule } from './modules/integration-links';
import { ThemesModule } from './modules/themes';

export class PcoCheckInsClient {
    public events: EventsModule;
    public checkIns: CheckInsModule;
    public locations: LocationsModule;
    public eventTimes: EventTimesModule;
    public stations: StationsModule;
    public labels: LabelsModule;
    public options: OptionsModule;
    public checkInGroups: CheckInGroupsModule;
    public preChecks: PreChecksModule;
    public passes: PassesModule;
    public headcounts: HeadcountsModule;
    public attendanceTypes: AttendanceTypesModule;
    public rosterListPersons: RosterListPersonsModule;
    public organization: OrganizationModule;
    public integrationLinks: IntegrationLinksModule;
    public themes: ThemesModule;

    private httpClient: PcoHttpClient;
    private paginationHelper: PaginationHelper;
    private config: PcoCheckInsClientConfig;

    constructor(config: PcoCheckInsClientConfig) {
        const { baseUrl, ...restConfig } = config;
        this.config = config;
        const fullConfig = {
            ...restConfig,
            baseURL: baseUrl || 'https://api.planningcenteronline.com/check-ins/v2',
        };
        this.httpClient = new PcoHttpClient(fullConfig);
        this.paginationHelper = new PaginationHelper(this.httpClient);

        const getConfig = () => this.getConfig();
        this.events = new EventsModule(this.httpClient, this.paginationHelper, getConfig);
        this.checkIns = new CheckInsModule(this.httpClient, this.paginationHelper, getConfig);
        this.locations = new LocationsModule(this.httpClient, this.paginationHelper, getConfig);
        this.eventTimes = new EventTimesModule(this.httpClient, this.paginationHelper, getConfig);
        this.stations = new StationsModule(this.httpClient, this.paginationHelper, getConfig);
        this.labels = new LabelsModule(this.httpClient, this.paginationHelper, getConfig);
        this.options = new OptionsModule(this.httpClient, this.paginationHelper, getConfig);
        this.checkInGroups = new CheckInGroupsModule(this.httpClient, this.paginationHelper, getConfig);
        this.preChecks = new PreChecksModule(this.httpClient, this.paginationHelper, getConfig);
        this.passes = new PassesModule(this.httpClient, this.paginationHelper, getConfig);
        this.headcounts = new HeadcountsModule(this.httpClient, this.paginationHelper, getConfig);
        this.attendanceTypes = new AttendanceTypesModule(this.httpClient, this.paginationHelper, getConfig);
        this.rosterListPersons = new RosterListPersonsModule(this.httpClient, this.paginationHelper, getConfig);
        this.organization = new OrganizationModule(this.httpClient, this.paginationHelper, getConfig);
        this.integrationLinks = new IntegrationLinksModule(this.httpClient, this.paginationHelper, getConfig);
        this.themes = new ThemesModule(this.httpClient, this.paginationHelper, getConfig);
    }

    getConfig(): PcoCheckInsClientConfig {
        return { ...this.config };
    }

    updateConfig(updates: Partial<PcoCheckInsClientConfig>): void {
        this.config = { ...this.config, ...updates };
        const { baseUrl, ...restConfig } = this.config;
        const fullConfig = {
            ...restConfig,
            baseURL: baseUrl || 'https://api.planningcenteronline.com/check-ins/v2',
        };
        this.httpClient = new PcoHttpClient(fullConfig);
        this.paginationHelper = new PaginationHelper(this.httpClient);
        this.updateModules();
    }

    getRateLimitInfo() {
        return this.httpClient.getRateLimitInfo();
    }

    private updateModules(): void {
        const getConfig = () => this.getConfig();
        this.events = new EventsModule(this.httpClient, this.paginationHelper, getConfig);
        this.checkIns = new CheckInsModule(this.httpClient, this.paginationHelper, getConfig);
        this.locations = new LocationsModule(this.httpClient, this.paginationHelper, getConfig);
        this.eventTimes = new EventTimesModule(this.httpClient, this.paginationHelper, getConfig);
        this.stations = new StationsModule(this.httpClient, this.paginationHelper, getConfig);
        this.labels = new LabelsModule(this.httpClient, this.paginationHelper, getConfig);
        this.options = new OptionsModule(this.httpClient, this.paginationHelper, getConfig);
        this.checkInGroups = new CheckInGroupsModule(this.httpClient, this.paginationHelper, getConfig);
        this.preChecks = new PreChecksModule(this.httpClient, this.paginationHelper, getConfig);
        this.passes = new PassesModule(this.httpClient, this.paginationHelper, getConfig);
        this.headcounts = new HeadcountsModule(this.httpClient, this.paginationHelper, getConfig);
        this.attendanceTypes = new AttendanceTypesModule(this.httpClient, this.paginationHelper, getConfig);
        this.rosterListPersons = new RosterListPersonsModule(this.httpClient, this.paginationHelper, getConfig);
        this.organization = new OrganizationModule(this.httpClient, this.paginationHelper, getConfig);
        this.integrationLinks = new IntegrationLinksModule(this.httpClient, this.paginationHelper, getConfig);
        this.themes = new ThemesModule(this.httpClient, this.paginationHelper, getConfig);
    }
}

