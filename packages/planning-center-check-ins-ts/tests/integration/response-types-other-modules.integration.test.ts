/**
 * Response-types integration tests: Stations, Labels, Options, Check-in groups, Passes, Headcounts, Attendance types, Roster list persons, Integration links, Themes.
 * Asserts against the resolved return type of each function under test.
 * Run with: npm run test:integration
 */

import typia from 'typia';
import { PcoCheckInsClient } from '../../src';
import { createTestClient } from './test-config';
import { fetchIds, type IntegrationIds, type ResolvedReturnType } from './response-types-helpers';

describe('Response types: Other modules', () => {
  let client: PcoCheckInsClient;
  let ids: IntegrationIds;

  beforeAll(async () => {
    client = createTestClient();
    ids = await fetchIds(client);
  }, 30000);

  describe('Stations', () => {
    it('getAll response matches declared return type', async () => {
      const res = await client.stations.getAll();
      typia.assert<ResolvedReturnType<typeof client.stations.getAll>>(res);
    }, 300000);

    it('getPage response matches declared return type', async () => {
      const res = await client.stations.getPage({ per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.stations.getPage>>(res);
    });

    it('getById response matches declared return type', async () => {
      expect(ids.stationId).toBeTruthy();
      const res = await client.stations.getById(ids.stationId);
      typia.assert<ResolvedReturnType<typeof client.stations.getById>>(res);
    });
  });

  describe('Labels', () => {
    it('getAll response matches declared return type', async () => {
      const res = await client.labels.getAll();
      typia.assert<ResolvedReturnType<typeof client.labels.getAll>>(res);
    }, 300000);

    it('getPage response matches declared return type', async () => {
      const res = await client.labels.getPage({ per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.labels.getPage>>(res);
    });

    it('getById response matches declared return type', async () => {
      expect(ids.labelId).toBeTruthy();
      const res = await client.labels.getById(ids.labelId);
      typia.assert<ResolvedReturnType<typeof client.labels.getById>>(res);
    });
  });

  describe('Options', () => {
    it('getAll response matches declared return type', async () => {
      const res = await client.options.getAll();
      typia.assert<ResolvedReturnType<typeof client.options.getAll>>(res);
    }, 300000);

    it('getPage response matches declared return type', async () => {
      const res = await client.options.getPage({ per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.options.getPage>>(res);
    });

    it('getById response matches declared return type', async () => {
      expect(ids.optionId).toBeTruthy();
      const res = await client.options.getById(ids.optionId);
      typia.assert<ResolvedReturnType<typeof client.options.getById>>(res);
    });
  });

  describe('CheckInGroups', () => {
    it('getAll response matches declared return type', async () => {
      expect(ids.stationId).toBeTruthy();
      const res = await client.checkInGroups.getAll(ids.stationId);
      typia.assert<ResolvedReturnType<typeof client.checkInGroups.getAll>>(res);
    }, 300000);

    it('getPage response matches declared return type', async () => {
      expect(ids.stationId).toBeTruthy();
      const res = await client.checkInGroups.getPage(ids.stationId, { per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.checkInGroups.getPage>>(res);
    });

    it('getById response matches declared return type', async () => {
      expect(ids.checkInGroupId).toBeTruthy();
      const res = await client.checkInGroups.getById(ids.checkInGroupId);
      typia.assert<ResolvedReturnType<typeof client.checkInGroups.getById>>(res);
    });
  });

  describe('Passes', () => {
    it('getAll response matches declared return type', async () => {
      const res = await client.passes.getAll();
      typia.assert<ResolvedReturnType<typeof client.passes.getAll>>(res);
    }, 300000);

    it('getPage response matches declared return type', async () => {
      const res = await client.passes.getPage({ per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.passes.getPage>>(res);
    });

    it('getById response matches declared return type', async () => {
      expect(ids.passId).toBeTruthy();
      const res = await client.passes.getById(ids.passId);
      typia.assert<ResolvedReturnType<typeof client.passes.getById>>(res);
    });
  });

  describe('Headcounts', () => {
    it('getAll response matches declared return type', async () => {
      const res = await client.headcounts.getAll();
      typia.assert<ResolvedReturnType<typeof client.headcounts.getAll>>(res);
    }, 300000);

    it('getPage response matches declared return type', async () => {
      const res = await client.headcounts.getPage({ per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.headcounts.getPage>>(res);
    });

    it('getById response matches declared return type', async () => {
      expect(ids.headcountId).toBeTruthy();
      const res = await client.headcounts.getById(ids.headcountId);
      typia.assert<ResolvedReturnType<typeof client.headcounts.getById>>(res);
    });
  });

  describe('AttendanceTypes', () => {
    it('getAll response matches declared return type', async () => {
      const res = await client.attendanceTypes.getAll();
      typia.assert<ResolvedReturnType<typeof client.attendanceTypes.getAll>>(res);
    }, 300000);

    it('getPage response matches declared return type', async () => {
      const res = await client.attendanceTypes.getPage({ per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.attendanceTypes.getPage>>(res);
    });

    it('getById response matches declared return type', async () => {
      expect(ids.attendanceTypeId).toBeTruthy();
      const res = await client.attendanceTypes.getById(ids.attendanceTypeId);
      typia.assert<ResolvedReturnType<typeof client.attendanceTypes.getById>>(res);
    });
  });

  describe('RosterListPersons', () => {
    it('getAll response matches declared return type', async () => {
      const res = await client.rosterListPersons.getAll();
      typia.assert<ResolvedReturnType<typeof client.rosterListPersons.getAll>>(res);
    }, 300000);

    it('getPage response matches declared return type', async () => {
      const res = await client.rosterListPersons.getPage({ per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.rosterListPersons.getPage>>(res);
    });

    it('getById response matches declared return type', async () => {
      expect(ids.rosterListPersonId).toBeTruthy();
      const res = await client.rosterListPersons.getById(ids.rosterListPersonId);
      typia.assert<ResolvedReturnType<typeof client.rosterListPersons.getById>>(res);
    });
  });

  describe('IntegrationLinks', () => {
    it('getAll response matches declared return type', async () => {
      const res = await client.integrationLinks.getAll();
      typia.assert<ResolvedReturnType<typeof client.integrationLinks.getAll>>(res);
    }, 300000);

    it('getPage response matches declared return type', async () => {
      const res = await client.integrationLinks.getPage({ per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.integrationLinks.getPage>>(res);
    });

    it('getById response matches declared return type', async () => {
      expect(ids.integrationLinkId).toBeTruthy();
      const res = await client.integrationLinks.getById(ids.integrationLinkId);
      typia.assert<ResolvedReturnType<typeof client.integrationLinks.getById>>(res);
    });
  });

  describe('Themes', () => {
    it('getAll response matches declared return type', async () => {
      const res = await client.themes.getAll();
      typia.assert<ResolvedReturnType<typeof client.themes.getAll>>(res);
    }, 300000);

    it('getPage response matches declared return type', async () => {
      const res = await client.themes.getPage({ per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.themes.getPage>>(res);
    });

    it('getById response matches declared return type', async () => {
      expect(ids.themeId).toBeTruthy();
      const res = await client.themes.getById(ids.themeId);
      typia.assert<ResolvedReturnType<typeof client.themes.getById>>(res);
    });
  });
});
