/**
 * Response-types integration tests: Households module.
 * Asserts against the resolved return type of each function under test.
 */

import typia from 'typia';
import { PcoClient, singleFromCreateResponse } from '../../src';
import { createTestClient } from './test-config';
import { cleanupCreated, fetchIds, type CreatedIds, type IntegrationIds, type ResolvedReturnType } from './response-types-helpers';

describe('Response types: Households', () => {
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
    const res = await client.households.getAll();
    typia.assert<ResolvedReturnType<typeof client.households.getAll>>(res);
  });

  it('getPage response matches declared return type', async () => {
    const res = await client.households.getPage({ per_page: 1 });
    typia.assert<ResolvedReturnType<typeof client.households.getPage>>(res);
  });

  it('getById response matches declared return type', async () => {
    expect(ids.householdId).toBeTruthy();
    const res = await client.households.getById(ids.householdId);
    typia.assert<ResolvedReturnType<typeof client.households.getById>>(res);
  });

  it('create response matches declared return type', async () => {
    const res = await client.households.create({ name: `TypiaHousehold_${Date.now()}` });
    const single = singleFromCreateResponse(res);
    expect(single).toBeDefined();
    createdIds.household = single!.id;
    typia.assert<ResolvedReturnType<typeof client.households.create>>(res);
  });

  it('update response matches declared return type', async () => {
    expect(ids.householdId).toBeTruthy();
    const res = await client.households.update(ids.householdId, { name: 'TypiaHouseholdUpdate' });
    typia.assert<ResolvedReturnType<typeof client.households.update>>(res);
  });

  it('delete runs without throwing', async () => {
    const res = await client.households.create({ name: `DeleteMe_${Date.now()}` });
    const id = singleFromCreateResponse(res)?.id;
    expect(id).toBeDefined();
    await expect(client.households.delete(id!)).resolves.not.toThrow();
  });
});
