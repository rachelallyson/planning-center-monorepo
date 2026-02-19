/**
 * v2.0.0 Contacts Module
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';

/** Contacts API: emails, phone numbers, addresses (getPage, getById, create, update, delete). */
export class ContactsModule extends BaseModule {
    async getAllEmails() {
        return this.getList<Types.EmailResource>('/emails');
    }

    async getEmailById(id: string) {
        return this.getSingle<Types.EmailResource>(`/emails/${id}`);
    }

    async createEmail(personId: string, data: Types.EmailAttributes) {
        return this.createResource<Types.EmailResource>(`/people/${personId}/emails`, data);
    }

    async updateEmail(id: string, data: Partial<Types.EmailAttributes>) {
        return this.updateResource<Types.EmailResource>(`/emails/${id}`, data);
    }

    async deleteEmail(id: string) {
        return this.deleteResource(`/emails/${id}`);
    }

    async getAllPhoneNumbers() {
        return this.getList<Types.PhoneNumberResource>('/phone_numbers');
    }

    async getPhoneNumberById(id: string) {
        return this.getSingle<Types.PhoneNumberResource>(`/phone_numbers/${id}`);
    }

    async createPhoneNumber(personId: string, data: Types.PhoneNumberAttributes) {
        return this.createResource<Types.PhoneNumberResource>(`/people/${personId}/phone_numbers`, data);
    }

    async updatePhoneNumber(id: string, data: Partial<Types.PhoneNumberAttributes>) {
        return this.updateResource<Types.PhoneNumberResource>(`/phone_numbers/${id}`, data);
    }

    async deletePhoneNumber(id: string) {
        return this.deleteResource(`/phone_numbers/${id}`);
    }

    async getAllAddresses() {
        return this.getList<Types.AddressResource>('/addresses');
    }

    async getAddressById(id: string) {
        return this.getSingle<Types.AddressResource>(`/addresses/${id}`);
    }

    async createAddress(personId: string, data: Types.AddressAttributes) {
        return this.createResource<Types.AddressResource>(`/people/${personId}/addresses`, data);
    }

    async updateAddress(id: string, data: Partial<Types.AddressAttributes>) {
        return this.updateResource<Types.AddressResource>(`/addresses/${id}`, data);
    }

    async deleteAddress(id: string) {
        return this.deleteResource(`/addresses/${id}`);
    }

    async getAllSocialProfiles() {
        return this.getList<Types.SocialProfileResource>('/social_profiles');
    }

    async getSocialProfileById(id: string) {
        return this.getSingle<Types.SocialProfileResource>(`/social_profiles/${id}`);
    }

    async createSocialProfile(personId: string, data: Types.SocialProfileAttributes) {
        return this.createResource<Types.SocialProfileResource>(`/people/${personId}/social_profiles`, data);
    }

    async updateSocialProfile(id: string, data: Partial<Types.SocialProfileAttributes>) {
        return this.updateResource<Types.SocialProfileResource>(`/social_profiles/${id}`, data);
    }

    async deleteSocialProfile(id: string) {
        return this.deleteResource(`/social_profiles/${id}`);
    }
}
