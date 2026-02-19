import { PcoClient, type EmailAttributes, type PhoneNumberAttributes } from '../../src';
import { createTestClient } from '../integration/test-config';

async function cleanupContactTestData(
  c: PcoClient,
  ids: { email?: string | null; phone?: string | null; address?: string | null; social?: string | null; person?: string | null }
): Promise<void> {
  const keyToDelete: Array<keyof typeof ids> = ['email', 'phone', 'address', 'social', 'person'];
  const deleteFns: Record<keyof typeof ids, (id: string) => Promise<void>> = {
    email: (id) => c.contacts.deleteEmail(id),
    phone: (id) => c.contacts.deletePhoneNumber(id),
    address: (id) => c.contacts.deleteAddress(id),
    social: (id) => c.contacts.deleteSocialProfile(id),
    person: (id) => c.people.delete(id),
  };
  for (const key of keyToDelete) {
    const id = ids[key];
    if (id != null) await deleteFns[key](id);
  }
}

describe('ContactsModule - Real Integration Tests', () => {
  let client: PcoClient;
  let testPersonId: string | null = null;
  let testEmailId: string | null = null;
  let testPhoneId: string | null = null;
  let testAddressId: string | null = null;
  let testSocialProfileId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();

    // Create a test person for contact operations
    const timestamp = Date.now();
    const person = await client.people.create({
      first_name: `Test_Contacts_${timestamp}`,
      last_name: `Person_${timestamp}`,
      status: 'active',
    });
    // create() returns ResourceObject which should have id property
    if (!person || !person.id) {
      throw new Error('Failed to create test person: API returned invalid response');
    }
    testPersonId = person.id;
  }, 30000);

  afterAll(async () => {
    await cleanupContactTestData(client, {
      email: testEmailId,
      phone: testPhoneId,
      address: testAddressId,
      social: testSocialProfileId,
      person: testPersonId,
    });
  }, 120000);

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(client).toBeDefined();
      expect(client.contacts).toBeDefined();
    });
  });

  describe('getAllEmails', () => {
    it('should fetch all emails', async () => {
      const result = await client.contacts.getAllEmails();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getEmailById', () => {
    it('should fetch email by ID', async () => {
      // First get an email ID
      const emailsResponse = await client.contacts.getAllEmails();
      expect(emailsResponse.data.length).toBeGreaterThan(0);
      const emailId = emailsResponse.data[0].id;

      const result = await client.contacts.getEmailById(emailId);

      expect(result).toBeDefined();
      expect(result.id).toBe(emailId);
      expect(result.type).toBe('Email');
      // FlattenedResource doesn't have 'attributes' - attributes are flattened to top level
      expect(result).toHaveProperty('address');
    }, 30000);
  });

  describe('createEmail', () => {
    it('should create a new email', async () => {
      expect(testPersonId).toBeDefined();

      const timestamp = Date.now();
      const emailData: EmailAttributes = {
        address: `testemail${timestamp}@gmail.com`,
        location: 'Home',
        primary: false,
      };

      const result = await client.contacts.createEmail(testPersonId!, emailData);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('Email');
      expect(result.address).toBe(emailData.address);

      testEmailId = result.id || null;
    }, 30000);
  });

  describe('updateEmail', () => {
    it('should update an existing email', async () => {
      expect(testEmailId).toBeDefined();

      const updateData = { address: `updated${Date.now()}@gmail.com` };
      const result = await client.contacts.updateEmail(testEmailId!, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(testEmailId);
      expect(result.address).toContain('@gmail.com');
    }, 30000);
  });

  describe('deleteEmail', () => {
    it('should delete an email', async () => {
      expect(testPersonId).toBeDefined();

      // Create an email to delete using PeopleModule (which works)
      const timestamp = Date.now();
      const emailData: EmailAttributes = {
        address: `testdelete${timestamp}@gmail.com`,
        location: 'Home',
        primary: false,
      };
      const created = await client.people.addEmail(testPersonId!, emailData);
      const emailIdToDelete = created.id ?? '';

      // Delete using ContactsModule
      await expect(client.contacts.deleteEmail(emailIdToDelete)).resolves.not.toThrow();

      // Verify it's deleted by trying to fetch it
      await expect(client.contacts.getEmailById(emailIdToDelete)).rejects.toThrow();
    }, 30000);
  });

  describe('getAllPhoneNumbers', () => {
    it('should fetch all phone numbers', async () => {
      const result = await client.contacts.getAllPhoneNumbers();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getPhoneNumberById', () => {
    it('should fetch phone number by ID', async () => {
      // First get a phone number ID
      const phonesResponse = await client.contacts.getAllPhoneNumbers();
      expect(phonesResponse.data.length).toBeGreaterThan(0);
      const phoneId = phonesResponse.data[0].id;

      const result = await client.contacts.getPhoneNumberById(phoneId);

      expect(result).toBeDefined();
      expect(result.id).toBe(phoneId);
      expect(result.type).toBe('PhoneNumber');
      // FlattenedResource doesn't have 'attributes' - attributes are flattened to top level
      expect(result).toHaveProperty('number');
    }, 30000);
  });

  describe('createPhoneNumber', () => {
    it('should create a new phone number', async () => {
      expect(testPersonId).toBeDefined();

      const timestamp = Date.now();
      const phoneData: PhoneNumberAttributes = {
        number: `+1555${timestamp.toString().slice(-7)}`,
        location: 'Home',
        primary: false,
      };

      const result = await client.contacts.createPhoneNumber(testPersonId!, phoneData);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('PhoneNumber');
      expect(result.number).toBe(phoneData.number);

      testPhoneId = result.id || null;
    }, 30000);
  });

  describe('updatePhoneNumber', () => {
    it('should update an existing phone number', async () => {
      expect(testPhoneId).toBeDefined();

      const updateData = { number: `+1556${Date.now().toString().slice(-7)}` };
      const result = await client.contacts.updatePhoneNumber(testPhoneId!, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(testPhoneId);
      expect(result.number).toMatch(/^\+1556/);
    }, 30000);
  });

  describe('deletePhoneNumber', () => {
    it('should delete a phone number', async () => {
      expect(testPersonId).toBeDefined();

      // Create a phone number to delete using PeopleModule (which works)
      const timestamp = Date.now();
      const phoneData: PhoneNumberAttributes = {
        number: `+1555${timestamp.toString().slice(-7)}`,
        location: 'Home',
        primary: false,
      };
      const created = await client.people.addPhoneNumber(testPersonId!, phoneData);
      const phoneIdToDelete = created.id ?? '';

      // Delete using ContactsModule
      await expect(client.contacts.deletePhoneNumber(phoneIdToDelete)).resolves.not.toThrow();

      // Verify it's deleted by trying to fetch it
      await expect(client.contacts.getPhoneNumberById(phoneIdToDelete)).rejects.toThrow();
    }, 30000);
  });

  describe('getAllAddresses', () => {
    it('should fetch all addresses', async () => {
      const result = await client.contacts.getAllAddresses();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getAddressById', () => {
    it('should fetch address by ID', async () => {
      // First get an address ID
      const addressesResponse = await client.contacts.getAllAddresses();
      expect(addressesResponse.data.length).toBeGreaterThan(0);
      const addressId = addressesResponse.data[0].id;

      const result = await client.contacts.getAddressById(addressId);

      expect(result).toBeDefined();
      expect(result.id).toBe(addressId);
      expect(result.type).toBe('Address');
      // FlattenedResource doesn't have 'attributes' - attributes are flattened to top level
      // Address has 'street_line_1' or 'location', not 'street'
      expect(result).toHaveProperty('location');
    }, 30000);
  });

  describe('createAddress', () => {
    it('should create a new address', async () => {
      expect(testPersonId).toBeDefined();

      const timestamp = Date.now();
      const addressData = {
        street_line_1: `123 Test St ${timestamp}`,
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        location: 'Home',
      };

      const result = await client.contacts.createAddress(testPersonId!, addressData);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('Address');
      expect(result.street_line_1).toBe(addressData.street_line_1);

      testAddressId = result.id || null;
    }, 30000);
  });

  describe('updateAddress', () => {
    it('should update an existing address', async () => {
      expect(testAddressId).toBeDefined();

      const updateData = { street_line_1: '456 Updated Ave', city: 'New City' };
      const result = await client.contacts.updateAddress(testAddressId!, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(testAddressId);
      expect(result.street_line_1).toBe('456 Updated Ave');
      expect(result.city).toBe('New City');
    }, 30000);
  });

  describe('deleteAddress', () => {
    it('should delete an address', async () => {
      expect(testPersonId).toBeDefined();

      // Create an address to delete using PeopleModule (which works)
      const timestamp = Date.now();
      const addressData = {
        street_line_1: `123 Delete St ${timestamp}`,
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        location: 'Home',
      };
      const created = await client.people.addAddress(testPersonId!, addressData);
      const addressIdToDelete = created.id ?? '';

      // Delete using ContactsModule
      await expect(client.contacts.deleteAddress(addressIdToDelete)).resolves.not.toThrow();

      // Verify it's deleted by trying to fetch it
      await expect(client.contacts.getAddressById(addressIdToDelete)).rejects.toThrow();
    }, 30000);
  });

  describe('getAllSocialProfiles', () => {
    it('should fetch all social profiles', async () => {
      const result = await client.contacts.getAllSocialProfiles();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getSocialProfileById', () => {
    it('should fetch social profile by ID', async () => {
      // First get a social profile ID
      const profilesResponse = await client.contacts.getAllSocialProfiles();
      expect(profilesResponse.data.length).toBeGreaterThan(0);
      const profileId = profilesResponse.data[0].id;

      const result = await client.contacts.getSocialProfileById(profileId);

      expect(result).toBeDefined();
      expect(result.id).toBe(profileId);
      expect(result.type).toBe('SocialProfile');
      // FlattenedResource doesn't have 'attributes' - attributes are flattened to top level
      expect(result).toHaveProperty('url');
    }, 30000);
  });

  describe('createSocialProfile', () => {
    it('should create a new social profile', async () => {
      expect(testPersonId).toBeDefined();

      const timestamp = Date.now();
      const profileData = {
        site: 'Facebook',
        url: `https://facebook.com/testuser${timestamp}`,
      };

      const result = await client.contacts.createSocialProfile(testPersonId!, profileData);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('SocialProfile');
      expect(result.site).toBe('Facebook');

      testSocialProfileId = result.id || null;
    }, 30000);
  });

  describe('updateSocialProfile', () => {
    it('should update an existing social profile', async () => {
      expect(testSocialProfileId).toBeDefined();

      const updateData = { url: `https://facebook.com/newuser${Date.now()}` };
      const result = await client.contacts.updateSocialProfile(testSocialProfileId!, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(testSocialProfileId);
      expect(result.url).toContain('facebook.com');
    }, 30000);
  });

  describe('deleteSocialProfile', () => {
    it('should delete a social profile', async () => {
      expect(testPersonId).toBeDefined();

      // Create a social profile to delete using PeopleModule (which works)
      const timestamp = Date.now();
      const profileData = {
        site: 'Facebook',
        url: `https://facebook.com/deleteuser${timestamp}`,
      };
      const created = await client.people.addSocialProfile(testPersonId!, profileData);
      const profileIdToDelete = created.id ?? '';

      // Delete using ContactsModule
      await expect(client.contacts.deleteSocialProfile(profileIdToDelete)).resolves.not.toThrow();

      // Verify it's deleted by trying to fetch it
      await expect(client.contacts.getSocialProfileById(profileIdToDelete)).rejects.toThrow();
    }, 30000);
  });
});
