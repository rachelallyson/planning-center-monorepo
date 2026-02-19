/**
 * Response-types integration tests: Lists module.
 * Asserts against the resolved return type of each function under test.
 */

import typia from 'typia';
import { PcoClient, singleFromCreateResponse } from '../../src';
import { createTestClient } from './test-config';
import { cleanupCreated, fetchIds, type CreatedIds, type IntegrationIds, type ResolvedReturnType } from './response-types-helpers';

describe('Response types: Lists', () => {
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

  it('getAll response matches declared return type', async () => {
    const res = await client.lists.getAll();
    typia.assert<ResolvedReturnType<typeof client.lists.getAll>>(res);
  });

  it('getPage response matches declared return type', async () => {
    const res = await client.lists.getPage({ per_page: 1 });
    typia.assert<ResolvedReturnType<typeof client.lists.getPage>>(res);
  });

  it('getById response matches declared return type', async () => {
    expect(ids.listId).toBeTruthy();
    const res = await client.lists.getById(ids.listId);
    typia.assert<ResolvedReturnType<typeof client.lists.getById>>(res);
  });

  it('getListCategories response matches declared return type', async () => {
    const res = await client.lists.getListCategories({ per_page: 1 });
    typia.assert<ResolvedReturnType<typeof client.lists.getListCategories>>(res);
  });

  it('getListCategoryById response matches declared return type', async () => {
    const list = await client.lists.getListCategories({ per_page: 1 });
    expect(list.data.length).toBeGreaterThan(0);
    const res = await client.lists.getListCategoryById(list.data[0].id);
    typia.assert<ResolvedReturnType<typeof client.lists.getListCategoryById>>(res);
  });

  it('createListCategory response matches declared return type', async () => {
    const existing = await client.lists.getListCategories({ per_page: 1 });
    expect(existing.data.length).toBeGreaterThan(0);
    const orgId = existing.data[0].organization_id ?? '1';
    const res = await client.lists.createListCategory({ name: `TypiaCat_${Date.now()}`, organization_id: orgId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    const single = singleFromCreateResponse(res);
    expect(single).toBeDefined();
    createdIds.listCategory = single!.id;
    typia.assert<ResolvedReturnType<typeof client.lists.createListCategory>>(res);
  });

  it('updateListCategory response matches declared return type', async () => {
    const list = await client.lists.getListCategories({ per_page: 1 });
    expect(list.data.length).toBeGreaterThan(0);
    const res = await client.lists.updateListCategory(list.data[0].id, { name: 'TypiaCatUpdate' });
    typia.assert<ResolvedReturnType<typeof client.lists.updateListCategory>>(res);
  });

  it('getPeople response matches declared return type', async () => {
    expect(ids.listId).toBeTruthy();
    const res = await client.lists.getPeople(ids.listId);
    typia.assert<ResolvedReturnType<typeof client.lists.getPeople>>(res);
  });

  it('getRules response matches declared return type', async () => {
    expect(ids.listId).toBeTruthy();
    const res = await client.lists.getRules(ids.listId);
    typia.assert<ResolvedReturnType<typeof client.lists.getRules>>(res);
  });

  it('refresh response matches declared return type', async () => {
    expect(ids.listId).toBeTruthy();
    const res = await client.lists.refresh(ids.listId);
    typia.assert<ResolvedReturnType<typeof client.lists.refresh>>(res);
  });

  it('deleteListCategory runs without throwing', async () => {
    const existing = await client.lists.getListCategories({ per_page: 1 });
    expect(existing.data.length).toBeGreaterThan(0);
    const orgId = existing.data[0].organization_id ?? '1';
    const res = await client.lists.createListCategory({ name: `DelCat_${Date.now()}`, organization_id: orgId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    const id = singleFromCreateResponse(res)?.id;
    expect(id).toBeDefined();
    await expect(client.lists.deleteListCategory(id!)).resolves.not.toThrow();
  });
});
