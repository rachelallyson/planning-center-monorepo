/**
 * AttendanceTypes Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoEventEmitter,
    PaginationResult,
    Meta,
    TopLevelLinks,
} from '@rachelallyson/planning-center-base-ts';
import type { AttendanceTypeResource, FlattenedAttendanceTypeResource } from '../types';

export interface AttendanceTypesListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class AttendanceTypesModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all attendance types across all pages with optional filtering.
     * Use getPage() when you need a single page or custom perPage/page.
     */
    async getAll(options: AttendanceTypesListOptions = {}): Promise<PaginationResult<AttendanceTypeResource>> {
        const params = this.buildParams(options);
        return this.getAllPages<AttendanceTypeResource>('/attendance_types', params);
    }

    /**
     * Get a single page of attendance types with optional filtering and pagination.
     */
    async getPage(options: AttendanceTypesListOptions = {}): Promise<{ data: FlattenedAttendanceTypeResource[]; meta?: Meta; links?: TopLevelLinks }> {
        const params = this.buildParams(options);
        return this.getList<AttendanceTypeResource>('/attendance_types', params);
    }

    private buildParams(options: AttendanceTypesListOptions): Record<string, any> {
        const params: Record<string, any> = {};
        if (options.where) Object.entries(options.where).forEach(([k, v]) => { params[`where[${k}]`] = v; });
        if (options.include) params.include = options.include.join(',');
        if (options.perPage != null) params.per_page = options.perPage;
        if (options.page != null) params.page = options.page;
        return params;
    }

    /**
     * Get a single attendance type by ID
     */
    async getById(id: string, include?: string[]): Promise<FlattenedAttendanceTypeResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<AttendanceTypeResource>(`/attendance_types/${id}`, params);
    }
}

