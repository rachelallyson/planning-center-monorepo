/**
 * Response-types integration tests: Campus module.
 * Asserts against the resolved return type of each function under test.
 */

import typia from 'typia';
import { PcoClient, singleFromCreateResponse } from '../../src';
import { createTestClient } from './test-config';
import { fetchIds, type IntegrationIds, type ResolvedReturnType } from './response-types-helpers';

describe('Response types: Campus', () => {
  let client: PcoClient;
  let ids: IntegrationIds;

  beforeAll(async () => {
    client = createTestClient();
    ids = await fetchIds(client);
  }, 30000);

  it('getAll response matches declared return type', async () => {
    const res = await client.campus.getAll();
    typia.assert<ResolvedReturnType<typeof client.campus.getAll>>(res);
  });

  it('getPage response matches declared return type', async () => {
    const res = await client.campus.getPage({ per_page: 1 });
    typia.assert<ResolvedReturnType<typeof client.campus.getPage>>(res);
  });

  it('getById response matches declared return type', async () => {
    expect(ids.campusId).toBeTruthy();
    const res = await client.campus.getById(ids.campusId);
    typia.assert<ResolvedReturnType<typeof client.campus.getById>>(res);
  });

  it('getLists response matches declared return type', async () => {
    expect(ids.campusId).toBeTruthy();
    const res = await client.campus.getLists(ids.campusId, { per_page: 1 });
    typia.assert<ResolvedReturnType<typeof client.campus.getLists>>(res);
  });

  it('getServiceTimes response matches declared return type', async () => {
    expect(ids.campusId).toBeTruthy();
    const res = await client.campus.getServiceTimes(ids.campusId, { per_page: 1 });
    typia.assert<ResolvedReturnType<typeof client.campus.getServiceTimes>>(res);
  });

  it('create response matches declared return type', async () => {
    const res = await client.campus.create({ name: `TypiaCampus_${Date.now()}` });
    typia.assert<ResolvedReturnType<typeof client.campus.create>>(res);
  });

  it('update response matches declared return type', async () => {
    expect(ids.campusId).toBeTruthy();
    const res = await client.campus.update(ids.campusId, { description: 'Typia' });
    typia.assert<ResolvedReturnType<typeof client.campus.update>>(res);
  });

  it('delete runs without throwing', async () => {
    const res = await client.campus.create({ name: `DelCampus_${Date.now()}` });
    const id = singleFromCreateResponse(res)?.id;
    expect(id).toBeDefined();
    await expect(client.campus.delete(id!)).resolves.not.toThrow();
  });
});
