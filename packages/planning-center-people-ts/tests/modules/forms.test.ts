import { PcoClient } from '../../src';
import { createTestClient } from '../integration/test-config';

describe('FormsModule - Real Integration Tests', () => {
  let client: PcoClient;

  beforeAll(async () => {
    client = createTestClient();
  }, 30000);

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(client).toBeDefined();
      expect(client.forms).toBeDefined();
    });
  });

  describe('getAll', () => {
    it('should fetch all forms with default parameters', async () => {
      const result = await client.forms.getAll();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);

    it('should fetch forms with filtering options', async () => {
      const result = await client.forms.getAll({
        include: ['category'],
      });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getPage', () => {
    it('should fetch a single page of forms', async () => {
      const result = await client.forms.getPage({ per_page: 25, page: 1 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(25);
    }, 30000);
  });

  describe('getById', () => {
    it('should fetch form by ID without include', async () => {
      // First get a form ID
      const formsResponse = await client.forms.getPage({ per_page: 1 });
      expect(formsResponse.data.length).toBeGreaterThan(0);
      const formId = formsResponse.data[0].id;

      const result = await client.forms.getById(formId);

      expect(result).toBeDefined();
      expect(result.id).toBe(formId);
      expect(result.type).toBe('Form');
      // FlattenedResource doesn't have 'attributes' - attributes are flattened to top level
      // Check for a flattened attribute instead (e.g., name)
      expect(result).toHaveProperty('name');
    }, 30000);

    it('should fetch form by ID with include', async () => {
      // First get a form ID
      const formsResponse = await client.forms.getPage({ per_page: 1 });
      expect(formsResponse.data.length).toBeGreaterThan(0);
      const formId = formsResponse.data[0].id;

      const result = await client.forms.getById(formId, { include: ['category'] });

      expect(result).toBeDefined();
      expect(result.id).toBe(formId);
      expect(result.type).toBe('Form');
    }, 30000);
  });

  describe('getFormCategory', () => {
    it('should get form category for a form', async () => {
      // First get a form ID
      const formsResponse = await client.forms.getPage({ per_page: 1 });
      expect(formsResponse.data.length).toBeGreaterThan(0);
      const formId = formsResponse.data[0].id;

      const result = await client.forms.getFormCategory(formId);

      expect(result).toBeDefined();
      expect(result.type).toBe('FormCategory');
      // FlattenedResource doesn't have 'attributes' - attributes are flattened to top level
      expect(result).toHaveProperty('name');
    }, 30000);
  });

  describe('getFormFields', () => {
    it('should get form fields for a form', async () => {
      // First get a form ID
      const formsResponse = await client.forms.getPage({ per_page: 1 });
      expect(formsResponse.data.length).toBeGreaterThan(0);
      const formId = formsResponse.data[0].id;

      const result = await client.forms.getFormFields(formId);

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      // Note: getFormFields returns { data } only, not { data, meta, links }
    }, 90000);

    it('should get form fields with parameters', async () => {
      // First get a form ID
      const formsResponse = await client.forms.getPage({ per_page: 1 });
      expect(formsResponse.data.length).toBeGreaterThan(0);
      const formId = formsResponse.data[0].id;

      const result = await client.forms.getFormFields(formId, {
        include: ['form_field_options'],
        per_page: 10,
        page: 1,
      });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    }, 60000);
  });

  describe('getFormFieldOptions', () => {
    it('should get form field options for a form field', async () => {
      // First get a form ID and field ID
      const formsResponse = await client.forms.getPage({ per_page: 1 });
      expect(formsResponse.data.length).toBeGreaterThan(0);
      const formId = formsResponse.data[0].id;

      const fieldsResponse = await client.forms.getFormFields(formId);
      expect(fieldsResponse.data.length).toBeGreaterThan(0);
      const fieldId = fieldsResponse.data[0].id;

      const result = await client.forms.getFormFieldOptions(formId, fieldId);

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      // Note: getFormFieldOptions returns { data } only, not { data, meta, links }
    }, 30000);

    it('should get form field options with parameters', async () => {
      // First get a form ID and field ID
      const formsResponse = await client.forms.getPage({ per_page: 1 });
      expect(formsResponse.data.length).toBeGreaterThan(0);
      const formId = formsResponse.data[0].id;
      const fieldsResponse = await client.forms.getFormFields(formId);
      expect(fieldsResponse.data.length).toBeGreaterThan(0);
      const fieldId = fieldsResponse.data[0].id;

      const result = await client.forms.getFormFieldOptions(formId, fieldId, {
        per_page: 10,
        page: 1,
      });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      // Note: getFormFieldOptions returns { data } only
    }, 30000);
  });

  describe('getFormSubmissions', () => {
    it('should get form submissions for a form', async () => {
      // First get a form ID
      const formsResponse = await client.forms.getPage({ per_page: 1 });
      expect(formsResponse.data.length).toBeGreaterThan(0);
      const formId = formsResponse.data[0].id;

      const result = await client.forms.getFormSubmissions(formId);

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      // Note: getFormSubmissions returns { data } only, not { data, meta, links }
    }, 30000);

    it('should get form submissions with parameters', async () => {
      // First get a form ID
      const formsResponse = await client.forms.getPage({ per_page: 1 });
      expect(formsResponse.data.length).toBeGreaterThan(0);
      const formId = formsResponse.data[0].id;

      const result = await client.forms.getFormSubmissions(formId, {
        include: ['form_submission_values'],
        per_page: 10,
        page: 1,
      });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      // Note: getFormSubmissions returns { data } only
      // Note: getFormSubmissions returns { data } only
    }, 30000);
  });

  describe('getFormSubmissionById', () => {
    it('should get form submission by ID without include', async () => {
      // First get a form ID and submission ID
      const formsResponse = await client.forms.getPage({ per_page: 1 });
      expect(formsResponse.data.length).toBeGreaterThan(0);
      const formId = formsResponse.data[0].id;

      const submissionsResponse = await client.forms.getFormSubmissions(formId);
      expect(submissionsResponse.data.length).toBeGreaterThan(0);
      const submissionId = submissionsResponse.data[0].id;

      const result = await client.forms.getFormSubmissionById(formId, submissionId);

      expect(result).toBeDefined();
      expect(result.id).toBe(submissionId);
      expect(result.type).toBe('FormSubmission');
      // FlattenedResource doesn't have 'attributes' - attributes are flattened to top level
      // FormSubmission may not have 'submitted_at' - check for a property that exists
      expect(result).toHaveProperty('created_at');
    }, 30000);

    it('should get form submission by ID with include', async () => {
      // First get a form ID and submission ID
      const formsResponse = await client.forms.getPage({ per_page: 1 });
      expect(formsResponse.data.length).toBeGreaterThan(0);
      const formId = formsResponse.data[0].id;

      const submissionsResponse = await client.forms.getFormSubmissions(formId);
      expect(submissionsResponse.data.length).toBeGreaterThan(0);
      const submissionId = submissionsResponse.data[0].id;

      const result = await client.forms.getFormSubmissionById(formId, submissionId, { include: ['form_submission_values'] });

      expect(result).toBeDefined();
      expect(result.id).toBe(submissionId);
      expect(result.type).toBe('FormSubmission');
    }, 30000);
  });

  describe('getFormSubmissionValues', () => {
    it('should get form submission values for a form submission', async () => {
      // First get a form ID and submission ID
      const formsResponse = await client.forms.getPage({ per_page: 1 });
      expect(formsResponse.data.length).toBeGreaterThan(0);
      const formId = formsResponse.data[0].id;

      const submissionsResponse = await client.forms.getFormSubmissions(formId);
      expect(submissionsResponse.data.length).toBeGreaterThan(0);
      const submissionId = submissionsResponse.data[0].id;

      const result = await client.forms.getFormSubmissionValues(formId, submissionId);

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      // Note: getFormSubmissionValues returns { data } only, not { data, meta, links }
    }, 30000);

    it('should get form submission values with parameters', async () => {
      // First get a form ID and submission ID
      const formsResponse = await client.forms.getPage({ per_page: 1 });
      expect(formsResponse.data.length).toBeGreaterThan(0);
      const formId = formsResponse.data[0].id;

      const submissionsResponse = await client.forms.getFormSubmissions(formId);
      expect(submissionsResponse.data.length).toBeGreaterThan(0);
      const submissionId = submissionsResponse.data[0].id;

      const result = await client.forms.getFormSubmissionValues(formId, submissionId, {
        per_page: 10,
        page: 1,
      });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      // Note: getFormSubmissionValues returns { data } only
    }, 30000);
  });
});
