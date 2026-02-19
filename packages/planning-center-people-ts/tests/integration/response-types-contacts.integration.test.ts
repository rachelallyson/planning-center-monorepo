/**
 * Response-types integration tests: Contacts module (emails, phones, addresses, social).
 * Asserts against the resolved return type of each function under test.
 */

import typia from 'typia';
import { PcoClient, singleFromCreateResponse } from '../../src';
import { createTestClient } from './test-config';
import { fetchIds, type IntegrationIds, type ResolvedReturnType } from './response-types-helpers';

describe('Response types: Contacts', () => {
  let client: PcoClient;
  let ids: IntegrationIds;

  beforeAll(async () => {
    client = createTestClient();
    ids = await fetchIds(client);
  }, 30000);

  describe('Emails', () => {
    it('getAllEmails response matches declared return type', async () => {
      const res = await client.contacts.getAllEmails();
      typia.assert<ResolvedReturnType<typeof client.contacts.getAllEmails>>(res);
    });

    it('getEmailById response matches declared return type', async () => {
      const list = await client.contacts.getAllEmails();
      expect(list.data.length).toBeGreaterThan(0);
      const res = await client.contacts.getEmailById(list.data[0].id);
      typia.assert<ResolvedReturnType<typeof client.contacts.getEmailById>>(res);
    });

    it('createEmail response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.contacts.createEmail(ids.personId, { address: `contacts-${Date.now()}@example.com`, location: 'Other' });
      typia.assert<ResolvedReturnType<typeof client.contacts.createEmail>>(res);
    });

    it('updateEmail response matches declared return type', async () => {
      const list = await client.contacts.getAllEmails();
      expect(list.data.length).toBeGreaterThan(0);
      const res = await client.contacts.updateEmail(list.data[0].id, { location: 'Home' });
      typia.assert<ResolvedReturnType<typeof client.contacts.updateEmail>>(res);
    });

    it('deleteEmail runs without throwing', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.contacts.createEmail(ids.personId, { address: `del-${Date.now()}@example.com`, location: 'Other' });
      const id = singleFromCreateResponse(res)?.id;
      expect(id).toBeDefined();
      await expect(client.contacts.deleteEmail(id!)).resolves.not.toThrow();
    });
  });

  describe('Phone numbers', () => {
    it('getAllPhoneNumbers response matches declared return type', async () => {
      const res = await client.contacts.getAllPhoneNumbers();
      typia.assert<ResolvedReturnType<typeof client.contacts.getAllPhoneNumbers>>(res);
    });

    it('getPhoneNumberById response matches declared return type', async () => {
      const list = await client.contacts.getAllPhoneNumbers();
      expect(list.data.length).toBeGreaterThan(0);
      const res = await client.contacts.getPhoneNumberById(list.data[0].id);
      typia.assert<ResolvedReturnType<typeof client.contacts.getPhoneNumberById>>(res);
    });

    it('createPhoneNumber response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.contacts.createPhoneNumber(ids.personId, { number: '5550200000', location: 'Other' });
      typia.assert<ResolvedReturnType<typeof client.contacts.createPhoneNumber>>(res);
    });

    it('updatePhoneNumber response matches declared return type', async () => {
      const list = await client.contacts.getAllPhoneNumbers();
      expect(list.data.length).toBeGreaterThan(0);
      const res = await client.contacts.updatePhoneNumber(list.data[0].id, { location: 'Work' });
      typia.assert<ResolvedReturnType<typeof client.contacts.updatePhoneNumber>>(res);
    });

    it('deletePhoneNumber runs without throwing', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.contacts.createPhoneNumber(ids.personId, { number: '5550300000', location: 'Other' });
      const id = singleFromCreateResponse(res)?.id;
      expect(id).toBeDefined();
      await expect(client.contacts.deletePhoneNumber(id!)).resolves.not.toThrow();
    });
  });

  describe('Addresses', () => {
    it('getAllAddresses response matches declared return type', async () => {
      const res = await client.contacts.getAllAddresses();
      typia.assert<ResolvedReturnType<typeof client.contacts.getAllAddresses>>(res);
    });

    it('getAddressById response matches declared return type', async () => {
      const list = await client.contacts.getAllAddresses();
      expect(list.data.length).toBeGreaterThan(0);
      const res = await client.contacts.getAddressById(list.data[0].id);
      typia.assert<ResolvedReturnType<typeof client.contacts.getAddressById>>(res);
    });

    it('createAddress response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.contacts.createAddress(ids.personId, { street_line_1: '456 Contact St', city: 'Town', state: 'TX', zip: '54321' });
      typia.assert<ResolvedReturnType<typeof client.contacts.createAddress>>(res);
    });

    it('updateAddress response matches declared return type', async () => {
      const list = await client.contacts.getAllAddresses();
      expect(list.data.length).toBeGreaterThan(0);
      const res = await client.contacts.updateAddress(list.data[0].id, { city: 'CityUpdate' });
      typia.assert<ResolvedReturnType<typeof client.contacts.updateAddress>>(res);
    });

    it('deleteAddress runs without throwing', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.contacts.createAddress(ids.personId, { street_line_1: 'Del St', city: 'C', state: 'S', zip: '00000' });
      const id = singleFromCreateResponse(res)?.id;
      expect(id).toBeDefined();
      await expect(client.contacts.deleteAddress(id!)).resolves.not.toThrow();
    });
  });

  describe('Social profiles', () => {
    it('getAllSocialProfiles response matches declared return type', async () => {
      const res = await client.contacts.getAllSocialProfiles();
      typia.assert<ResolvedReturnType<typeof client.contacts.getAllSocialProfiles>>(res);
    });

    it('getSocialProfileById response matches declared return type', async () => {
      const list = await client.contacts.getAllSocialProfiles();
      expect(list.data.length).toBeGreaterThan(0);
      const res = await client.contacts.getSocialProfileById(list.data[0].id);
      typia.assert<ResolvedReturnType<typeof client.contacts.getSocialProfileById>>(res);
    });

    it('createSocialProfile response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.contacts.createSocialProfile(ids.personId, { site: 'Twitter', url: 'https://example.com' });
      typia.assert<ResolvedReturnType<typeof client.contacts.createSocialProfile>>(res);
    });

    it('updateSocialProfile response matches declared return type', async () => {
      const list = await client.contacts.getAllSocialProfiles();
      expect(list.data.length).toBeGreaterThan(0);
      const res = await client.contacts.updateSocialProfile(list.data[0].id, { url: 'https://updated.example.com' });
      typia.assert<ResolvedReturnType<typeof client.contacts.updateSocialProfile>>(res);
    });

    it('deleteSocialProfile runs without throwing', async () => {
      const list = await client.contacts.getAllSocialProfiles();
      expect(list.data.length).toBeGreaterThan(0);
      await expect(client.contacts.deleteSocialProfile(list.data[0].id)).resolves.not.toThrow();
    });
  });
});
