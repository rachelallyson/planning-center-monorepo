/**
 * CheckIns Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { 
    PcoHttpClient, 
    PaginationHelper, 
    PcoEventEmitter,
} from '@rachelallyson/planning-center-base-ts';
import type {
    CheckInResource,
    CheckInGroupResource,
    CheckInTimeResource,
    StationResource,
    EventResource,
    EventPeriodResource,
    EventTimeResource,
    LocationResource,
    OptionResource,
} from '../types';

export interface CheckInsListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
    filter?: string[]; // attendee, checked_out, first_time, guest, not_checked_out, not_one_time_guest, one_time_guest, regular, volunteer
}

export class CheckInsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all check-ins with optional filtering
     */
    async getAll(options: CheckInsListOptions = {}): Promise<{ data: CheckInResource[]; meta?: any; links?: any }> {
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

        // Apply filters if provided
        if (options.filter && options.filter.length > 0) {
            options.filter.forEach(filter => {
                params[filter] = 'true';
            });
        }

        return this.getList<CheckInResource>('/check-ins/v2/check_ins', params);
    }

    /**
     * Get a single check-in by ID
     */
    async getById(id: string, include?: string[]): Promise<CheckInResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<CheckInResource>(`/check-ins/v2/check_ins/${id}`, params);
    }

    // ===== Associations =====

    /**
     * Get check-in group for a check-in
     */
    async getCheckInGroup(checkInId: string): Promise<CheckInGroupResource | null> {
        try {
            return await this.getSingle<CheckInGroupResource>(`/check-ins/v2/check_ins/${checkInId}/check_in_group`);
        } catch (error: any) {
            if (error?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Get check-in times for a check-in
     */
    async getCheckInTimes(checkInId: string): Promise<{ data: CheckInTimeResource[]; meta?: any; links?: any }> {
        return this.getList<CheckInTimeResource>(`/check-ins/v2/check_ins/${checkInId}/check_in_times`);
    }

    /**
     * Get station where check-in occurred (checked_in_at)
     */
    async getCheckedInAt(checkInId: string): Promise<StationResource | null> {
        try {
            return await this.getSingle<StationResource>(`/check-ins/v2/check_ins/${checkInId}/checked_in_at`);
        } catch (error: any) {
            if (error?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Get person who checked in (checked_in_by)
     */
    async getCheckedInBy(checkInId: string): Promise<any | null> {
        try {
            return await this.getSingle<any>(`/check-ins/v2/check_ins/${checkInId}/checked_in_by`);
        } catch (error: any) {
            if (error?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Get person who checked out (checked_out_by)
     */
    async getCheckedOutBy(checkInId: string): Promise<any | null> {
        try {
            return await this.getSingle<any>(`/check-ins/v2/check_ins/${checkInId}/checked_out_by`);
        } catch (error: any) {
            if (error?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Get event for a check-in
     */
    async getEvent(checkInId: string): Promise<EventResource> {
        return this.getSingle<EventResource>(`/check-ins/v2/check_ins/${checkInId}/event`);
    }

    /**
     * Get event period for a check-in
     */
    async getEventPeriod(checkInId: string): Promise<EventPeriodResource> {
        return this.getSingle<EventPeriodResource>(`/check-ins/v2/check_ins/${checkInId}/event_period`);
    }

    /**
     * Get event times for a check-in
     */
    async getEventTimes(checkInId: string): Promise<{ data: EventTimeResource[]; meta?: any; links?: any }> {
        return this.getList<EventTimeResource>(`/check-ins/v2/check_ins/${checkInId}/event_times`);
    }

    /**
     * Get locations for a check-in
     */
    async getLocations(checkInId: string): Promise<{ data: LocationResource[]; meta?: any; links?: any }> {
        return this.getList<LocationResource>(`/check-ins/v2/check_ins/${checkInId}/locations`);
    }

    /**
     * Get options for a check-in
     */
    async getOptions(checkInId: string): Promise<{ data: OptionResource[]; meta?: any; links?: any }> {
        return this.getList<OptionResource>(`/check-ins/v2/check_ins/${checkInId}/options`);
    }

    /**
     * Get person for a check-in
     */
    async getPerson(checkInId: string): Promise<any | null> {
        try {
            return await this.getSingle<any>(`/check-ins/v2/check_ins/${checkInId}/person`);
        } catch (error: any) {
            if (error?.status === 404) {
                return null;
            }
            throw error;
        }
    }
}

