/**
 * Shared utilities for Check-ins integration tests.
 * Use these to avoid type assertions and satisfy lint rules.
 */

import type { PcoCheckInsClient } from '../../src';

/** Build a record of module name -> module from client for dynamic access without assertions. */
export function getClientModules(client: PcoCheckInsClient): Record<string, object> {
  return {
    events: client.events,
    checkIns: client.checkIns,
    locations: client.locations,
    eventTimes: client.eventTimes,
    stations: client.stations,
    labels: client.labels,
    options: client.options,
    checkInGroups: client.checkInGroups,
    preChecks: client.preChecks,
    passes: client.passes,
    headcounts: client.headcounts,
    attendanceTypes: client.attendanceTypes,
    rosterListPersons: client.rosterListPersons,
    organization: client.organization,
    integrationLinks: client.integrationLinks,
    themes: client.themes,
  };
}

/** Page response shape used by list endpoints. */
export interface PageResponse {
  data: object[];
  meta?: object;
  links?: object;
}

/** Module shape with getPage/getById for dynamic tests. */
export interface ClientModuleShape {
  getPage: (opts?: object) => Promise<PageResponse>;
  getById: (id: string) => Promise<{ type: string; id: string }>;
  getAll?: (opts?: object) => Promise<PageResponse>;
}

function isClientModuleShape(obj: object): obj is ClientModuleShape {
  const proto = Object.getPrototypeOf(obj);
  const getPage = Object.getOwnPropertyDescriptor(proto, 'getPage')?.value;
  const getById = Object.getOwnPropertyDescriptor(proto, 'getById')?.value;
  return typeof getPage === 'function' && typeof getById === 'function';
}

/** Get a module by name for dynamic getPage/getById calls. */
export function getClientModule(client: PcoCheckInsClient, name: string): ClientModuleShape {
  const mod = getClientModules(client)[name];
  if (!mod) throw new Error(`Module ${name} not found`);
  if (!isClientModuleShape(mod)) throw new Error(`Module ${name} does not match ClientModuleShape`);
  return mod;
}

/** Read id from a resource-like object (avoids repeated assertions in tests). */
export function getResourceId(o: object): string {
  const desc = Object.getOwnPropertyDescriptor(o, 'id');
  const id = desc?.value;
  return id != null ? String(id) : '';
}

/** Find first resource in array with given name (avoids repeated assertions in tests). */
export function findResourceByName(data: object[], name: string): object | undefined {
  return data.find((e) => {
    if (typeof e !== 'object' || e === null) return false;
    const nameVal = Object.getOwnPropertyDescriptor(e, 'name')?.value;
    return nameVal === name;
  });
}

/** Type for error-like objects with optional status (e.g. API error responses). */
export interface ErrorWithStatus {
  status?: number;
}

export function isErrorWithStatus(o: object): o is ErrorWithStatus {
  const desc = Object.getOwnPropertyDescriptor(o, 'status');
  const status = desc?.value;
  return typeof status === 'number';
}
