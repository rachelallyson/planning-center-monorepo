/**
 * Response-types integration tests: Reports module.
 * Asserts against the resolved return type of each function under test.
 */

import typia from 'typia';
import { PcoClient, singleFromCreateResponse } from '../../src';
import { createTestClient } from './test-config';
import { cleanupCreated, fetchIds, type CreatedIds, type IntegrationIds, type ResolvedReturnType } from './response-types-helpers';

describe('Response types: Reports', () => {
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
    const res = await client.reports.getAll();
    typia.assert<ResolvedReturnType<typeof client.reports.getAll>>(res);
  }, 300000);

  it('getPage response matches declared return type', async () => {
    const res = await client.reports.getPage({ per_page: 1 });
    typia.assert<ResolvedReturnType<typeof client.reports.getPage>>(res);
  });

  it('getById response matches declared return type', async () => {
    expect(ids.reportId).toBeTruthy();
    const res = await client.reports.getById(ids.reportId);
    typia.assert<ResolvedReturnType<typeof client.reports.getById>>(res);
  });

  it('create response matches declared return type', async () => {
    const res = await client.reports.create({ name: `TypiaReport_${Date.now()}`, body: 'Body' });
    const single = singleFromCreateResponse(res);
    expect(single).toBeDefined();
    createdIds.report = single!.id;
    typia.assert<ResolvedReturnType<typeof client.reports.create>>(res);
  });

  it('update response matches declared return type', async () => {
    expect(ids.reportId).toBeTruthy();
    const res = await client.reports.update(ids.reportId, { name: 'TypiaReportUpdate' });
    typia.assert<ResolvedReturnType<typeof client.reports.update>>(res);
  });

  it('delete runs without throwing', async () => {
    const res = await client.reports.create({ name: `DelReport_${Date.now()}`, body: 'x' });
    const id = singleFromCreateResponse(res)?.id;
    expect(id).toBeDefined();
    await expect(client.reports.delete(id!)).resolves.not.toThrow();
  });
});
