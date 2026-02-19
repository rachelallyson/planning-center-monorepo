/**
 * AttendanceTypes Module for Check-Ins API
 * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/attendance_type
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoClientConfig,
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type {
    AttendanceTypeGetByIdOptions,
    AttendanceTypesGetAllOptions,
    AttendanceTypesGetPageOptions,
} from '../types/api-options';

/** Attendance types: getPage, getById. */
export class AttendanceTypesModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, getConfig);
    }

    /**
     * Get all attendance types across all pages with optional filtering.
     * Use getPage() when you need a single page or custom per_page/page.
     */
    async getAll(options?: AttendanceTypesGetAllOptions) {
        return this.getAllPages<Types.AttendanceTypeResource, AttendanceTypesGetAllOptions>('/attendance_types', options);
    }

    /**
     * Get a single page of attendance types with optional filtering and pagination.
     */
    async getPage(options?: AttendanceTypesGetPageOptions) {
        return this.getList<Types.AttendanceTypeResource, AttendanceTypesGetPageOptions>('/attendance_types', options);
    }

    /**
     * Get a single attendance type by ID. Can Include: event.
     */
    async getById(id: string, options?: AttendanceTypeGetByIdOptions) {
        return this.getSingle<Types.AttendanceTypeResource>(`/attendance_types/${id}`, options);
    }
}
