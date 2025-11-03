import { PeopleModule } from '../../src/modules/people';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('PeopleModule', () => {
  let module: PeopleModule;
  let mockHttpClient: jest.Mocked<PcoHttpClient>;
  let mockPaginationHelper: jest.Mocked<PaginationHelper>;
  let mockEventEmitter: jest.Mocked<PcoEventEmitter>;

  beforeEach(() => {
    mockHttpClient = {
      request: jest.fn(),
    } as any;

    mockPaginationHelper = {
      getAllPages: jest.fn(),
      getPage: jest.fn(),
    } as any;

    mockEventEmitter = {
      emit: jest.fn(),
    } as any;

    module = new PeopleModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(PeopleModule);
    });
  });

  describe('getAll', () => {
    it('should fetch all people with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getAll();

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should fetch people with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const options = {
        where: { status: 'active' },
        include: ['emails', 'phone_numbers'],
        perPage: 10,
        page: 1,
      };

      await module.getAll(options);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getAllPagesPaginated', () => {
    it('should get all people with pagination', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse);

      const result = await module.getAllPagesPaginated();

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/people', {}, undefined);
    });

    it('should get all people with filtering and pagination options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse);

      const options = {
        where: { status: 'active' },
        include: ['emails', 'phone_numbers'],
        perPage: 10,
        page: 1,
      };

      const paginationOptions = {
        maxPages: 5,
        onProgress: jest.fn(),
      };

      await module.getAllPagesPaginated(options, paginationOptions);

      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith(
        '/people',
        {
          'where[status]': 'active',
          include: 'emails,phone_numbers',
          // only include per_page if the implementation does
        },
        paginationOptions
      );
    });
  });

  describe('getById', () => {
    it('should fetch person by ID without include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getById('1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should fetch person by ID with include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getById('1', ['emails', 'phone_numbers']);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new person', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const personData = { firstName: 'John', lastName: 'Doe' };
      const result = await module.create(personData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing person', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Person', attributes: { first_name: 'Jane', last_name: 'Doe' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const updateData = { firstName: 'Jane' };
      const result = await module.update('1', updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a person', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: null,
        status: 204,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.delete('1');

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getPrimaryCampus', () => {
    it('should get primary campus for a person', async () => {
      // First mock - getById returns a Person with relationships.primary_campus
      const personData = {
        id: '1',
        type: 'Person',
        attributes: { first_name: 'John', last_name: 'Doe' },
        relationships: { primary_campus: { data: { id: 'campus-1', type: 'Campus' } } },
      };
      // Second mock - fetch the campus resource
      const campusData = { id: 'campus-1', type: 'Campus', attributes: { name: 'Main Campus' } };
      mockHttpClient.request
        .mockResolvedValueOnce({ data: { data: personData }, status: 200, headers: {}, requestId: 't1', duration: 100 })
        .mockResolvedValueOnce({ data: { data: campusData }, status: 200, headers: {}, requestId: 't2', duration: 100 });

      const result = await module.getPrimaryCampus('1');
      expect(result).toEqual(campusData);
    });
    it('should return null when no primary campus', async () => {
      const personData = {
        id: '1',
        type: 'Person',
        attributes: { first_name: 'John', last_name: 'Doe' },
        relationships: {},
      };
      mockHttpClient.request.mockResolvedValueOnce({ data: { data: personData }, status: 200, headers: {}, requestId: 't1', duration: 100 });
      const result = await module.getPrimaryCampus('1');
      expect(result).toBeNull();
    });
  });

  describe('setPrimaryCampus', () => {
    it('should set primary campus for a person', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: mockResponse.data },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.setPrimaryCampus('person-1', 'campus-1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('removePrimaryCampus', () => {
    it('should remove primary campus for a person', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: mockResponse.data },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.removePrimaryCampus('person-1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getHousehold', () => {
    it('should get household for a person', async () => {
      // First mock - getById returns a Person with relationships.household
      const personData = {
        id: '1',
        type: 'Person',
        attributes: { first_name: 'John', last_name: 'Doe' },
        relationships: { household: { data: { id: 'household-1', type: 'Household' } } },
      };
      // Second mock - fetch the household resource
      const householdData = { id: 'household-1', type: 'Household', attributes: { name: 'Doe Family' } };
      mockHttpClient.request
        .mockResolvedValueOnce({ data: { data: personData }, status: 200, headers: {}, requestId: 't1', duration: 100 })
        .mockResolvedValueOnce({ data: { data: householdData }, status: 200, headers: {}, requestId: 't2', duration: 100 });

      const result = await module.getHousehold('1');
      expect(result).toEqual(householdData);
    });
    it('should return null when no household', async () => {
      const personData = {
        id: '1',
        type: 'Person',
        attributes: { first_name: 'John', last_name: 'Doe' },
        relationships: {},
      };
      mockHttpClient.request.mockResolvedValueOnce({ data: { data: personData }, status: 200, headers: {}, requestId: 't1', duration: 100 });
      const result = await module.getHousehold('1');
      expect(result).toBeNull();
    });
  });

  describe('setHousehold', () => {
    it('should set household for a person', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: mockResponse.data },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.setHousehold('person-1', 'household-1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('removeFromHousehold', () => {
    it('should remove person from household', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: mockResponse.data },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.removeFromHousehold('person-1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getHouseholdMembers', () => {
    it('should get household members', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getHouseholdMembers('household-1');

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getByCampus', () => {
    it('should get people by campus', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getByCampus('campus-1');

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getWorkflowCards', () => {
    it('should get workflow cards for a person', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'WorkflowCard', attributes: { name: 'Card 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const options = {
        perPage: 10,
        page: 1,
      };

      const result = await module.getWorkflowCards('person-1', options);

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getNotes', () => {
    it('should get notes for a person', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Note', attributes: { content: 'Note 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const options = {
        perPage: 10,
        page: 1,
      };

      const result = await module.getNotes('person-1', options);

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getFieldData', () => {
    it('should get field data for a person', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FieldDatum', attributes: { value: 'Value 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const options = {
        perPage: 10,
        page: 1,
      };

      const result = await module.getFieldData('person-1', options);

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getSocialProfiles', () => {
    it('should get social profiles for a person', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'SocialProfile', attributes: { provider: 'facebook' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const options = {
        perPage: 10,
        page: 1,
      };

      const result = await module.getSocialProfiles('person-1', options);

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getPrimaryCampus branch coverage', () => {
    it('should return null when campus data is an array', async () => {
      const personData = {
        id: '1',
        type: 'Person',
        attributes: { first_name: 'John', last_name: 'Doe' },
        relationships: { primary_campus: { data: [{ id: 'campus-1', type: 'Campus' }] } },
      };
      mockHttpClient.request.mockResolvedValueOnce({ data: { data: personData }, status: 200, headers: {}, requestId: 't1', duration: 100 });
      const result = await module.getPrimaryCampus('1');
      expect(result).toBeNull();
    });

    it('should return null when campus data exists but has no id', async () => {
      const personData = {
        id: '1',
        type: 'Person',
        attributes: { first_name: 'John', last_name: 'Doe' },
        relationships: { primary_campus: { data: { type: 'Campus' } } },
      };
      mockHttpClient.request.mockResolvedValueOnce({ data: { data: personData }, status: 200, headers: {}, requestId: 't1', duration: 100 });
      const result = await module.getPrimaryCampus('1');
      expect(result).toBeNull();
    });
  });

  describe('getHousehold branch coverage', () => {
    it('should return null when household data is an array', async () => {
      const personData = {
        id: '1',
        type: 'Person',
        attributes: { first_name: 'John', last_name: 'Doe' },
        relationships: { household: { data: [{ id: 'household-1', type: 'Household' }] } },
      };
      mockHttpClient.request.mockResolvedValueOnce({ data: { data: personData }, status: 200, headers: {}, requestId: 't1', duration: 100 });
      const result = await module.getHousehold('1');
      expect(result).toBeNull();
    });

    it('should return null when household data exists but has no id', async () => {
      const personData = {
        id: '1',
        type: 'Person',
        attributes: { first_name: 'John', last_name: 'Doe' },
        relationships: { household: { data: { type: 'Household' } } },
      };
      mockHttpClient.request.mockResolvedValueOnce({ data: { data: personData }, status: 200, headers: {}, requestId: 't1', duration: 100 });
      const result = await module.getHousehold('1');
      expect(result).toBeNull();
    });
  });

  describe('search branch coverage', () => {
    it('should search by phone only', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.search({ phone: '+1234567890' });
      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: expect.stringContaining('/people'),
        })
      );
    });

    it('should search by name only when no email or phone', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.search({ name: 'John Doe' });
      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('createWithContacts branch coverage', () => {
    it('should create person with only email contact', async () => {
      const personData = { id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } };
      const emailData = { id: 'e1', type: 'Email', attributes: { address: 'john@example.com' } };

      mockHttpClient.request
        .mockResolvedValueOnce({ data: { data: personData }, status: 201, headers: {}, requestId: 't1', duration: 100 })
        .mockResolvedValueOnce({ data: { data: emailData }, status: 201, headers: {}, requestId: 't2', duration: 100 });

      const result = await module.createWithContacts(
        { firstName: 'John', lastName: 'Doe' },
        { email: { address: 'john@example.com', primary: true } }
      );

      expect(result.person).toEqual(personData);
      expect(result.email).toEqual(emailData);
      expect(result.phone).toBeUndefined();
      expect(result.address).toBeUndefined();
    });

    it('should create person with only phone contact', async () => {
      const personData = { id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } };
      const phoneData = { id: 'p1', type: 'PhoneNumber', attributes: { number: '+1234567890' } };

      mockHttpClient.request
        .mockResolvedValueOnce({ data: { data: personData }, status: 201, headers: {}, requestId: 't1', duration: 100 })
        .mockResolvedValueOnce({ data: { data: phoneData }, status: 201, headers: {}, requestId: 't2', duration: 100 });

      const result = await module.createWithContacts(
        { firstName: 'John', lastName: 'Doe' },
        { phone: { number: '+1234567890', primary: true } }
      );

      expect(result.person).toEqual(personData);
      expect(result.phone).toEqual(phoneData);
      expect(result.email).toBeUndefined();
      expect(result.address).toBeUndefined();
    });

    it('should create person with only address contact', async () => {
      const personData = { id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } };
      const addressData = { id: 'a1', type: 'Address', attributes: { street: '123 Main St' } };

      mockHttpClient.request
        .mockResolvedValueOnce({ data: { data: personData }, status: 201, headers: {}, requestId: 't1', duration: 100 })
        .mockResolvedValueOnce({ data: { data: addressData }, status: 201, headers: {}, requestId: 't2', duration: 100 });

      const result = await module.createWithContacts(
        { firstName: 'John', lastName: 'Doe' },
        { address: { street: '123 Main St', city: 'Anytown', state: 'ST', zip: '12345' } }
      );

      expect(result.person).toEqual(personData);
      expect(result.address).toEqual(addressData);
      expect(result.email).toBeUndefined();
      expect(result.phone).toBeUndefined();
    });

    it('should create person without any contacts', async () => {
      const personData = { id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } };

      mockHttpClient.request.mockResolvedValueOnce({ data: { data: personData }, status: 201, headers: {}, requestId: 't1', duration: 100 });

      const result = await module.createWithContacts({ firstName: 'John', lastName: 'Doe' });

      expect(result.person).toEqual(personData);
      expect(result.email).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.address).toBeUndefined();
    });
  });
});