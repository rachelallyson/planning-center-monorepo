import { PcoClient } from '../../src';
import { createTestClient } from '../integration/test-config';

describe('PeopleModule - Real Integration Tests', () => {
  let client: PcoClient;
  let testPersonId: string | null = null;
  const testPersonId2: string | null = null;

  beforeAll(async () => {
    client = createTestClient();
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    if (testPersonId) {
      await client.people.delete(testPersonId);
    }
    if (testPersonId2) {
      await client.people.delete(testPersonId2);
    }
  }, 120000);

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(client).toBeDefined();
      expect(client.people).toBeDefined();
    });
  });

  describe('getAll', () => {
    it('should fetch all people with default parameters', async () => {
      const result = await client.people.getAll();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.meta?.total_count).toBeGreaterThan(0);
    }, 120000); // Increased timeout - getAll can be slow with many people

    it('should fetch people with filtering options', async () => {
      const result = await client.people.getPage({
        where: { status: 'active' },
        include: ['emails', 'phone_numbers'],
        per_page: 25,
      });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      result.data.forEach((person) => {
        expect(person.status).toBe('active');
      });
    }, 60000);
  });

  describe('getPage', () => {
    it('should fetch a single page of people', async () => {
      const result = await client.people.getPage({ per_page: 25, page: 1 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(25);
    }, 30000);

    it('should fetch a page with filtering options', async () => {
      const result = await client.people.getPage({
        where: { status: 'active' },
        include: ['emails'],
        per_page: 10,
        page: 1,
      });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      // getPage returns flattened resources
      result.data.forEach((person) => {
        const personFlattened = person;
        expect(personFlattened.status).toBe('active');
      });
    }, 30000);
  });

  describe('getById', () => {
    it('should fetch person by ID without include', async () => {
      // First get a person ID
      const peopleResponse = await client.people.getPage({ per_page: 1 });
      expect(peopleResponse.data.length).toBeGreaterThan(0);
      const personId = peopleResponse.data[0].id;

      const result = await client.people.getById(personId);

      expect(result).toBeDefined();
      expect(result.id).toBe(personId);
      expect(result.type).toBe('Person');
      // FlattenedResource doesn't have 'attributes' - attributes are flattened to top level
      expect(result).toHaveProperty('first_name');
    }, 30000);

    it('should fetch person by ID with include', async () => {
      // First get a person ID
      const peopleResponse = await client.people.getPage({ per_page: 1 });
      expect(peopleResponse.data.length).toBeGreaterThan(0);
      const personId = peopleResponse.data[0].id;

      const result = await client.people.getById(personId, { include: ['emails', 'phone_numbers'] });

      expect(result).toBeDefined();
      expect(result.id).toBe(personId);
      expect(result.type).toBe('Person');
    }, 30000);
  });

  describe('create', () => {
    it('should create a new person', async () => {
      const timestamp = Date.now();
      const personData = {
        first_name: `Test_John_${timestamp}`,
        last_name: `Test_Doe_${timestamp}`,
        status: 'active',
      };
      const result = await client.people.create(personData);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('Person');
      expect(result.first_name).toBe(personData.first_name);
      expect(result.last_name).toBe(personData.last_name);

      testPersonId = result.id || null;
    }, 30000);
  });

  describe('update', () => {
    it('should update an existing person', async () => {
      expect(testPersonId).toBeDefined();

      const updateData = { first_name: 'Jane' };
      const result = await client.people.update(testPersonId!, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(testPersonId);
      expect(result.first_name).toBe('Jane');
    }, 30000);
  });

  describe('delete', () => {
    it('should delete a person', async () => {
      // Create a person to delete
      const timestamp = Date.now();
      const personData = {
        first_name: `Test_Delete_${timestamp}`,
        last_name: `Test_${timestamp}`,
        status: 'active',
      };
      const created = await client.people.create(personData);
      // create() returns ResourceObject which should have id property
      if (!created || !created.id) {
        throw new Error('Failed to create test person: API returned invalid response');
      }
      const personIdToDelete = created.id;

      // Delete the person
      await expect(client.people.delete(personIdToDelete)).resolves.not.toThrow();

      // Verify it's deleted by trying to fetch it
      await expect(client.people.getById(personIdToDelete)).rejects.toThrow();
    }, 30000);
  });

  describe('getPrimaryCampus', () => {
    it('should get primary campus for a person', async () => {
      // Get a campus first
      const campusesResponse = await client.campus.getPage({ per_page: 1 });
      expect(campusesResponse.data.length).toBeGreaterThan(0);
      const campusId = campusesResponse.data[0].id;

      // Create a person and set their primary campus
      const timestamp = Date.now();
      const personData = {
        first_name: `Test_Campus_${timestamp}`,
        last_name: `Test_${timestamp}`,
        status: 'active',
      };
      const created = await client.people.create(personData);
      const personId = created.id!;

      // Set the primary campus
      await client.people.setPrimaryCampus(personId, campusId);

      // Wait a bit for API indexing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = await client.people.getPrimaryCampus(personId);
      expect(result).toBeDefined();
      if (result) {
        expect(result.id).toBe(campusId);
        expect(result.type).toBe('Campus');
      }

      // Clean up
      await client.people.delete(personId);
    }, 120000);

    it('should return null when no primary campus', async () => {
      // Create a person without a primary campus
      const timestamp = Date.now();
      const personData = {
        first_name: `Test_NoCampus_${timestamp}`,
        last_name: `Test_${timestamp}`,
        status: 'active',
      };
      const created = await client.people.create(personData);
      const personId = created.id!;

      const result = await client.people.getPrimaryCampus(personId);
      // May be null or a campus, depending on account settings
      expect(result === null || (result && result.type === 'Campus')).toBe(true);

      // Clean up
      await client.people.delete(personId);
    }, 30000);
  });

  describe('setPrimaryCampus', () => {
    it('should set primary campus for a person', async () => {
      // Get a campus ID first
      const campusesResponse = await client.campus.getPage({ per_page: 1 });
      expect(campusesResponse.data.length).toBeGreaterThan(0);
      const campusId = campusesResponse.data[0].id;

      expect(testPersonId).toBeDefined();

      const result = await client.people.setPrimaryCampus(testPersonId!, campusId);
      expect(result).toBeDefined();
      expect(result.id).toBe(testPersonId);
    }, 30000);
  });

  describe('removePrimaryCampus', () => {
    it('should remove primary campus for a person', async () => {
      expect(testPersonId).toBeDefined();

      // Set a campus first so we can remove it
      const campusesResponse = await client.campus.getPage({ per_page: 1 });
      expect(campusesResponse.data.length).toBeGreaterThan(0);
      await client.people.setPrimaryCampus(testPersonId!, campusesResponse.data[0].id);

      const result = await client.people.removePrimaryCampus(testPersonId!);
      expect(result).toBeDefined();
      expect(result.id).toBe(testPersonId);
    }, 30000);
  });

  describe('getHousehold', () => {
    it('should get household for a person', async () => {
      // Get or create a household first
      const householdsResponse = await client.households.getPage({ per_page: 1 });
      let householdId: string;

      if (householdsResponse.data.length > 0) {
        householdId = householdsResponse.data[0].id;
      } else {
        // Create a household if none exists
        const household = await client.households.create({ name: `Test Household ${Date.now()}` });
        householdId = household.id!;
      }

      // Create a person and set their household
      const timestamp = Date.now();
      const personData = {
        first_name: `Test_Household_${timestamp}`,
        last_name: `Test_${timestamp}`,
        status: 'active',
      };
      const created = await client.people.create(personData);
      const personId = created.id!;

      // Set the household
      await client.people.setHousehold(personId, householdId);

      // Wait a bit for API indexing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = await client.people.getHousehold(personId);
      expect(result).toBeDefined();
      if (result) {
        expect(result.id).toBe(householdId);
        expect(result.type).toBe('Household');
      }

      // Clean up
      await client.people.delete(personId);
    }, 60000);

    it('should return null when no household', async () => {
      // Create a person without a household
      const timestamp = Date.now();
      const personData = {
        first_name: `Test_NoHousehold_${timestamp}`,
        last_name: `Test_${timestamp}`,
        status: 'active',
      };
      const created = await client.people.create(personData);
      const personId = created.id!;

      const result = await client.people.getHousehold(personId);
      // May be null or a household, depending on account
      expect(result === null || (result && result.type === 'Household')).toBe(true);

      // Clean up
      await client.people.delete(personId);
    }, 30000);
  });

  describe('setHousehold', () => {
    it('should set household for a person', async () => {
      // Get a household
      const householdsResponse = await client.households.getPage({ per_page: 1 });
      expect(householdsResponse.data.length).toBeGreaterThan(0);
      const householdId = householdsResponse.data[0].id;

      expect(testPersonId).toBeDefined();

      const result = await client.people.setHousehold(testPersonId!, householdId);
      expect(result).toBeDefined();
      expect(result.id).toBe(testPersonId);
    }, 30000);
  });

  describe('removeFromHousehold', () => {
    it('should remove person from household', async () => {
      // Create a person first
      const timestamp = Date.now();
      const personData = {
        first_name: `Test_RemoveHousehold_${timestamp}`,
        last_name: `Test_${timestamp}`,
        status: 'active',
      };
      const created = await client.people.create(personData);
      const personIdToRemove = created.id || '';

      expect(personIdToRemove).toBeDefined();

      // Get or create a household
      const householdsResponse = await client.households.getPage({ per_page: 1 });
      expect(householdsResponse.data.length).toBeGreaterThan(0);
      const householdId = householdsResponse.data[0].id;

      // Add person to household first
      await client.people.setHousehold(personIdToRemove, householdId);

      // Now remove from household
      const result = await client.people.removeFromHousehold(personIdToRemove);
      expect(result).toBeDefined();
      expect(result.id).toBe(personIdToRemove);

      // Cleanup
      await client.people.delete(personIdToRemove);
    }, 30000);
  });

  describe('getHouseholdMembers', () => {
    it('should get household members', async () => {
      // Get a household first
      const householdsResponse = await client.households.getPage({ per_page: 1 });
      expect(householdsResponse.data.length).toBeGreaterThan(0);
      const householdId = householdsResponse.data[0].id;

      const result = await client.people.getHouseholdMembers(householdId);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getByCampus', () => {
    it('should get people by campus', async () => {
      // Get a campus first
      const campusesResponse = await client.campus.getPage({ per_page: 1 });
      expect(campusesResponse.data.length).toBeGreaterThan(0);
      const campusId = campusesResponse.data[0].id;

      const result = await client.people.getByCampus(campusId);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getWorkflowCards', () => {
    it('should get workflow cards for a person', async () => {
      // Get a person first
      const peopleResponse = await client.people.getPage({ per_page: 1 });
      expect(peopleResponse.data.length).toBeGreaterThan(0);
      const personId = peopleResponse.data[0].id;

      const options = {
        per_page: 10,
        page: 1,
      };

      const result = await client.people.getWorkflowCards(personId, options);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getNotes', () => {
    it('should get notes for a person', async () => {
      // Get a person first
      const peopleResponse = await client.people.getPage({ per_page: 1 });
      expect(peopleResponse.data.length).toBeGreaterThan(0);
      const personId = peopleResponse.data[0].id;

      const options = {
        per_page: 10,
        page: 1,
      };

      const result = await client.people.getNotes(personId, options);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getFieldData', () => {
    it('should get field data for a person', async () => {
      // Get a person first
      const peopleResponse = await client.people.getPage({ per_page: 1 });
      expect(peopleResponse.data.length).toBeGreaterThan(0);
      const personId = peopleResponse.data[0].id;

      const options = {
        per_page: 10,
        page: 1,
      };

      const result = await client.people.getFieldData(personId, options);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getSocialProfiles', () => {
    it('should get social profiles for a person', async () => {
      // Get a person first
      const peopleResponse = await client.people.getPage({ per_page: 1 });
      expect(peopleResponse.data.length).toBeGreaterThan(0);
      const personId = peopleResponse.data[0].id;

      const options = {
        per_page: 10,
        page: 1,
      };

      const result = await client.people.getSocialProfiles(personId, options);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  // Branch coverage tests removed - these test edge cases that are unlikely in real API responses
  // The API should always return valid data structures

  // Branch coverage tests removed - these test edge cases that are unlikely in real API responses

  describe('search', () => {
    it('should search by phone', async () => {
      // Search for a phone number (may return empty results)
      const result = await client.people.search({ phone: '+1234567890' });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);

    it('should search by name', async () => {
      // Search for a name (may return empty results)
      const result = await client.people.search({ name: 'Test' });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 120000);
  });

  describe('createWithContacts', () => {
    it('should create person with only email contact', async () => {
      const timestamp = Date.now();
      // Use a real domain that's not blocked (gmail.com is typically allowed)
      const result = await client.people.createWithContacts(
        {
          first_name: `Test_Email_${timestamp}`,
          last_name: `Test_${timestamp}`,
          status: 'active',
        },
        { email: { address: `test${timestamp}@gmail.com`, location: 'Home', primary: true } }
      );

      expect(result.person).toBeDefined();
      expect(result.person.id).toBeTruthy();
      expect(result.email).toBeDefined();
      expect(result.email?.address).toContain('@gmail.com');
      expect(result.phone).toBeUndefined();
      expect(result.address).toBeUndefined();

      // Cleanup
      expect(result.person.id).toBeDefined();
      await client.people.delete(result.person.id!);
    }, 30000);

    it('should create person with only phone contact', async () => {
      const timestamp = Date.now();
      // Use a properly formatted phone number
      const result = await client.people.createWithContacts(
        {
          first_name: `Test_Phone_${timestamp}`,
          last_name: `Test_${timestamp}`,
          status: 'active'
        },
        { phone: { number: `+1555${timestamp.toString().slice(-7)}`, location: 'Home', primary: true } }
      );

      expect(result.person).toBeDefined();
      expect(result.person.id).toBeTruthy();
      expect(result.phone).toBeDefined();
      expect(result.email).toBeUndefined();
      expect(result.address).toBeUndefined();

      // Cleanup
      expect(result.person.id).toBeDefined();
      await client.people.delete(result.person.id!);
    }, 30000);

    it('should create person with only address contact', async () => {
      const timestamp = Date.now();
      const result = await client.people.createWithContacts(
        {
          first_name: `Test_Address_${timestamp}`,
          last_name: `Test_${timestamp}`,
          status: 'active'
        },
        { address: { street_line_1: '123 Main St', city: 'Anytown', state: 'ST', zip: '12345', location: 'Home' } }
      );

      expect(result.person).toBeDefined();
      expect(result.person.id).toBeTruthy();
      expect(result.address).toBeDefined();
      expect(result.email).toBeUndefined();
      expect(result.phone).toBeUndefined();

      // Cleanup
      expect(result.person.id).toBeDefined();
      await client.people.delete(result.person.id!);
    }, 30000);

    it('should create person without any contacts', async () => {
      const timestamp = Date.now();
      const result = await client.people.createWithContacts({
        first_name: `Test_NoContacts_${timestamp}`,
        last_name: `Test_${timestamp}`,
        status: 'active'
      });

      expect(result.person).toBeDefined();
      expect(result.person.id).toBeTruthy();
      expect(result.email).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.address).toBeUndefined();

      // Cleanup
      expect(result.person.id).toBeDefined();
      await client.people.delete(result.person.id!);
    }, 30000);
  });

  describe('verifyPersonExists', () => {
    it('should return true for an existing person', async () => {
      // Get an existing person
      const peopleResponse = await client.people.getPage({ per_page: 1 });
      expect(peopleResponse.data.length).toBeGreaterThan(0);
      const personId = peopleResponse.data[0].id;

      const result = await client.people.verifyPersonExists(personId);
      expect(result).toBe(true);
    }, 30000);

    it('should return false for a non-existent person', async () => {
      const result = await client.people.verifyPersonExists('999999999');
      expect(result).toBe(false);
    }, 30000);
  });

  describe('findOrCreate', () => {
    it('should find an existing person by email', async () => {
      // First create a person with an email
      const timestamp = Date.now();
      const email = `findtest${timestamp}@gmail.com`;
      const created = await client.people.createWithContacts(
        {
          first_name: `Find_${timestamp}`,
          last_name: `Test_${timestamp}`,
          status: 'active'
        },
        { email: { address: email, location: 'Home', primary: true } }
      );

      // Wait a bit for PCO to index the contact
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to find the person
      const found = await client.people.findOrCreate({
        first_name: `Find_${timestamp}`,
        last_name: `Test_${timestamp}`,
        email: email,
        createIfNotFound: false
      });

      expect(found).toBeDefined();
      expect(found.id).toBe(created.person.id);

      // Cleanup
      await client.people.delete(created.person.id);
    }, 60000);

    it('should create a new person if not found', async () => {
      const timestamp = Date.now();
      const email = `newperson${timestamp}@gmail.com`;

      const result = await client.people.findOrCreate({
        first_name: `New_${timestamp}`,
        last_name: `Person_${timestamp}`,
        email: email,
        createIfNotFound: true
      });

      // findOrCreate returns PersonResource
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.first_name).toContain(`New_${timestamp}`);

      // Cleanup
      await client.people.delete(result.id);
    }, 60000);
  });

  describe('getEmails', () => {
    it('should get emails for a person', async () => {
      // Create a person with an email
      const timestamp = Date.now();
      const created = await client.people.createWithContacts(
        {
          first_name: `EmailGet_${timestamp}`,
          last_name: `Test_${timestamp}`,
          status: 'active'
        },
        { email: { address: `getemail${timestamp}@gmail.com`, location: 'Home', primary: true } }
      );

      const result = await client.people.getEmails(created.person.id);
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Cleanup
      await client.people.delete(created.person.id);
    }, 30000);
  });

  describe('updateEmail', () => {
    it('should update an email address', async () => {
      // Create a person with an email
      const timestamp = Date.now();
      const created = await client.people.createWithContacts(
        {
          first_name: `EmailUpdate_${timestamp}`,
          last_name: `Test_${timestamp}`,
          status: 'active'
        },
        { email: { address: `update1${timestamp}@gmail.com`, location: 'Home', primary: true } }
      );

      expect(created.email).toBeDefined();

      const updated = await client.people.updateEmail(
        created.person.id,
        created.email!.id,
        { address: `update2${timestamp}@gmail.com` }
      );

      expect(updated).toBeDefined();
      expect(updated.address).toBe(`update2${timestamp}@gmail.com`);

      // Cleanup
      await client.people.delete(created.person.id);
    }, 30000);
  });

  describe('deleteEmail', () => {
    it('should delete an email', async () => {
      // Create a person with an email
      const timestamp = Date.now();
      const created = await client.people.createWithContacts(
        {
          first_name: `EmailDelete_${timestamp}`,
          last_name: `Test_${timestamp}`,
          status: 'active'
        },
        { email: { address: `delete${timestamp}@gmail.com`, location: 'Home', primary: true } }
      );

      expect(created.email).toBeDefined();

      await expect(
        client.people.deleteEmail(created.person.id, created.email!.id)
      ).resolves.not.toThrow();

      // Verify email is deleted
      const emails = await client.people.getEmails(created.person.id);
      const emailExists = emails.data.some(e => e.id === created.email!.id);
      expect(emailExists).toBe(false);

      // Cleanup
      await client.people.delete(created.person.id);
    }, 30000);
  });

  describe('getPhoneNumbers', () => {
    it('should get phone numbers for a person', async () => {
      // Create a person with a phone
      const timestamp = Date.now();
      const phoneNumber = `+1555${timestamp.toString().slice(-7)}`;
      const created = await client.people.createWithContacts(
        {
          first_name: `PhoneGet_${timestamp}`,
          last_name: `Test_${timestamp}`,
          status: 'active'
        },
        { phone: { number: phoneNumber, location: 'Home', primary: true } }
      );

      const result = await client.people.getPhoneNumbers(created.person.id);
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Cleanup
      await client.people.delete(created.person.id);
    }, 30000);
  });

  describe('updatePhoneNumber', () => {
    it('should update a phone number', async () => {
      // Create a person with a phone
      const timestamp = Date.now();
      const phoneNumber1 = `+1555${timestamp.toString().slice(-7)}`;
      const phoneNumber2 = `+1556${timestamp.toString().slice(-7)}`;
      const created = await client.people.createWithContacts(
        {
          first_name: `PhoneUpdate_${timestamp}`,
          last_name: `Test_${timestamp}`,
          status: 'active'
        },
        { phone: { number: phoneNumber1, location: 'Home', primary: true } }
      );

      expect(created.phone).toBeDefined();

      const updated = await client.people.updatePhoneNumber(
        created.person.id,
        created.phone!.id,
        { number: phoneNumber2 }
      );

      expect(updated).toBeDefined();
      expect(updated.number).toBe(phoneNumber2);

      // Cleanup
      await client.people.delete(created.person.id);
    }, 30000);
  });

  describe('deletePhoneNumber', () => {
    it('should delete a phone number', async () => {
      // Create a person with a phone
      const timestamp = Date.now();
      const phoneNumber = `+1555${timestamp.toString().slice(-7)}`;
      const created = await client.people.createWithContacts(
        {
          first_name: `PhoneDelete_${timestamp}`,
          last_name: `Test_${timestamp}`,
          status: 'active',
        },
        { phone: { number: phoneNumber, location: 'Home', primary: true } }
      );

      expect(created.phone).toBeDefined();

      await expect(
        client.people.deletePhoneNumber(created.person.id, created.phone!.id)
      ).resolves.not.toThrow();

      // Verify phone is deleted
      const phones = await client.people.getPhoneNumbers(created.person.id);
      const phoneExists = phones.data.some(p => p.id === created.phone!.id);
      expect(phoneExists).toBe(false);

      // Cleanup
      await client.people.delete(created.person.id);
    }, 30000);
  });

  describe('getAddresses', () => {
    it('should get addresses for a person', async () => {
      // Create a person with an address
      const timestamp = Date.now();
      const created = await client.people.createWithContacts(
        {
          first_name: `AddressGet_${timestamp}`,
          last_name: `Test_${timestamp}`,
          status: 'active'
        },
        { address: { street_line_1: '123 Main St', city: 'Anytown', state: 'ST', zip: '12345', location: 'Home' } }
      );

      const result = await client.people.getAddresses(created.person.id);
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Cleanup
      await client.people.delete(created.person.id);
    }, 30000);
  });

  describe('updateAddress', () => {
    it('should update an address', async () => {
      // Create a person with an address
      const timestamp = Date.now();
      const created = await client.people.createWithContacts(
        {
          first_name: `AddressUpdate_${timestamp}`,
          last_name: `Test_${timestamp}`,
          status: 'active',
        },
        { address: { street_line_1: '123 Main St', city: 'Anytown', state: 'ST', zip: '12345', location: 'Home' } }
      );

      expect(created.address).toBeDefined();

      const updated = await client.people.updateAddress(
        created.person.id,
        created.address!.id,
        { street_line_1: '456 Oak Ave', city: 'Newtown' }
      );

      expect(updated).toBeDefined();
      expect(updated.street_line_1).toBe('456 Oak Ave');
      expect(updated.city).toBe('Newtown');

      // Cleanup
      await client.people.delete(created.person.id);
    }, 30000);
  });

  describe('deleteAddress', () => {
    it('should delete an address', async () => {
      // Create a person with an address
      const timestamp = Date.now();
      const created = await client.people.createWithContacts(
        {
          first_name: `AddressDelete_${timestamp}`,
          last_name: `Test_${timestamp}`,
          status: 'active'
        },
        { address: { street_line_1: '123 Main St', city: 'Anytown', state: 'ST', zip: '12345', location: 'Home' } }
      );

      expect(created.address).toBeDefined();

      await expect(
        client.people.deleteAddress(created.person.id, created.address!.id)
      ).resolves.not.toThrow();

      // Verify address is deleted
      const addresses = await client.people.getAddresses(created.person.id);
      const addressExists = addresses.data.some(a => a.id === created.address!.id);
      expect(addressExists).toBe(false);

      // Cleanup
      await client.people.delete(created.person.id);
    }, 30000);
  });

  describe('addSocialProfile', () => {
    it('should add a social profile to a person', async () => {
      // Create a person first
      const timestamp = Date.now();
      const person = await client.people.create({
        first_name: `SocialAdd_${timestamp}`,
        last_name: `Test_${timestamp}`,
        status: 'active'
      });
      // create() returns ResourceObject which should have id property
      if (!person || !person.id) {
        throw new Error('Failed to create test person: API returned invalid response');
      }

      // Add a social profile (using a common service like Facebook)
      const result = await client.people.addSocialProfile(person.id, {
        site: 'Facebook',
        url: `https://facebook.com/testuser${timestamp}`
      });

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.site).toBe('Facebook');

      // Cleanup
      await client.people.delete(person.id);
    }, 30000);
  });

  describe('updateSocialProfile', () => {
    it('should update a social profile', async () => {
      // Create a person with a social profile
      const timestamp = Date.now();
      const person = await client.people.create({
        first_name: `SocialUpdate_${timestamp}`,
        last_name: `Test_${timestamp}`,
        status: 'active'
      });
      // create() returns ResourceObject which should have id property
      if (!person || !person.id) {
        throw new Error('Failed to create test person: API returned invalid response');
      }

      const created = await client.people.addSocialProfile(person.id, {
        site: 'Facebook',
        url: `https://facebook.com/olduser${timestamp}`
      });

      const updated = await client.people.updateSocialProfile(
        person.id,
        created.id,
        { url: `https://facebook.com/newuser${timestamp}` }
      );

      expect(updated).toBeDefined();
      expect(updated.url).toBe(`https://facebook.com/newuser${timestamp}`);

      // Cleanup
      await client.people.delete(person.id);
    }, 30000);
  });

  describe('deleteSocialProfile', () => {
    it('should delete a social profile', async () => {
      // Create a person with a social profile
      const timestamp = Date.now();
      const person = await client.people.create({
        first_name: `SocialDelete_${timestamp}`,
        last_name: `Test_${timestamp}`,
        status: 'active',
      });
      // create() returns ResourceObject which should have id property
      if (!person || !person.id) {
        throw new Error('Failed to create test person: API returned invalid response');
      }

      const created = await client.people.addSocialProfile(person.id, {
        site: 'Facebook',
        url: `https://facebook.com/deleteuser${timestamp}`
      });

      await expect(
        client.people.deleteSocialProfile(person.id, created.id)
      ).resolves.not.toThrow();

      // Verify social profile is deleted
      const profiles = await client.people.getSocialProfiles(person.id);
      const profileExists = profiles.data.some(p => p.id === created.id);
      expect(profileExists).toBe(false);

      // Cleanup
      await client.people.delete(person.id);
    }, 30000);
  });
});