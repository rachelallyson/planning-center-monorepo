/**
 * People API client. Use this to access people, fields, workflows, contacts, households,
 * notes, lists, campus, service time, forms, and reports. Create with PeopleClientConfig;
 * use module methods (e.g. people.getById, people.getAll, people.getPage) for typed requests.
 */

import type { PeopleClientConfig } from './types/client';
import {
    PcoHttpClient,
    PaginationHelper,
    createDebugLogger,
} from '@rachelallyson/planning-center-base-ts';
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

export class PcoClient {
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

    private httpClient: PcoHttpClient;
    private paginationHelper: PaginationHelper;
    private config: PeopleClientConfig;

    constructor(config: PeopleClientConfig) {
        this.config = config;
        this.httpClient = new PcoHttpClient(config);
        this.paginationHelper = new PaginationHelper(this.httpClient, () => this.getConfig());

        this.people = new PeopleModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.fields = new FieldsModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.workflows = new WorkflowsModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.contacts = new ContactsModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.households = new HouseholdsModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.notes = new NotesModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.lists = new ListsModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.campus = new CampusModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.serviceTime = new ServiceTimeModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.forms = new FormsModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.reports = new ReportsModule(this.httpClient, this.paginationHelper, () => this.getConfig());

        if (config.debug) {
            createDebugLogger(config).log('client  debug enabled', {});
        }
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
        this.config = { ...this.config, ...updates };

        const logger = createDebugLogger(this.config);
        if (logger.enabled) logger.log('client.updateConfig', { updates });

        this.httpClient = new PcoHttpClient(this.config);
        this.paginationHelper = new PaginationHelper(this.httpClient, () => this.getConfig());

        this.updateModules();
    }

    /**
     * Get rate limit information
     */
    getRateLimitInfo() {
        return this.httpClient.getRateLimitInfo();
    }

    private updateModules(): void {
        this.people = new PeopleModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.fields = new FieldsModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.workflows = new WorkflowsModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.contacts = new ContactsModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.households = new HouseholdsModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.notes = new NotesModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.lists = new ListsModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.campus = new CampusModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.serviceTime = new ServiceTimeModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.forms = new FormsModule(this.httpClient, this.paginationHelper, () => this.getConfig());
        this.reports = new ReportsModule(this.httpClient, this.paginationHelper, () => this.getConfig());
    }
}
