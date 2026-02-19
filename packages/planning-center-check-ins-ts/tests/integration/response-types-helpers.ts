/**
 * Shared helpers for response-types integration tests (Check-ins).
 * Matches the pattern used in planning-center-people-ts.
 * Each test file creates its own client and ids in beforeAll.
 */

import type { PcoCheckInsClient } from '../../src';

/** Resolved (awaited) return type of an async function. Use for typia.assert against API responses. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- need permissive constraint for client method signatures
export type ResolvedReturnType<T extends (...args: any[]) => Promise<any>> = Awaited<ReturnType<T>>;

export interface IntegrationIds {
  eventId: string;
  checkInId: string;
  locationId: string;
  eventTimeId: string;
  stationId: string;
  checkInGroupId: string;
  labelId: string;
  optionId: string;
  passId: string;
  headcountId: string;
  attendanceTypeId: string;
  rosterListPersonId: string;
  integrationLinkId: string;
  themeId: string;
}

export function firstId(r: { data: Array<{ id?: string }> }): string {
  return r.data[0]?.id ?? '';
}

export async function fetchIds(c: PcoCheckInsClient): Promise<IntegrationIds> {
  const [events, checkIns, locations, eventTimes, stations, labels, options, passes, headcounts, attendanceTypes, integrationLinks, themes] =
    await Promise.all([
      c.events.getPage({ per_page: 1 }),
      c.checkIns.getPage({ per_page: 1 }),
      c.locations.getPage({ per_page: 1 }),
      c.eventTimes.getPage({ per_page: 1 }),
      c.stations.getPage({ per_page: 1 }),
      c.labels.getPage({ per_page: 1 }),
      c.options.getPage({ per_page: 1 }),
      c.passes.getPage({ per_page: 1 }),
      c.headcounts.getPage({ per_page: 1 }),
      c.attendanceTypes.getPage({ per_page: 1 }),
      c.integrationLinks.getPage({ per_page: 1 }),
      c.themes.getPage({ per_page: 1 }),
    ]);

  let checkInGroupId = '';
  if (firstId(stations)) {
    const groups = await c.checkInGroups.getPage(firstId(stations), { per_page: 1 });
    checkInGroupId = firstId(groups);
  }

  let rosterListPersonId = '';
  try {
    const rosterListPersons = await c.rosterListPersons.getPage({ per_page: 1 });
    rosterListPersonId = firstId(rosterListPersons);
  } catch {
    // API may return 404 for orgs without roster list persons; leave id empty so getById test fails explicitly.
  }

  return {
    eventId: firstId(events),
    checkInId: firstId(checkIns),
    locationId: firstId(locations),
    eventTimeId: firstId(eventTimes),
    stationId: firstId(stations),
    checkInGroupId,
    labelId: firstId(labels),
    optionId: firstId(options),
    passId: firstId(passes),
    headcountId: firstId(headcounts),
    attendanceTypeId: firstId(attendanceTypes),
    rosterListPersonId,
    integrationLinkId: firstId(integrationLinks),
    themeId: firstId(themes),
  };
}
