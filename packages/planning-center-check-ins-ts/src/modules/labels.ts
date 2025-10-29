/**
 * Labels Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { 
    PcoHttpClient, 
    PaginationHelper, 
    PcoEventEmitter,
} from '@rachelallyson/planning-center-base-ts';
import type {
    LabelResource,
    EventLabelResource,
    LocationLabelResource,
} from '../types';

export interface LabelsListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class LabelsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all labels with optional filtering
     */
    async getAll(options: LabelsListOptions = {}): Promise<{ data: LabelResource[]; meta?: any; links?: any }> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }

        if (options.include) {
            params.include = options.include.join(',');
        }

        if (options.perPage) {
            params.per_page = options.perPage;
        }

        if (options.page) {
            params.page = options.page;
        }

        return this.getList<LabelResource>('/check-ins/v2/labels', params);
    }

    /**
     * Get a single label by ID
     */
    async getById(id: string, include?: string[]): Promise<LabelResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<LabelResource>(`/check-ins/v2/labels/${id}`, params);
    }

    // ===== Event Labels =====

    /**
     * Get all event labels
     */
    async getEventLabels(options: LabelsListOptions = {}): Promise<{ data: EventLabelResource[]; meta?: any; links?: any }> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }

        if (options.include) {
            params.include = options.include.join(',');
        }

        if (options.perPage) {
            params.per_page = options.perPage;
        }

        if (options.page) {
            params.page = options.page;
        }

        return this.getList<EventLabelResource>('/check-ins/v2/event_labels', params);
    }

    /**
     * Get a single event label by ID
     */
    async getEventLabelById(id: string, include?: string[]): Promise<EventLabelResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<EventLabelResource>(`/check-ins/v2/event_labels/${id}`, params);
    }

    // ===== Location Labels =====

    /**
     * Get all location labels
     */
    async getLocationLabels(options: LabelsListOptions = {}): Promise<{ data: LocationLabelResource[]; meta?: any; links?: any }> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }

        if (options.include) {
            params.include = options.include.join(',');
        }

        if (options.perPage) {
            params.per_page = options.perPage;
        }

        if (options.page) {
            params.page = options.page;
        }

        return this.getList<LocationLabelResource>('/check-ins/v2/location_labels', params);
    }

    /**
     * Get a single location label by ID
     */
    async getLocationLabelById(id: string, include?: string[]): Promise<LocationLabelResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<LocationLabelResource>(`/check-ins/v2/location_labels/${id}`, params);
    }
}

