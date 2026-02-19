/**
 * Response-types integration tests: People module.
 * Asserts against the resolved return type of each function under test.
 * Run with: npm run test:integration
 */

import typia from 'typia';
import { PcoClient, singleFromCreateResponse } from '../../src';
import { createTestClient } from './test-config';
import { cleanupCreated, fetchIds, type CreatedIds, type IntegrationIds, type ResolvedReturnType } from './response-types-helpers';

describe('Response types: People', () => {
  let client: PcoClient;
  let ids: IntegrationIds;
  const createdIds: CreatedIds = {};

  beforeAll(async () => {
    client = createTestClient();
    ids = await fetchIds(client);
  }, 30000);

  afterAll(async () => {
    await cleanupCreated(client, createdIds);
  }, 60000);

  describe('People', () => {
    it('getAll response matches declared return type', async () => {
      const res = await client.people.getAll();
      typia.assert<ResolvedReturnType<typeof client.people.getAll>>(res);
    }, 300000);

    it('getPage response matches declared return type', async () => {
      const res = await client.people.getPage({ per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.people.getPage>>(res);
    });

    it('getById response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.getById(ids.personId);
      typia.assert<ResolvedReturnType<typeof client.people.getById>>(res);
    });

    it('create response matches declared return type', async () => {
      const res = await client.people.create({ first_name: `TypiaTest_${Date.now()}`, status: 'active' });
      const single = singleFromCreateResponse(res);
      expect(single).toBeDefined();
      createdIds.person = single!.id;
      typia.assert<ResolvedReturnType<typeof client.people.create>>(res);
    });

    it('update response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.update(ids.personId, { first_name: 'TypiaUpdate' });
      typia.assert<ResolvedReturnType<typeof client.people.update>>(res);
    });

    it('getPrimaryCampus response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.getPrimaryCampus(ids.personId);
      typia.assert<ResolvedReturnType<typeof client.people.getPrimaryCampus>>(res);
    });

    it('getHousehold response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.getHousehold(ids.personId);
      typia.assert<ResolvedReturnType<typeof client.people.getHousehold>>(res);
    });

    it('getHouseholdMembers response matches declared return type', async () => {
      expect(ids.householdId).toBeTruthy();
      const res = await client.people.getHouseholdMembers(ids.householdId, { per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.people.getHouseholdMembers>>(res);
    });

    it('getByCampus response matches declared return type', async () => {
      expect(ids.campusId).toBeTruthy();
      const res = await client.people.getByCampus(ids.campusId, { per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.people.getByCampus>>(res);
    });

    it('getWorkflowCards response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.getWorkflowCards(ids.personId, { per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.people.getWorkflowCards>>(res);
    });

    it('getNotes response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.getNotes(ids.personId, { per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.people.getNotes>>(res);
    });

    it('getFieldData response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.getFieldData(ids.personId);
      typia.assert<ResolvedReturnType<typeof client.people.getFieldData>>(res);
    });

    it('getEmails response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.getEmails(ids.personId);
      typia.assert<ResolvedReturnType<typeof client.people.getEmails>>(res);
    });

    it('getPhoneNumbers response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.getPhoneNumbers(ids.personId);
      typia.assert<ResolvedReturnType<typeof client.people.getPhoneNumbers>>(res);
    });

    it('getAddresses response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.getAddresses(ids.personId);
      typia.assert<ResolvedReturnType<typeof client.people.getAddresses>>(res);
    });

    it('search response matches declared return type', async () => {
      const res = await client.people.search({ name: 'a', per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.people.search>>(res);
    });

    it('verifyPersonExists returns boolean', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.verifyPersonExists(ids.personId);
      expect(typeof res).toBe('boolean');
    });

    it('setPrimaryCampus response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      expect(ids.campusId).toBeTruthy();
      const res = await client.people.setPrimaryCampus(ids.personId, ids.campusId);
      typia.assert<ResolvedReturnType<typeof client.people.setPrimaryCampus>>(res);
    });

    it('removePrimaryCampus response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.removePrimaryCampus(ids.personId);
      typia.assert<ResolvedReturnType<typeof client.people.removePrimaryCampus>>(res);
    });

    it('setHousehold response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      expect(ids.householdId).toBeTruthy();
      const res = await client.people.setHousehold(ids.personId, ids.householdId);
      typia.assert<ResolvedReturnType<typeof client.people.setHousehold>>(res);
    });

    it('removeFromHousehold response matches declared return type', async () => {
      expect(ids.householdId).toBeTruthy();
      const household = await client.households.getById(ids.householdId);
      expect(household.people?.length).toBeGreaterThan(0);
      const personId = household.people![0].id;
      const res = await client.people.removeFromHousehold(personId);
      typia.assert<ResolvedReturnType<typeof client.people.removeFromHousehold>>(res);
      await client.people.setHousehold(personId, ids.householdId);
    });

    it('addEmail response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.addEmail(ids.personId, { address: `typia-${Date.now()}@example.com`, location: 'Other' });
      typia.assert<ResolvedReturnType<typeof client.people.addEmail>>(res);
    });

    it('addPhoneNumber response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.addPhoneNumber(ids.personId, { number: '5550100000', location: 'Other' });
      typia.assert<ResolvedReturnType<typeof client.people.addPhoneNumber>>(res);
    });

    it('addAddress response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.addAddress(ids.personId, { street_line_1: '123 Test St', city: 'City', state: 'ST', zip: '12345' });
      typia.assert<ResolvedReturnType<typeof client.people.addAddress>>(res);
    });

    it('delete runs without throwing', async () => {
      const createRes = await client.people.create({ first_name: 'DeleteMe', status: 'active' });
      const id = singleFromCreateResponse(createRes)?.id;
      expect(id).toBeDefined();
      await expect(client.people.delete(id!)).resolves.not.toThrow();
    });
  });

  describe('People (findOrCreate, createWithContacts)', () => {
    it('findOrCreate response matches declared return type', async () => {
      const res = await client.people.findOrCreate({
        first_name: 'TypiaFind',
        last_name: `Create_${Date.now()}`,
        email: `findcreate-${Date.now()}@example.com`,
        createIfNotFound: true,
      });
      typia.assert<ResolvedReturnType<typeof client.people.findOrCreate>>(res);
    });

    it('createWithContacts response matches declared return type', async () => {
      const result = await client.people.createWithContacts(
        { first_name: `TypiaWC_${Date.now()}`, last_name: 'Contacts', status: 'active' },
        { email: { address: `wc-${Date.now()}@example.com`, location: 'Other' } }
      );
      expect(result).toHaveProperty('person');
      typia.assert<ResolvedReturnType<typeof client.people.createWithContacts>>(result);
    });
  });

  describe('People (updateEmail, updatePhoneNumber, updateAddress)', () => {
    it('updateEmail response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const emails = await client.people.getEmails(ids.personId);
      expect(emails.data.length).toBeGreaterThan(0);
      const res = await client.people.updateEmail(ids.personId, emails.data[0].id, { location: 'Work' });
      typia.assert<ResolvedReturnType<typeof client.people.updateEmail>>(res);
    });

    it('updatePhoneNumber response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const phones = await client.people.getPhoneNumbers(ids.personId);
      expect(phones.data.length).toBeGreaterThan(0);
      const res = await client.people.updatePhoneNumber(ids.personId, phones.data[0].id, { location: 'Home' });
      typia.assert<ResolvedReturnType<typeof client.people.updatePhoneNumber>>(res);
    });

    it('updateAddress response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const addrs = await client.people.getAddresses(ids.personId);
      expect(addrs.data.length).toBeGreaterThan(0);
      const res = await client.people.updateAddress(ids.personId, addrs.data[0].id, { city: 'Updated' });
      typia.assert<ResolvedReturnType<typeof client.people.updateAddress>>(res);
    });
  });

  describe('People (delete contact helpers)', () => {
    it('deleteEmail runs without throwing', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.addEmail(ids.personId, { address: `delpe-${Date.now()}@example.com`, location: 'Other' });
      const id = singleFromCreateResponse(res)?.id;
      expect(id).toBeDefined();
      await expect(client.people.deleteEmail(ids.personId, id!)).resolves.not.toThrow();
    });

    it('deletePhoneNumber runs without throwing', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.addPhoneNumber(ids.personId, { number: '5550400000', location: 'Other' });
      const id = singleFromCreateResponse(res)?.id;
      expect(id).toBeDefined();
      await expect(client.people.deletePhoneNumber(ids.personId, id!)).resolves.not.toThrow();
    });

    it('deleteAddress runs without throwing', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.addAddress(ids.personId, { street_line_1: 'Del St', city: 'C', state: 'S', zip: '1' });
      const id = singleFromCreateResponse(res)?.id;
      expect(id).toBeDefined();
      await expect(client.people.deleteAddress(ids.personId, id!)).resolves.not.toThrow();
    });
  });

  describe('People (getSocialProfiles)', () => {
    it('getSocialProfiles response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.getSocialProfiles(ids.personId);
      typia.assert<ResolvedReturnType<typeof client.people.getSocialProfiles>>(res);
    });
  });

  describe('People (social profile write)', () => {
    it('addSocialProfile response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const res = await client.people.addSocialProfile(ids.personId, { site: 'Twitter', url: 'https://example.com' });
      typia.assert<ResolvedReturnType<typeof client.people.addSocialProfile>>(res);
    });

    it('updateSocialProfile response matches declared return type', async () => {
      expect(ids.personId).toBeTruthy();
      const list = await client.people.getSocialProfiles(ids.personId);
      expect(list.data.length).toBeGreaterThan(0);
      const res = await client.people.updateSocialProfile(ids.personId, list.data[0].id, { url: 'https://updated.example.com' });
      typia.assert<ResolvedReturnType<typeof client.people.updateSocialProfile>>(res);
    });

    it('deleteSocialProfile runs without throwing', async () => {
      expect(ids.personId).toBeTruthy();
      const list = await client.people.getSocialProfiles(ids.personId);
      expect(list.data.length).toBeGreaterThan(0);
      await expect(client.people.deleteSocialProfile(ids.personId, list.data[0].id)).resolves.not.toThrow();
    });
  });
});
