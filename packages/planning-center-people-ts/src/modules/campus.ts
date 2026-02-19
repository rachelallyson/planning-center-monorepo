import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type { CampusGetPageOptions, CampusGetAllOptions, CampusGetByIdOptions, CampusGetListsOptions, CampusGetServiceTimesOptions } from '../types/api-options';

/**
 * Campus module for managing campus-related operations
 */
export class CampusModule extends BaseModule {
    async getAll(params?: CampusGetAllOptions) {
        return this.getAllPages<Types.CampusResource>('/campuses', params);
    }

    async getPage(params?: CampusGetPageOptions) {
        return this.getList<Types.CampusResource, CampusGetPageOptions>('/campuses', params);
    }

    async getById(id: string, options?: CampusGetByIdOptions) {
        return this.getSingle<Types.CampusResource>(`/campuses/${id}`, options);
    }

    async create(data: Types.CampusAttributes) {
        return this.createResource<Types.CampusResource>('/campuses', data);
    }

    async update(id: string, data: Partial<Types.CampusAttributes>) {
        return this.updateResource<Types.CampusResource>(`/campuses/${id}`, data);
    }

    async delete(id: string) {
        return this.deleteResource(`/campuses/${id}`);
    }

    async getLists(campusId: string, params?: CampusGetListsOptions) {
        return this.getList<Types.ListResource, CampusGetListsOptions>(`/campuses/${campusId}/lists`, params);
    }

    async getServiceTimes(campusId: string, params?: CampusGetServiceTimesOptions) {
        return this.getList<Types.ServiceTimeResource, CampusGetServiceTimesOptions>(`/campuses/${campusId}/service_times`, params);
    }
}
