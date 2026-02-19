/**
 * CheckIns Module for Check-Ins API
 * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/check_in
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoClientConfig,
    QueryOptions,
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type {
    CheckInGetByIdOptions,
    CheckInGetEventTimesGetPageOptions,
    CheckInsGetAllOptions,
    CheckInsGetPageOptions,
} from '../types/api-options';

/** Returns true if the error is an HTTP 404 (used for optional associations). */
function isNotFoundError(error: object): error is { status: 404 } {
  const desc = Object.getOwnPropertyDescriptor(error, 'status');
  const status = desc?.value;
  return status === 404;
}

/** Check-ins API: getAll, getPage, getById, create, update, delete, and nested event_times. */
export class CheckInsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, getConfig);
    }

    /**
     * Get all check-ins across all pages with optional filtering.
     * Use getPage() when you need a single page or custom per_page/page.
     */
    async getAll(options?: CheckInsGetAllOptions) {
        return this.getAllPages<Types.CheckInResource, CheckInsGetAllOptions>('/check_ins', options);
    }

    /**
     * Get a single page of check-ins with optional filtering and pagination.
     */
    async getPage(options?: CheckInsGetPageOptions) {
        return this.getList<Types.CheckInResource, CheckInsGetPageOptions>('/check_ins', options);
    }

    /**
     * Get a single check-in by ID. Can Include: check_in_times, checked_in_at, checked_in_by, checked_out_by, event, event_period, event_times, locations, options, person.
     */
    async getById(id: string, options?: CheckInGetByIdOptions) {
        return this.getSingle<Types.CheckInResource>(`/check_ins/${id}`, options);
    }

    // ===== Associations =====

    /**
     * Get check-in group for a check-in
     */
    async getCheckInGroup(checkInId: string) {
        return this.getSingleOrNull<Types.CheckInGroupResource>(`/check_ins/${checkInId}/check_in_group`);
    }

    /**
     * Get check-in times for a check-in
     */
    async getCheckInTimes(checkInId: string) {
        return this.getList<Types.CheckInTimeResource, QueryOptions>(`/check_ins/${checkInId}/check_in_times`);
    }

    /**
     * Get station where check-in occurred (checked_in_at)
     */
    async getCheckedInAt(checkInId: string) {
        return this.getSingleOrNull<Types.StationResource>(`/check_ins/${checkInId}/checked_in_at`);
    }

    /**
     * Get person who checked in (checked_in_by). Returns PersonStub; full Person type is in People API.
     */
    async getCheckedInBy(checkInId: string) {
        return this.getSingleOrNull<Types.PersonStub>(`/check_ins/${checkInId}/checked_in_by`);
    }

    /**
     * Get person who checked out (checked_out_by). Returns PersonStub; full Person type is in People API.
     */
    async getCheckedOutBy(checkInId: string) {
        return this.getSingleOrNull<Types.PersonStub>(`/check_ins/${checkInId}/checked_out_by`);
    }

    /**
     * Get event for a check-in
     */
    async getEvent(checkInId: string) {
        return this.getSingle<Types.EventResource>(`/check_ins/${checkInId}/event`);
    }

    /**
     * Get event period for a check-in
     */
    async getEventPeriod(checkInId: string) {
        return this.getSingle<Types.EventPeriodResource>(`/check_ins/${checkInId}/event_period`);
    }

    /**
     * Get event times for a check-in. Supports where, include, order, per_page, page.
     */
    async getEventTimes(checkInId: string, options?: CheckInGetEventTimesGetPageOptions) {
        return this.getList<Types.EventTimeResource, CheckInGetEventTimesGetPageOptions>(`/check_ins/${checkInId}/event_times`, options);
    }

    /**
     * Get locations for a check-in
     */
    async getLocations(checkInId: string) {
        return this.getList<Types.LocationResource, QueryOptions>(`/check_ins/${checkInId}/locations`);
    }

    /**
     * Get location labels for a check-in at a specific location.
     * Per API docs, location_labels are only available under check_ins, not under locations.
     * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/location_label
     */
    async getLocationLabels(checkInId: string, locationId: string) {
        return this.getList<Types.LocationLabelResource, QueryOptions>(`/check_ins/${checkInId}/locations/${locationId}/location_labels`);
    }

    /**
     * Get options for a check-in
     */
    async getOptions(checkInId: string) {
        return this.getList<Types.OptionResource, QueryOptions>(`/check_ins/${checkInId}/options`);
    }

    /**
     * Get person for a check-in. Returns PersonStub; full Person type is in People API.
     */
    async getPerson(checkInId: string) {
        return this.getSingleOrNull<Types.PersonStub>(`/check_ins/${checkInId}/person`);
    }

    /** GET single resource; returns null on 404. Used for optional associations. */
    private async getSingleOrNull<T>(endpoint: string): Promise<T | null> {
        try {
            return await this.getSingle<T>(endpoint);
        } catch (error) {
            if (error !== null && typeof error === 'object' && isNotFoundError(error)) return null;
            throw error;
        }
    }
}

