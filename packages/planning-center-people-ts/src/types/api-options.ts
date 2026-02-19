/**
 * Strictly typed API options for Planning Center People API endpoints.
 * Includes, order fields, and where clauses align with the API docs per vertex.
 * Verify against: https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices/<vertex>
 */

import type { QueryOptions, PaginationOptions } from '@rachelallyson/planning-center-base-ts';

// ===== Person Endpoint Options =====
// @see https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices/person

/**
 * Valid include values for Person endpoint (Can Include)
 */
export type PersonInclude =
    | 'addresses'
    | 'emails'
    | 'field_data'
    | 'household'
    | 'households'
    | 'phone_numbers'
    | 'platform_notifications'
    | 'primary_campus'
    | 'school'
    | 'social_profiles';

/**
 * Valid order fields for Person endpoint (prefix with '-' for descending)
 */
export type PersonOrderField =
    | 'accounting_administrator'
    | 'anniversary'
    | 'birthdate'
    | 'child'
    | 'created_at'
    | 'first_name'
    | 'gender'
    | 'given_name'
    | 'grade'
    | 'graduation_year'
    | 'inactivated_at'
    | 'last_name'
    | 'membership'
    | 'middle_name'
    | 'nickname'
    | 'people_permissions'
    | 'remote_id'
    | 'site_administrator'
    | 'status'
    | 'updated_at';

/**
 * Strictly typed where clause for Person endpoint (Query By per doc)
 */
export interface PersonWhereClause {
    accounting_administrator?: boolean;
    anniversary?: string; // date format: YYYY-MM-DD
    birthdate?: string; // date format: YYYY-MM-DD
    child?: boolean;
    created_at?: string; // date_time format: ISO 8601
    first_name?: string;
    gender?: string;
    given_name?: string;
    grade?: number;
    graduation_year?: number;
    id?: string; // primary_key
    inactivated_at?: string | null; // date_time format: ISO 8601, or "null" to reactivate
    last_name?: string;
    medical_notes?: string;
    membership?: string;
    mfa_configured?: boolean; // Organization Administrator only
    middle_name?: string;
    nickname?: string;
    people_permissions?: string;
    primary_campus_id?: number | string;
    remote_id?: number;
    search_name?: string;
    search_name_or_email?: string;
    search_name_or_email_or_phone_number?: string;
    search_phone_number?: string;
    search_phone_number_e164?: string;
    site_administrator?: boolean;
    status?: string; // "inactive" sets inactivated_at, anything else reactivates
    updated_at?: string; // date_time format: ISO 8601
}

