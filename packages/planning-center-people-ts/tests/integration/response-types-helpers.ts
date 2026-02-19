/**
 * Shared helpers for response-types integration tests.
 * Each test file creates its own client and ids in beforeAll and cleans up in afterAll.
 */

import type { PcoClient } from '../../src';

/** Resolved (awaited) return type of an async function. Use for typia.assert against API responses. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- need permissive constraint for client method signatures
export type ResolvedReturnType<T extends (...args: any[]) => Promise<any>> = Awaited<ReturnType<T>>;

export interface IntegrationIds {
  personId: string;
  campusId: string;
  listId: string;
  workflowId: string;
  formId: string;
  reportId: string;
  householdId: string;
}

export interface CreatedIds {
  person?: string;
  household?: string;
  listCategory?: string;
  note?: string;
  workflow?: string;
  report?: string;
  tab?: string;
  fieldDef?: string;
}

export function firstId(r: { data: Array<{ id?: string }> }): string {
  return r.data[0]?.id ?? '';
}

export async function fetchIds(c: PcoClient): Promise<IntegrationIds> {
  const [people, campuses, lists, workflows, forms, reports, households] = await Promise.all([
    c.people.getPage({ per_page: 1 }),
    c.campus.getPage({ per_page: 1 }),
    c.lists.getPage({ per_page: 1 }),
    c.workflows.getPage({ per_page: 1 }),
    c.forms.getPage({ per_page: 1 }),
    c.reports.getPage({ per_page: 1 }),
    c.households.getPage({ per_page: 1 }),
  ]);
  return {
    personId: firstId(people),
    campusId: firstId(campuses),
    listId: firstId(lists),
    workflowId: firstId(workflows),
    formId: firstId(forms),
    reportId: firstId(reports),
    householdId: firstId(households),
  };
}

export async function cleanupCreated(c: PcoClient, created: CreatedIds): Promise<void> {
  const entries: Array<[string | undefined, (id: string) => Promise<void>]> = [
    [created.person, (id) => c.people.delete(id)],
    [created.household, (id) => c.households.delete(id)],
    [created.listCategory, (id) => c.lists.deleteListCategory(id)],
    [created.note, (id) => c.notes.delete(id)],
    [created.workflow, (id) => c.workflows.delete(id)],
    [created.report, (id) => c.reports.delete(id)],
    [created.tab, (id) => c.fields.deleteTab(id)],
    [created.fieldDef, (id) => c.fields.deleteFieldDefinition(id)],
  ];
  for (const [id, fn] of entries) {
    if (id) await fn(id);
  }
}
