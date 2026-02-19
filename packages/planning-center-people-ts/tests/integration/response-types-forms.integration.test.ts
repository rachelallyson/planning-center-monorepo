/**
 * Response-types integration tests: Forms module.
 * Asserts against the resolved return type of each function under test.
 */

import typia from 'typia';
import { PcoClient } from '../../src';
import { createTestClient } from './test-config';
import { fetchIds, type IntegrationIds, type ResolvedReturnType } from './response-types-helpers';

describe('Response types: Forms', () => {
  let client: PcoClient;
  let ids: IntegrationIds;

  beforeAll(async () => {
    client = createTestClient();
    ids = await fetchIds(client);
  }, 30000);

  it('getAll response matches declared return type', async () => {
    const res = await client.forms.getAll();
    typia.assert<ResolvedReturnType<typeof client.forms.getAll>>(res);
  });

  it('getPage response matches declared return type', async () => {
    const res = await client.forms.getPage({ per_page: 1 });
    typia.assert<ResolvedReturnType<typeof client.forms.getPage>>(res);
  });

  it('getById response matches declared return type', async () => {
    expect(ids.formId).toBeTruthy();
    const res = await client.forms.getById(ids.formId);
    typia.assert<ResolvedReturnType<typeof client.forms.getById>>(res);
  });

  it('getFormCategory response matches declared return type', async () => {
    expect(ids.formId).toBeTruthy();
    const res = await client.forms.getFormCategory(ids.formId);
    typia.assert<ResolvedReturnType<typeof client.forms.getFormCategory>>(res);
  });

  it('getFormFields response matches declared return type', async () => {
    expect(ids.formId).toBeTruthy();
    const res = await client.forms.getFormFields(ids.formId, { per_page: 1 });
    typia.assert<ResolvedReturnType<typeof client.forms.getFormFields>>(res);
  });

  it('getFormFieldOptions response matches declared return type', async () => {
    expect(ids.formId).toBeTruthy();
    const fields = await client.forms.getFormFields(ids.formId, { per_page: 1 });
    expect(fields.data.length).toBeGreaterThan(0);
    const res = await client.forms.getFormFieldOptions(ids.formId, fields.data[0].id, { per_page: 1 });
    typia.assert<ResolvedReturnType<typeof client.forms.getFormFieldOptions>>(res);
  });

  it('getFormSubmissions response matches declared return type', async () => {
    expect(ids.formId).toBeTruthy();
    const res = await client.forms.getFormSubmissions(ids.formId, { per_page: 1 });
    typia.assert<ResolvedReturnType<typeof client.forms.getFormSubmissions>>(res);
  });

  it('getFormSubmissionById response matches declared return type', async () => {
    expect(ids.formId).toBeTruthy();
    const subs = await client.forms.getFormSubmissions(ids.formId, { per_page: 1 });
    expect(subs.data.length).toBeGreaterThan(0);
    const res = await client.forms.getFormSubmissionById(ids.formId, subs.data[0].id);
    typia.assert<ResolvedReturnType<typeof client.forms.getFormSubmissionById>>(res);
  });

  it('getFormSubmissionValues response matches declared return type', async () => {
    expect(ids.formId).toBeTruthy();
    const subs = await client.forms.getFormSubmissions(ids.formId, { per_page: 1 });
    expect(subs.data.length).toBeGreaterThan(0);
    const res = await client.forms.getFormSubmissionValues(ids.formId, subs.data[0].id, { per_page: 1 });
    typia.assert<ResolvedReturnType<typeof client.forms.getFormSubmissionValues>>(res);
  });
});