/** Params for people getPage(). */
export interface PersonGetPageOptions extends QueryOptions {
    where?: PersonWhereClause;
    include?: PersonInclude[];
    order?: PersonOrderField | `-${PersonOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for people getAll(). Fetches all pages using max per_page (100); per_page/page are not accepted. */
export type PersonGetAllOptions = Omit<PersonGetPageOptions, 'per_page' | 'page'> & PaginationOptions;

/** Params for getById (single person). */
export type PersonGetByIdOptions = { include?: PersonInclude[] };

/** Params for GET /people/:person_id/social_profiles. Include/where per social_profile vertex. */
export interface SocialProfileGetPageOptions extends QueryOptions {
    include?: string[];
    per_page?: number;
    page?: number;
}

/** Options for people.verifyPersonExists(personId). */
export interface PersonVerifyExistsOptions {
    /** Timeout in ms (default 30000). */
    timeout?: number;
}

// ===== Field Definition Endpoint Options =====
// @see https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices/field_definition

/**
 * Valid include values for FieldDefinition endpoint (Can Include)
 */
export type FieldDefinitionInclude = 'field_options' | 'tab';

/**
 * Valid order fields for FieldDefinition endpoint
 */
export type FieldDefinitionOrderField =
    | 'config'
    | 'data_type'
    | 'deleted_at'
    | 'name'
    | 'sequence'
    | 'slug'
    | 'tab_id';

/**
 * Strictly typed where clause for FieldDefinition endpoint
 */
export interface FieldDefinitionWhereClause {
    config?: string;
    data_type?: string;
    deleted_at?: string; // date_time format
    name?: string;
    sequence?: number;
    slug?: string;
    tab_id?: string; // primary_key
}

/** Params for field-definitions getPage(). */
export interface FieldDefinitionGetPageOptions extends QueryOptions {
    include?: FieldDefinitionInclude[];
    where?: FieldDefinitionWhereClause;
    order?: FieldDefinitionOrderField | `-${FieldDefinitionOrderField}`;
    includeDeleted?: boolean;
}

/** Params for field-definitions getAll(). Fetches all pages using max per_page (100); per_page/page are not accepted. */
export type FieldDefinitionGetAllOptions = Omit<FieldDefinitionGetPageOptions, 'per_page' | 'page'> & PaginationOptions;

/** Params for getById (single field definition). */
export type FieldDefinitionGetByIdOptions = { include?: FieldDefinitionInclude[] };

export type FieldDataOrderField =
    | 'file'
    | 'file_content_type'
    | 'file_name'
    | 'file_size'
    | 'value';

export interface FieldDataWhereClause {
    field_definition_id?: number;
    file?: string;
    file_content_type?: string; // date_time format
    file_name?: string;
    file_size?: number;
    value?: string;
}



export type FieldDataInclude = 'field_definition' | 'field_option' | 'tab';

/** Params for field-data list (getPage) per person. */
export interface FieldDataGetPageOptions extends QueryOptions {
    include?: FieldDataInclude[];
    where?: FieldDataWhereClause;
    order?: FieldDataOrderField | `-${FieldDataOrderField}`;
}

/** Valid include values for Tab endpoint (GET /tabs/:id). Can Include: field_definitions */
export type TabInclude = 'field_definitions' | 'field_options';

/** Params for getTabById(id). */
export type TabGetByIdOptions = { include?: TabInclude[] };

// ===== Workflow Endpoint Options =====
// @see https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices/workflow

/**
 * Valid include values for Workflow endpoint (Can Include)
 */
export type WorkflowInclude = 'category' | 'shares';

/**
 * Valid order fields for Workflow endpoint
 */
export type WorkflowOrderField =
    | 'archived_at'
    | 'campus_id'
    | 'created_at'
    | 'deleted_at'
    | 'name'
    | 'updated_at'
    | 'workflow_category_id';

/**
 * Strictly typed where clause for Workflow endpoint (Query By per doc)
 */
export interface WorkflowWhereClause {
    archived_at?: string; // date_time format: ISO 8601
    campus_id?: string; // primary_key
    created_at?: string; // date_time format: ISO 8601
    deleted_at?: string; // date_time format: ISO 8601
    id?: string; // primary_key
    name?: string;
    updated_at?: string; // date_time format: ISO 8601
    workflow_category_id?: string; // primary_key
}

/** Params for workflows getPage(). */
export interface WorkflowGetPageOptions extends QueryOptions {
    where?: WorkflowWhereClause;
    include?: WorkflowInclude[];
    order?: WorkflowOrderField | `-${WorkflowOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for workflows getAll(). */
/** Fetches all pages using max per_page (100); per_page/page are not accepted. */
export type WorkflowGetAllOptions = Omit<WorkflowGetPageOptions, 'per_page' | 'page'> & PaginationOptions;

/** Params for getById (single workflow). */
export type WorkflowGetByIdOptions = { include?: WorkflowInclude[] };

/** Params for GET /people/{person_id}/workflow_cards (list). Pagination only; include/where per workflow_card vertex if needed. */
export interface WorkflowCardGetPageOptions extends QueryOptions {
    per_page?: number;
    page?: number;
}

// ===== Note Endpoint Options =====
// @see https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices/note

/**
 * Valid include values for Note endpoint (Can Include)
 */
export type NoteInclude = 'category' | 'created_by' | 'person';

/**
 * Valid order fields for Note endpoint
 */
export type NoteOrderField = 'created_at' | 'display_date' | 'id' | 'note' | 'note_category_id' | 'updated_at';

/**
 * Strictly typed where clause for Note endpoint
 */
export interface NoteWhereClause {
    note?: string;
    note_category_id?: string; // primary_key
}

/** Params for notes getPage(). */
export interface NoteGetPageOptions extends QueryOptions {
    where?: NoteWhereClause;
    include?: NoteInclude[];
    order?: NoteOrderField | `-${NoteOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for notes getAll(). */
/** Fetches all pages using max per_page (100); per_page/page are not accepted. */
export type NoteGetAllOptions = Omit<NoteGetPageOptions, 'per_page' | 'page'> & PaginationOptions;

/** Params for getById (single note). */
export type NoteGetByIdOptions = { include?: NoteInclude[] };

/** Params for getNoteCategories(). List endpoint with pagination only. */
export interface NoteCategoryGetPageOptions extends QueryOptions {
    per_page?: number;
    page?: number;
}

// ===== List Endpoint Options =====
// @see https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices/list

/**
 * Valid include values for List endpoint (Can Include)
 */
export type ListInclude = 'campus' | 'category' | 'created_by' | 'rules' | 'shares';

/**
 * Valid order fields for List endpoint
 */
export type ListOrderField =
    | 'batch_completed_at'
    | 'campus_id'
    | 'created_at'
    | 'list_categories.name'
    | 'list_category_id'
    | 'name'
    | 'name_or_description'
    | 'updated_at';

/**
 * Strictly typed where clause for List endpoint (Query By per doc)
 */
export interface ListWhereClause {
    batch_completed_at?: string; // date_time format: ISO 8601
    created_at?: string; // date_time format: ISO 8601
    id?: string; // primary_key
    list_category_id?: string;
    name?: string;
    updated_at?: string; // date_time format: ISO 8601
}

/** Params for lists getPage(). */
export interface ListGetPageOptions extends QueryOptions {
    where?: ListWhereClause;
    include?: ListInclude[];
    order?: ListOrderField | `-${ListOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for lists getAll(). */
/** Fetches all pages using max per_page (100); per_page/page are not accepted. */
export type ListGetAllOptions = Omit<ListGetPageOptions, 'per_page' | 'page'> & PaginationOptions;

/** Params for getById (single list). */
export type ListGetByIdOptions = { include?: ListInclude[] };

/** Params for getListCategories(). List endpoint with pagination only. */
export interface ListCategoryGetPageOptions extends QueryOptions {
    per_page?: number;
    page?: number;
}

// ===== Household Endpoint Options =====
// @see https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices/household

/**
 * Valid include values for Household endpoint (Can Include)
 */
export type HouseholdInclude = 'people';

/**
 * Valid order fields for Household endpoint
 */
export type HouseholdOrderField =
    | 'created_at'
    | 'member_count'
    | 'name'
    | 'primary_contact_name'
    | 'updated_at';

/**
 * Strictly typed where clause for Household endpoint (Query By per doc)
 */
export interface HouseholdWhereClause {
    created_at?: string; // date_time format: ISO 8601
    member_count?: number;
    name?: string;
    primary_contact_name?: string;
    updated_at?: string; // date_time format: ISO 8601
}

/** Params for households getPage(). */
export interface HouseholdGetPageOptions extends QueryOptions {
    where?: HouseholdWhereClause;
    include?: HouseholdInclude[];
    order?: HouseholdOrderField | `-${HouseholdOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for households getAll(). */
/** Fetches all pages using max per_page (100); per_page/page are not accepted. */
export type HouseholdGetAllOptions = Omit<HouseholdGetPageOptions, 'per_page' | 'page'> & PaginationOptions;

/** Params for getById (single household). */
export type HouseholdGetByIdOptions = { include?: HouseholdInclude[] };

// ===== Campus Endpoint Options =====
// @see https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices/campus

/**
 * Valid include values for Campus endpoint (Can Include)
 */
export type CampusInclude = 'lists' | 'service_times';

/**
 * Valid order fields for Campus endpoint
 */
export type CampusOrderField = 'created_at' | 'name' | 'updated_at';

/**
 * Strictly typed where clause for Campus endpoint (Query By per doc)
 */
export interface CampusWhereClause {
    created_at?: string; // date_time format: ISO 8601
    id?: string; // primary_key
    updated_at?: string; // date_time format: ISO 8601
}

/** Params for campus getPage(). */
export interface CampusGetPageOptions extends QueryOptions {
    where?: CampusWhereClause;
    include?: CampusInclude[];
    order?: CampusOrderField | `-${CampusOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for campus getAll(). */
/** Fetches all pages using max per_page (100); per_page/page are not accepted. */
export type CampusGetAllOptions = Omit<CampusGetPageOptions, 'per_page' | 'page'> & PaginationOptions;

/** Params for getById (single campus). */
export type CampusGetByIdOptions = { include?: CampusInclude[] };

/** Params for campus.getLists(campusId). Lists under a campus use List where/include. */
export interface CampusGetListsOptions extends QueryOptions {
    where?: ListWhereClause;
    include?: ListInclude[];
    per_page?: number;
    page?: number;
}

/** Params for campus.getServiceTimes(campusId). ServiceTime does not support where[]. */
export interface CampusGetServiceTimesOptions extends QueryOptions {
    where?: never;
    include?: ServiceTimeInclude[];
    per_page?: number;
    page?: number;
}

// ===== Form Endpoint Options =====
// @see https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices/form

/**
 * Valid include values for Form endpoint (Can Include)
 */
export type FormInclude = 'campus' | 'category';

/**
 * Strictly typed where clause for Form endpoint (Query By)
 */
export interface FormWhereClause {
    active?: boolean;
    id?: string; // primary_key
}

/** Params for forms getPage(). */
export interface FormGetPageOptions extends QueryOptions {
    where?: FormWhereClause;
    include?: FormInclude[];
    order?: string;
    per_page?: number;
    page?: number;
}

/** Params for forms getAll(). */
/** Fetches all pages using max per_page (100); per_page/page are not accepted. */
export type FormGetAllOptions = Omit<FormGetPageOptions, 'per_page' | 'page'> & PaginationOptions;

/** Params for getById (single form). */
export type FormGetByIdOptions = { include?: FormInclude[] };

/**
 * Valid include values for FormSubmission (nested under form). Can Include: form_submission_values.
 */
export type FormSubmissionInclude = 'form_submission_values';

/** Params for getFormSubmissionById (single form submission). */
export type FormSubmissionGetByIdOptions = { include?: FormSubmissionInclude[] };

/**
 * Strictly typed where clause for Form Field (nested under form). Query By: name, field_type, required, sequence, created_at, updated_at.
 */
export interface FormFieldWhereClause {
    name?: string;
    field_type?: string;
    required?: boolean;
    sequence?: number;
    created_at?: string; // date_time format: ISO 8601
    updated_at?: string; // date_time format: ISO 8601
}

/** Params for getFormFields(formId). Nested resource; where/include per Form Field vertex. */
export interface FormFieldGetPageOptions extends QueryOptions {
    where?: FormFieldWhereClause;
    include?: string[];
    per_page?: number;
    page?: number;
}

/**
 * Strictly typed where clause for Form Field Option (nested under form field). Query By: value, sequence, created_at, updated_at.
 */
export interface FormFieldOptionWhereClause {
    value?: string;
    sequence?: number;
    created_at?: string; // date_time format: ISO 8601
    updated_at?: string; // date_time format: ISO 8601
}

/** Params for getFormFieldOptions(formId, formFieldId). Nested resource. */
export interface FormFieldOptionGetPageOptions extends QueryOptions {
    where?: FormFieldOptionWhereClause;
    include?: string[];
    per_page?: number;
    page?: number;
}

/**
 * Strictly typed where clause for Form Submission (nested under form). Query By: submitted_at, created_at, updated_at.
 */
export interface FormSubmissionWhereClause {
    submitted_at?: string; // date_time format: ISO 8601
    created_at?: string; // date_time format: ISO 8601
    updated_at?: string; // date_time format: ISO 8601
}

/** Params for getFormSubmissions(formId). Nested resource. */
export interface FormSubmissionGetPageOptions extends QueryOptions {
    where?: FormSubmissionWhereClause;
    include?: FormSubmissionInclude[];
    per_page?: number;
    page?: number;
}

/**
 * Strictly typed where clause for Form Submission Value (nested under form submission). Query By: value, created_at, updated_at.
 */
export interface FormSubmissionValueWhereClause {
    value?: string;
    created_at?: string; // date_time format: ISO 8601
    updated_at?: string; // date_time format: ISO 8601
}

/** Params for getFormSubmissionValues(formId, formSubmissionId). Nested resource. */
export interface FormSubmissionValueGetPageOptions extends QueryOptions {
    where?: FormSubmissionValueWhereClause;
    include?: string[];
    per_page?: number;
    page?: number;
}

// ===== Report Endpoint Options =====
// @see https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices/report

/**
 * Valid include values for Report endpoint (Can Include)
 */
export type ReportInclude = 'created_by' | 'updated_by';

/**
 * Valid order fields for Report endpoint
 */
export type ReportOrderField = 'body' | 'created_at' | 'name' | 'updated_at';

/**
 * Strictly typed where clause for Report endpoint (Query By)
 */
export interface ReportWhereClause {
    body?: string;
    created_at?: string; // date_time format: ISO 8601
    name?: string;
    updated_at?: string; // date_time format: ISO 8601
}

/** Params for reports getPage(). */
export interface ReportGetPageOptions extends QueryOptions {
    where?: ReportWhereClause;
    include?: ReportInclude[];
    order?: ReportOrderField | `-${ReportOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for reports getAll(). */
/** Fetches all pages using max per_page (100); per_page/page are not accepted. */
export type ReportGetAllOptions = Omit<ReportGetPageOptions, 'per_page' | 'page'> & PaginationOptions;

/** Params for getById (single report). */
export type ReportGetByIdOptions = { include?: ReportInclude[] };

// ===== ServiceTime Endpoint Options =====
// @see https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices/service_time
// Note: ServiceTime endpoint does not support where[] filtering in the API

/**
 * Valid include values for ServiceTime endpoint (Can Include)
 */
export type ServiceTimeInclude = 'campus';

/**
 * Valid order fields for ServiceTime endpoint (Order By per doc)
 */
export type ServiceTimeOrderField = 'time';

/** Params for service-times getPage(). (ServiceTime endpoint does not support where[].) */
export interface ServiceTimeGetPageOptions extends QueryOptions {
    where?: never;
    include?: ServiceTimeInclude[];
    order?: ServiceTimeOrderField | `-${ServiceTimeOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for service-times getAll(). */
/** Fetches all pages using max per_page (100); per_page/page are not accepted. */
export type ServiceTimeGetAllOptions = Omit<ServiceTimeGetPageOptions, 'per_page' | 'page'> & PaginationOptions;

/** Params for getById (single service time). */
export type ServiceTimeGetByIdOptions = { include?: ServiceTimeInclude[] };

