import { 
  getPersonEmails, 
  createPersonEmail, 
  getPersonPhoneNumbers, 
  createPersonPhoneNumber, 
  getPersonAddresses, 
  createPersonAddress, 
  updatePersonAddress, 
  getPersonSocialProfiles, 
  createPersonSocialProfile, 
  deleteSocialProfile 
} from '../../src/people/contacts';

// Mock the core functions
jest.mock('../../src/core', () => ({
  getList: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  del: jest.fn(),
}));

// Get the mocked functions
const { getList: mockGetList, post: mockPost, patch: mockPatch, del: mockDel } = require('../../src/core');

// Mock client state
const mockClient = {
  config: {
    retry: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
    },
  },
  httpClient: {
    request: jest.fn(),
  },
  rateLimiter: {
    waitForSlot: jest.fn().mockResolvedValue(undefined),
  },
};

describe('contacts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPersonEmails', () => {
    it('should get person emails', async () => {
      mockGetList.mockResolvedValueOnce({ data: [{ id: '1', type: 'Email' }] });

      const result = await getPersonEmails(mockClient, '1');

      expect(mockGetList).toHaveBeenCalledWith(
        mockClient, 
        '/people/1/emails', 
        undefined, 
        {
          endpoint: '/people/1/emails',
          method: 'GET',
          personId: '1'
        }
      );
      expect(result).toEqual({ data: [{ id: '1', type: 'Email' }] });
    });
  });

  describe('createPersonEmail', () => {
    it('should create a person email', async () => {
      mockPost.mockResolvedValueOnce({ data: { data: { id: '1', type: 'Email' } } });

      const result = await createPersonEmail(mockClient, '1', { address: 'test@example.com' });

      expect(mockPost).toHaveBeenCalledWith(
        mockClient, 
        '/people/1/emails', 
        { address: 'test@example.com' }, 
        undefined, 
        {
          endpoint: '/people/1/emails',
          method: 'POST',
          personId: '1'
        }
      );
      expect(result).toEqual({ data: { data: { id: '1', type: 'Email' } } });
    });
  });

  describe('getPersonPhoneNumbers', () => {
    it('should get person phone numbers', async () => {
      mockGetList.mockResolvedValueOnce({ data: [{ id: '1', type: 'PhoneNumber' }] });

      const result = await getPersonPhoneNumbers(mockClient, '1');

      expect(mockGetList).toHaveBeenCalledWith(
        mockClient, 
        '/people/1/phone_numbers', 
        undefined, 
        {
          endpoint: '/people/1/phone_numbers',
          method: 'GET',
          personId: '1'
        }
      );
      expect(result).toEqual({ data: [{ id: '1', type: 'PhoneNumber' }] });
    });
  });

  describe('createPersonPhoneNumber', () => {
    it('should create a person phone number', async () => {
      mockPost.mockResolvedValueOnce({ data: { data: { id: '1', type: 'PhoneNumber' } } });

      const result = await createPersonPhoneNumber(mockClient, '1', { number: '555-1234' });

      expect(mockPost).toHaveBeenCalledWith(
        mockClient, 
        '/people/1/phone_numbers', 
        { number: '555-1234' }, 
        undefined, 
        {
          endpoint: '/people/1/phone_numbers',
          method: 'POST',
          personId: '1'
        }
      );
      expect(result).toEqual({ data: { data: { id: '1', type: 'PhoneNumber' } } });
    });
  });

  describe('getPersonAddresses', () => {
    it('should get person addresses', async () => {
      mockGetList.mockResolvedValueOnce({ data: [{ id: '1', type: 'Address' }] });

      const result = await getPersonAddresses(mockClient, '1');

      expect(mockGetList).toHaveBeenCalledWith(
        mockClient, 
        '/people/1/addresses', 
        undefined, 
        {
          endpoint: '/people/1/addresses',
          method: 'GET',
          personId: '1'
        }
      );
      expect(result).toEqual({ data: [{ id: '1', type: 'Address' }] });
    });
  });

  describe('createPersonAddress', () => {
    it('should create a person address', async () => {
      mockPost.mockResolvedValueOnce({ data: { data: { id: '1', type: 'Address' } } });

      const result = await createPersonAddress(mockClient, '1', { street: '123 Main St' });

      expect(mockPost).toHaveBeenCalledWith(
        mockClient, 
        '/people/1/addresses', 
        { street: '123 Main St' }, 
        undefined, 
        {
          endpoint: '/people/1/addresses',
          method: 'POST',
          personId: '1'
        }
      );
      expect(result).toEqual({ data: { data: { id: '1', type: 'Address' } } });
    });
  });

  describe('updatePersonAddress', () => {
    it('should update a person address', async () => {
      mockPatch.mockResolvedValueOnce({ data: { data: { id: '1', type: 'Address' } } });

      const result = await updatePersonAddress(mockClient, '1', '1', { street: '456 Oak Ave' });

      expect(mockPatch).toHaveBeenCalledWith(
        mockClient, 
        '/people/1/addresses/1', 
        { street: '456 Oak Ave' }, 
        undefined, 
        {
          endpoint: '/people/1/addresses/1',
          method: 'PATCH',
          personId: '1'
        }
      );
      expect(result).toEqual({ data: { data: { id: '1', type: 'Address' } } });
    });
  });

  describe('getPersonSocialProfiles', () => {
    it('should get person social profiles', async () => {
      mockGetList.mockResolvedValueOnce({ data: [{ id: '1', type: 'SocialProfile' }] });

      const result = await getPersonSocialProfiles(mockClient, '1');

      expect(mockGetList).toHaveBeenCalledWith(
        mockClient, 
        '/people/1/social_profiles', 
        undefined, 
        {
          endpoint: '/people/1/social_profiles',
          method: 'GET',
          personId: '1'
        }
      );
      expect(result).toEqual({ data: [{ id: '1', type: 'SocialProfile' }] });
    });
  });

  describe('createPersonSocialProfile', () => {
    it('should create a person social profile', async () => {
      mockPost.mockResolvedValueOnce({ data: { data: { id: '1', type: 'SocialProfile' } } });

      const result = await createPersonSocialProfile(mockClient, '1', { site: 'facebook', username: 'johndoe' });

      expect(mockPost).toHaveBeenCalledWith(
        mockClient, 
        '/people/1/social_profiles', 
        { site: 'facebook', username: 'johndoe' }, 
        undefined, 
        {
          endpoint: '/people/1/social_profiles',
          method: 'POST',
          personId: '1'
        }
      );
      expect(result).toEqual({ data: { data: { id: '1', type: 'SocialProfile' } } });
    });
  });

  describe('deleteSocialProfile', () => {
    it('should delete a social profile', async () => {
      mockDel.mockResolvedValueOnce({ data: { data: { id: '1', type: 'SocialProfile' } } });

      const result = await deleteSocialProfile(mockClient, '1');

      expect(mockDel).toHaveBeenCalledWith(
        mockClient, 
        '/social_profiles/1', 
        {
          endpoint: '/social_profiles/1',
          method: 'DELETE'
        }
      );
      expect(result).toEqual({ data: { data: { id: '1', type: 'SocialProfile' } } });
    });
  });
});
