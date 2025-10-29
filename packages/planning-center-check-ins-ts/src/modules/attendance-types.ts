/**
 * AttendanceTypes Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { 
    PcoHttpClient, 
    PaginationHelper, 
    PcoEventEmitter,
} from '@rachelallyson/planning-center-base-ts';
import type {
    AttendanceTypeResource,
} from '../types';

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
     * Get all attendance types with optional filtering
     */
    async getAll(options: AttendanceTypesListOptions = {}): Promise<{ data: AttendanceTypeResource[]; meta?: any; links?: any }> {
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

        return this.getList<AttendanceTypeResource>('/check-ins/v2/attendance_types', params);
    }

    /**
     * Get a single attendance type by ID
     */
    async getById(id: string, include?: string[]): Promise<AttendanceTypeResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<AttendanceTypeResource>(`/check-ins/v2/attendance_types/${id}`, params);
    }
}

