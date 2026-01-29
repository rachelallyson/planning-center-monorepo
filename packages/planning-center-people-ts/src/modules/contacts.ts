/**
 * v2.0.0 Contacts Module
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';
import type {
    EmailResource,
    EmailAttributes,
    PhoneNumberResource,
    PhoneNumberAttributes,
    AddressResource,
    AddressAttributes,
    SocialProfileResource,
    SocialProfileAttributes,
    Meta,
    TopLevelLinks
} from '../types';

export class ContactsModule extends BaseModule {
    /**
     * Get all emails
     */
    async getAllEmails() {
        this.debugLog('contacts.getAllEmails');
        return this.getList<EmailResource>('/emails');
    }

    /**
     * Get a single email by ID
     */
    async getEmailById(id: string) {
        this.debugLog('contacts.getEmailById', { id });
        return this.getSingle<EmailResource>(`/emails/${id}`);
    }

    /**
     * Create an email for a person
     * Note: Emails must be created via person-specific endpoint
     */
    async createEmail(personId: string, data: EmailAttributes) {
        this.debugLog('contacts.createEmail', { personId, data });
        return this.createResource<EmailResource>(`/people/${personId}/emails`, data);
    }

    /**
     * Update an email
     */
    async updateEmail(id: string, data: Partial<EmailAttributes>) {
        this.debugLog('contacts.updateEmail', { id, data });
        return this.updateResource<EmailResource>(`/emails/${id}`, data);
    }

    /**
     * Delete an email
     */
    async deleteEmail(id: string) {
        this.debugLog('contacts.deleteEmail', { id });
        return this.deleteResource(`/emails/${id}`);
    }

    /**
     * Get all phone numbers
     */
    async getAllPhoneNumbers() {
        this.debugLog('contacts.getAllPhoneNumbers');
        return this.getList<PhoneNumberResource>('/phone_numbers');
    }

    /**
     * Get a single phone number by ID
     */
    async getPhoneNumberById(id: string) {
        this.debugLog('contacts.getPhoneNumberById', { id });
        return this.getSingle<PhoneNumberResource>(`/phone_numbers/${id}`);
    }

    /**
     * Create a phone number for a person
     * Note: Phone numbers must be created via person-specific endpoint
     */
    async createPhoneNumber(personId: string, data: PhoneNumberAttributes) {
        this.debugLog('contacts.createPhoneNumber', { personId, data });
        return this.createResource<PhoneNumberResource>(`/people/${personId}/phone_numbers`, data);
    }

    /**
     * Update a phone number
     */
    async updatePhoneNumber(id: string, data: Partial<PhoneNumberAttributes>) {
        this.debugLog('contacts.updatePhoneNumber', { id, data });
        return this.updateResource<PhoneNumberResource>(`/phone_numbers/${id}`, data);
    }

    /**
     * Delete a phone number
     */
    async deletePhoneNumber(id: string) {
        this.debugLog('contacts.deletePhoneNumber', { id });
        return this.deleteResource(`/phone_numbers/${id}`);
    }

    /**
     * Get all addresses
     */
    async getAllAddresses() {
        this.debugLog('contacts.getAllAddresses');
        return this.getList<AddressResource>('/addresses');
    }

    /**
     * Get a single address by ID
     */
    async getAddressById(id: string) {
        this.debugLog('contacts.getAddressById', { id });
        return this.getSingle<AddressResource>(`/addresses/${id}`);
    }

    /**
     * Create an address for a person
     * Note: Addresses must be created via person-specific endpoint
     */
    async createAddress(personId: string, data: AddressAttributes) {
        this.debugLog('contacts.createAddress', { personId, data });
        return this.createResource<AddressResource>(`/people/${personId}/addresses`, data);
    }

    /**
     * Update an address
     */
    async updateAddress(id: string, data: Partial<AddressAttributes>) {
        this.debugLog('contacts.updateAddress', { id, data });
        return this.updateResource<AddressResource>(`/addresses/${id}`, data);
    }

    /**
     * Delete an address
     */
    async deleteAddress(id: string) {
        this.debugLog('contacts.deleteAddress', { id });
        return this.deleteResource(`/addresses/${id}`);
    }

    /**
     * Get all social profiles
     */
    async getAllSocialProfiles() {
        this.debugLog('contacts.getAllSocialProfiles');
        return this.getList<SocialProfileResource>('/social_profiles');
    }

    /**
     * Get a single social profile by ID
     */
    async getSocialProfileById(id: string) {
        this.debugLog('contacts.getSocialProfileById', { id });
        return this.getSingle<SocialProfileResource>(`/social_profiles/${id}`);
    }

    /**
     * Create a social profile for a person
     * Note: Social profiles must be created via person-specific endpoint
     */
    async createSocialProfile(personId: string, data: SocialProfileAttributes) {
        this.debugLog('contacts.createSocialProfile', { personId, data });
        return this.createResource<SocialProfileResource>(`/people/${personId}/social_profiles`, data);
    }

    /**
     * Update a social profile
     */
    async updateSocialProfile(id: string, data: Partial<SocialProfileAttributes>) {
        this.debugLog('contacts.updateSocialProfile', { id, data });
        return this.updateResource<SocialProfileResource>(`/social_profiles/${id}`, data);
    }

    /**
     * Delete a social profile
     */
    async deleteSocialProfile(id: string) {
        this.debugLog('contacts.deleteSocialProfile', { id });
        return this.deleteResource(`/social_profiles/${id}`);
    }
}
