import { ContactsModule } from '../../src/modules/contacts';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('ContactsModule', () => {
  let module: ContactsModule;
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

    module = new ContactsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(ContactsModule);
    });
  });

  describe('getAllEmails', () => {
    it('should fetch all emails', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Email', attributes: { address: 'test@example.com' } }],
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

      const result = await module.getAllEmails();

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getEmailById', () => {
    it('should fetch email by ID', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Email', attributes: { address: 'test@example.com' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getEmailById('1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('createEmail', () => {
    it('should create a new email', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Email', attributes: { address: 'new@example.com' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const emailData = { address: 'new@example.com' };
      const result = await module.createEmail(emailData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('updateEmail', () => {
    it('should update an existing email', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Email', attributes: { address: 'updated@example.com' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const updateData = { address: 'updated@example.com' };
      const result = await module.updateEmail('1', updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('deleteEmail', () => {
    it('should delete an email', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: null,
        status: 204,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.deleteEmail('1');

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getAllPhoneNumbers', () => {
    it('should fetch all phone numbers', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'PhoneNumber', attributes: { number: '555-1234' } }],
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

      const result = await module.getAllPhoneNumbers();

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getPhoneNumberById', () => {
    it('should fetch phone number by ID', async () => {
      const mockResponse = {
        data: { id: '1', type: 'PhoneNumber', attributes: { number: '555-1234' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getPhoneNumberById('1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('createPhoneNumber', () => {
    it('should create a new phone number', async () => {
      const mockResponse = {
        data: { id: '1', type: 'PhoneNumber', attributes: { number: '555-5678' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const phoneData = { number: '555-5678' };
      const result = await module.createPhoneNumber(phoneData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('updatePhoneNumber', () => {
    it('should update an existing phone number', async () => {
      const mockResponse = {
        data: { id: '1', type: 'PhoneNumber', attributes: { number: '555-9999' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const updateData = { number: '555-9999' };
      const result = await module.updatePhoneNumber('1', updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('deletePhoneNumber', () => {
    it('should delete a phone number', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: null,
        status: 204,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.deletePhoneNumber('1');

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getAllAddresses', () => {
    it('should fetch all addresses', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Address', attributes: { street: '123 Main St' } }],
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

      const result = await module.getAllAddresses();

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getAddressById', () => {
    it('should fetch address by ID', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Address', attributes: { street: '123 Main St' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getAddressById('1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('createAddress', () => {
    it('should create a new address', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Address', attributes: { street: '456 Oak Ave' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const addressData = { street: '456 Oak Ave' };
      const result = await module.createAddress(addressData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('updateAddress', () => {
    it('should update an existing address', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Address', attributes: { street: '789 Pine St' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const updateData = { street: '789 Pine St' };
      const result = await module.updateAddress('1', updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('deleteAddress', () => {
    it('should delete an address', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: null,
        status: 204,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.deleteAddress('1');

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getAllSocialProfiles', () => {
    it('should fetch all social profiles', async () => {
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

      const result = await module.getAllSocialProfiles();

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getSocialProfileById', () => {
    it('should fetch social profile by ID', async () => {
      const mockResponse = {
        data: { id: '1', type: 'SocialProfile', attributes: { provider: 'facebook' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getSocialProfileById('1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('createSocialProfile', () => {
    it('should create a new social profile', async () => {
      const mockResponse = {
        data: { id: '1', type: 'SocialProfile', attributes: { provider: 'twitter' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const socialProfileData = { provider: 'twitter' };
      const result = await module.createSocialProfile(socialProfileData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('updateSocialProfile', () => {
    it('should update an existing social profile', async () => {
      const mockResponse = {
        data: { id: '1', type: 'SocialProfile', attributes: { provider: 'instagram' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const updateData = { provider: 'instagram' };
      const result = await module.updateSocialProfile('1', updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('deleteSocialProfile', () => {
    it('should delete a social profile', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: null,
        status: 204,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.deleteSocialProfile('1');

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });
});

