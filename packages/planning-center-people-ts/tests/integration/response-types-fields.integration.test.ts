/**
 * Response-types integration tests: Fields module.
 * Asserts against the resolved return type of each function under test.
 */

import typia from 'typia';
import { PcoClient, singleFromCreateResponse } from '../../src';
import { createTestClient } from './test-config';
import { cleanupCreated, fetchIds, type CreatedIds, type IntegrationIds, type ResolvedReturnType } from './response-types-helpers';

describe('Response types: Fields', () => {
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

  it('getTabs response matches declared return type', async () => {
    const res = await client.fields.getTabs();
    typia.assert<ResolvedReturnType<typeof client.fields.getTabs>>(res);
  });

  it('getTabById response matches declared return type', async () => {
    const tabs = await client.fields.getTabs();
    expect(tabs.data.length).toBeGreaterThan(0);
    const res = await client.fields.getTabById(tabs.data[0].id);
    typia.assert<ResolvedReturnType<typeof client.fields.getTabById>>(res);
  });

  it('getAllFieldDefinitions response matches declared return type', async () => {
    const res = await client.fields.getAllFieldDefinitions();
    typia.assert<ResolvedReturnType<typeof client.fields.getAllFieldDefinitions>>(res);
  });

  it('getFieldDefinition response matches declared return type', async () => {
    const list = await client.fields.getAllFieldDefinitions();
    expect(list.data.length).toBeGreaterThan(0);
    const res = await client.fields.getFieldDefinition(list.data[0].id);
    typia.assert<ResolvedReturnType<typeof client.fields.getFieldDefinition>>(res);
  });

  it('getFieldDefinitionBySlug response matches declared return type', async () => {
    const list = await client.fields.getAllFieldDefinitions();
    expect(list.data.length).toBeGreaterThan(0);
    const res = await client.fields.getFieldDefinitionBySlug(list.data[0].slug);
    typia.assert<ResolvedReturnType<typeof client.fields.getFieldDefinitionBySlug>>(res);
  });

  it('getFieldDefinitionByName response matches declared return type', async () => {
    const list = await client.fields.getAllFieldDefinitions();
    expect(list.data.length).toBeGreaterThan(0);
    const res = await client.fields.getFieldDefinitionByName(list.data[0].name);
    typia.assert<ResolvedReturnType<typeof client.fields.getFieldDefinitionByName>>(res);
  });

  it('getFieldOptions response matches declared return type', async () => {
    const list = await client.fields.getAllFieldDefinitions();
    const selectField = list.data.find((f) => f.data_type === 'select');
    expect(selectField).toBeDefined();
    const res = await client.fields.getFieldOptions(selectField!.id);
    typia.assert<ResolvedReturnType<typeof client.fields.getFieldOptions>>(res);
  });

  it('getPersonFieldData response matches declared return type', async () => {
    expect(ids.personId).toBeTruthy();
    // Request include so API returns full field_definition in response.included; otherwise we only get refs { type, id }
    const res = await client.fields.getPersonFieldData(ids.personId, { include: ['field_definition'] });
    typia.assert<ResolvedReturnType<typeof client.fields.getPersonFieldData>>(res);
  });

  it('createTab response matches declared return type', async () => {
    const res = await client.fields.createTab({ name: `TypiaTab_${Date.now()}`, sequence: 99, slug: `typia-${Date.now()}` });
    const single = singleFromCreateResponse(res);
    expect(single).toBeDefined();
    createdIds.tab = single!.id;
    typia.assert<ResolvedReturnType<typeof client.fields.createTab>>(res);
  });

  it('updateTab response matches declared return type', async () => {
    const tabs = await client.fields.getTabs();
    expect(tabs.data.length).toBeGreaterThan(0);
    const res = await client.fields.updateTab(tabs.data[0].id, { name: 'TypiaTabUpdate' });
    typia.assert<ResolvedReturnType<typeof client.fields.updateTab>>(res);
  });

  it('createFieldDefinition response matches declared return type', async () => {
    const tabs = await client.fields.getTabs();
    expect(tabs.data.length).toBeGreaterThan(0);
    const res = await client.fields.createFieldDefinition(tabs.data[0].id, { name: `TypiaFD_${Date.now()}`, data_type: 'string', slug: `typia-fd-${Date.now()}`, sequence: 0, config: null, deleted_at: false });
    const single = singleFromCreateResponse(res);
    expect(single).toBeDefined();
    createdIds.fieldDef = single!.id;
    typia.assert<ResolvedReturnType<typeof client.fields.createFieldDefinition>>(res);
  });

  it('updateFieldDefinition response matches declared return type', async () => {
    const list = await client.fields.getAllFieldDefinitions();
    expect(list.data.length).toBeGreaterThan(0);
    const res = await client.fields.updateFieldDefinition(list.data[0].id, { name: 'TypiaFDUpdate' });
    typia.assert<ResolvedReturnType<typeof client.fields.updateFieldDefinition>>(res);
  });

  it('createFieldOption response matches declared return type', async () => {
    const list = await client.fields.getAllFieldDefinitions();
    const selectField = list.data.find((f) => f.data_type === 'select');
    expect(selectField).toBeDefined();
    const res = await client.fields.createFieldOption(selectField!.id, { value: `TypiaOpt_${Date.now()}`, sequence: 999 });
    typia.assert<ResolvedReturnType<typeof client.fields.createFieldOption>>(res);
  });

  it('setPersonField response matches declared return type', async () => {
    expect(ids.personId).toBeTruthy();
    const list = await client.fields.getAllFieldDefinitions();
    const stringField = list.data.find((f) => f.data_type === 'string');
    expect(stringField).toBeDefined();
    const res = await client.fields.setPersonField(ids.personId, { fieldId: stringField!.id, value: 'Typia setPersonField' });
    typia.assert<ResolvedReturnType<typeof client.fields.setPersonField>>(res);
  });

  it('setPersonFieldById response matches declared return type', async () => {
    expect(ids.personId).toBeTruthy();
    const list = await client.fields.getAllFieldDefinitions();
    const stringField = list.data.find((f) => f.data_type === 'string');
    expect(stringField).toBeDefined();
    const res = await client.fields.setPersonFieldById(ids.personId, stringField!.id, 'Typia value');
    typia.assert<ResolvedReturnType<typeof client.fields.setPersonFieldById>>(res);
  });

  it('setPersonFieldBySlug response matches declared return type', async () => {
    expect(ids.personId).toBeTruthy();
    const list = await client.fields.getAllFieldDefinitions();
    const stringField = list.data.find((f) => f.data_type === 'string');
    expect(stringField).toBeDefined();
    expect(stringField!.slug).toBeTruthy();
    const res = await client.fields.setPersonFieldBySlug(ids.personId, stringField!.slug!, 'Typia by slug');
    typia.assert<ResolvedReturnType<typeof client.fields.setPersonFieldBySlug>>(res);
  });

  it('setPersonFieldByName response matches declared return type', async () => {
    expect(ids.personId).toBeTruthy();
    const list = await client.fields.getAllFieldDefinitions();
    const stringField = list.data.find((f) => f.data_type === 'string');
    expect(stringField).toBeDefined();
    expect(stringField!.name).toBeTruthy();
    const res = await client.fields.setPersonFieldByName(ids.personId, stringField!.name!, 'Typia by name');
    typia.assert<ResolvedReturnType<typeof client.fields.setPersonFieldByName>>(res);
  });

  it('createPersonFieldData response matches declared return type', async () => {
    expect(ids.personId).toBeTruthy();
    const list = await client.fields.getAllFieldDefinitions();
    const stringField = list.data.find((f) => f.data_type === 'string');
    expect(stringField).toBeDefined();
    const res = await client.fields.createPersonFieldData(ids.personId, stringField!.id, 'Typia create');
    typia.assert<ResolvedReturnType<typeof client.fields.createPersonFieldData>>(res);
  });

  it('deleteFieldDefinition runs without throwing', async () => {
    const tabs = await client.fields.getTabs();
    expect(tabs.data.length).toBeGreaterThan(0);
    const res = await client.fields.createFieldDefinition(tabs.data[0].id, { name: `DelFD_${Date.now()}`, data_type: 'string', slug: `del-fd-${Date.now()}`, sequence: 0, config: null, deleted_at: false });
    const id = singleFromCreateResponse(res)?.id;
    expect(id).toBeDefined();
    await expect(client.fields.deleteFieldDefinition(id!)).resolves.not.toThrow();
  });

  it('deleteTab runs without throwing', async () => {
    const res = await client.fields.createTab({ name: `DelTab_${Date.now()}`, sequence: 0, slug: `del-${Date.now()}` });
    const id = singleFromCreateResponse(res)?.id;
    expect(id).toBeDefined();
    await expect(client.fields.deleteTab(id!)).resolves.not.toThrow();
  });

  it('deletePersonFieldData runs without throwing', async () => {
    expect(ids.personId).toBeTruthy();
    const fd = await client.fields.getPersonFieldData(ids.personId);
    expect(fd.data.length).toBeGreaterThan(0);
    await expect(client.fields.deletePersonFieldData(ids.personId, fd.data[0].id)).resolves.not.toThrow();
  });
});
