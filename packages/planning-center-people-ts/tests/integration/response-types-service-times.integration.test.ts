/**
 * Response-types integration tests: Service times module.
 * Asserts against the resolved return type of each function under test.
 */

import typia from 'typia';
import { PcoClient, singleFromCreateResponse } from '../../src';
import { createTestClient } from './test-config';
import { fetchIds, type IntegrationIds, type ResolvedReturnType } from './response-types-helpers';

describe('Response types: Service times', () => {
  let client: PcoClient;
  let ids: IntegrationIds;

  beforeAll(async () => {
    client = createTestClient();
    ids = await fetchIds(client);
  }, 30000);

  it('getAll response matches declared return type', async () => {
    expect(ids.campusId).toBeTruthy();
    const res = await client.serviceTime.getAll(ids.campusId);
    typia.assert<ResolvedReturnType<typeof client.serviceTime.getAll>>(res);
  });

  it('getPage response matches declared return type', async () => {
    expect(ids.campusId).toBeTruthy();
    const res = await client.serviceTime.getPage(ids.campusId, { per_page: 1 });
    typia.assert<ResolvedReturnType<typeof client.serviceTime.getPage>>(res);
  });

  it('getById response matches declared return type', async () => {
    expect(ids.campusId).toBeTruthy();
    const list = await client.serviceTime.getPage(ids.campusId, { per_page: 1 });
    expect(list.data.length).toBeGreaterThan(0);
    const res = await client.serviceTime.getById(ids.campusId, list.data[0].id);
    typia.assert<ResolvedReturnType<typeof client.serviceTime.getById>>(res);
  });

  it('create response matches declared return type', async () => {
    expect(ids.campusId).toBeTruthy();
    const res = await client.serviceTime.create(ids.campusId, { day: 0, start_time: 600, description: 'Typia' });
    typia.assert<ResolvedReturnType<typeof client.serviceTime.create>>(res);
  });

  it('update response matches declared return type', async () => {
    expect(ids.campusId).toBeTruthy();
    const list = await client.serviceTime.getPage(ids.campusId, { per_page: 1 });
    expect(list.data.length).toBeGreaterThan(0);
    const res = await client.serviceTime.update(ids.campusId, list.data[0].id, { description: 'TypiaUpdate' });
    typia.assert<ResolvedReturnType<typeof client.serviceTime.update>>(res);
  });

  it('delete runs without throwing', async () => {
    expect(ids.campusId).toBeTruthy();
    const res = await client.serviceTime.create(ids.campusId, { day: 1, start_time: 720, description: 'Del' });
    const id = singleFromCreateResponse(res)?.id;
    expect(id).toBeDefined();
    await expect(client.serviceTime.delete(ids.campusId, id!)).resolves.not.toThrow();
  });
});
