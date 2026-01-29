/**
 * Strictly typed API options for Planning Center People API endpoints
 * Based on official API documentation: https://developer.planning.center/docs
 */

// ===== Person Endpoint Options =====

/**
 * Valid include values for Person endpoint
 */
export type PersonInclude =
    | 'addresses'
    | 'emails'
    | 'field_data'
    | 'households'
    | 'inactive_reason'
    | 'marital_status'
    | 'name_prefix'
    | 'name_suffix'
    | 'organization'
    | 'person_apps'
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
 * Strictly typed where clause for Person endpoint
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
    primary_campus_id?: number;
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

/**
 * Strictly typed options for Person getAll() - no pagination options
 */
export interface PersonListOptions {
    /** Filter by specific fields */
    where?: PersonWhereClause;
    /** Include related resources */
    include?: PersonInclude[];
    /** Order by field (prefix with '-' for descending) */
    order?: PersonOrderField | `-${PersonOrderField}`;
}

/**
 * Strictly typed options for Person getPage() - includes pagination
 */
export interface PersonPageOptions extends PersonListOptions {
    /** Items per page (1-100, default: 25) */
    perPage?: number;
    /** Page number */
    page?: number;
}

// ===== Field Definition Endpoint Options =====

/**
 * Valid include values for FieldDefinition endpoint
 */
export type FieldDefinitionInclude = 'tab' | 'field_options';

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

/**
 * Strictly typed options for FieldDefinition list endpoints
 */
export interface FieldDefinitionListOptions {
    /** Include related resources */
    include?: FieldDefinitionInclude[];
    /** Filter by specific fields */
    where?: FieldDefinitionWhereClause;
    /** Order by field (prefix with '-' for descending) */
    order?: FieldDefinitionOrderField | `-${FieldDefinitionOrderField}`;
    /** Include deleted field definitions */
    includeDeleted?: boolean;
}

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



export interface FieldDataOptions {
    /** Include related resources */
    include?: ('field_definition' | 'field_option' | 'tab')[];
    /** Filter by specific fields */
    where?: FieldDataWhereClause;
    /** Order by field (prefix with '-' for descending) */
    order?: FieldDataOrderField | `-${FieldDataOrderField}`;
}

// ===== Workflow Endpoint Options =====

/**
 * Valid include values for Workflow endpoint
 */
export type WorkflowInclude = 'category' | 'shares' | 'steps';

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
 * Strictly typed where clause for Workflow endpoint
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

/**
 * Strictly typed options for Workflow getAll() - no pagination options
 */
export interface WorkflowListOptions {
    /** Filter by specific fields */
    where?: WorkflowWhereClause;
    /** Include related resources */
    include?: WorkflowInclude[];
    /** Order by field (prefix with '-' for descending) */
    order?: WorkflowOrderField | `-${WorkflowOrderField}`;
}

/**
 * Strictly typed options for Workflow getPage() - includes pagination
 */
export interface WorkflowPageOptions extends WorkflowListOptions {
    /** Items per page (1-100, default: 25) */
    perPage?: number;
    /** Page number */
    page?: number;
}

// ===== Note Endpoint Options =====

/**
 * Valid include values for Note endpoint
 */
export type NoteInclude = 'note_category' | 'created_by' | 'person' | 'organization';

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

/**
 * Strictly typed options for Note getAll() - no pagination options
 */
export interface NoteListOptions {
    /** Filter by specific fields */
    where?: NoteWhereClause;
    /** Include related resources */
    include?: NoteInclude[];
    /** Order by field (prefix with '-' for descending) */
    order?: NoteOrderField | `-${NoteOrderField}`;
}

/**
 * Strictly typed options for Note getPage() - includes pagination
 */
export interface NotePageOptions extends NoteListOptions {
    /** Items per page (1-100, default: 25) */
    perPage?: number;
    /** Page number */
    page?: number;
}

// ===== List Endpoint Options =====

/**
 * Valid include values for List endpoint
 */
export type ListInclude = 'campus' | 'category' | 'created_by' | 'mailchimp_sync_status' | 'people' | 'rules' | 'shares' | 'updated_by';

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
 * Strictly typed where clause for List endpoint
 */
export interface ListWhereClause {
    batch_completed_at?: string; // date_time format: ISO 8601
    created_at?: string; // date_time format: ISO 8601
    id?: string; // primary_key
    list_category_id?: string; // primary_key
    name?: string;
    updated_at?: string; // date_time format: ISO 8601
}

/**
 * Strictly typed options for List getAll() - no pagination options
 */
export interface ListListOptions {
    /** Filter by specific fields */
    where?: ListWhereClause;
    /** Include related resources */
    include?: ListInclude[];
    /** Order by field (prefix with '-' for descending) */
    order?: ListOrderField | `-${ListOrderField}`;
}

/**
 * Strictly typed options for List getPage() - includes pagination
 */
export interface ListPageOptions extends ListListOptions {
    /** Items per page (1-100, default: 25) */
    perPage?: number;
    /** Page number */
    page?: number;
}

// ===== Household Endpoint Options =====

/**
 * Valid include values for Household endpoint
 */
export type HouseholdInclude = 'people' | 'primary_contact';

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
 * Strictly typed where clause for Household endpoint
 */
export interface HouseholdWhereClause {
    created_at?: string; // date_time format: ISO 8601
    member_count?: number;
    name?: string;
    updated_at?: string; // date_time format: ISO 8601
}

/**
 * Strictly typed options for Household getAll() - no pagination options
 */
export interface HouseholdListOptions {
    /** Filter by specific fields */
    where?: HouseholdWhereClause;
    /** Include related resources */
    include?: HouseholdInclude[];
    /** Order by field (prefix with '-' for descending) */
    order?: HouseholdOrderField | `-${HouseholdOrderField}`;
}

/**
 * Strictly typed options for Household getPage() - includes pagination
 */
export interface HouseholdPageOptions extends HouseholdListOptions {
    /** Items per page (1-100, default: 25) */
    perPage?: number;
    /** Page number */
    page?: number;
}

// ===== Campus Endpoint Options =====

/**
 * Valid include values for Campus endpoint
 */
export type CampusInclude = 'organization' | 'lists' | 'service_times';

/**
 * Valid order fields for Campus endpoint
 */
export type CampusOrderField = 'created_at' | 'name' | 'updated_at';

/**
 * Strictly typed where clause for Campus endpoint
 */
export interface CampusWhereClause {
    created_at?: string; // date_time format: ISO 8601
    id?: string; // primary_key
    updated_at?: string; // date_time format: ISO 8601
}

/**
 * Strictly typed options for Campus getAll() - no pagination options
 */
export interface CampusListOptions {
    /** Filter by specific fields */
    where?: CampusWhereClause;
    /** Include related resources */
    include?: CampusInclude[];
    /** Order by field (prefix with '-' for descending) */
    order?: CampusOrderField | `-${CampusOrderField}`;
}

/**
 * Strictly typed options for Campus getPage() - includes pagination
 */
export interface CampusPageOptions extends CampusListOptions {
    /** Items per page (1-100, default: 25) */
    perPage?: number;
    /** Page number */
    page?: number;
}

// ===== Form Endpoint Options =====

/**
 * Strictly typed where clause for Form endpoint
 */
export interface FormWhereClause {
    active?: boolean;
    id?: string; // primary_key
}

/**
 * Strictly typed options for Form getAll() - no pagination options
 */
export interface FormListOptions {
    /** Filter by specific fields */
    where?: FormWhereClause;
    /** Include related resources */
    include?: string[];
    /** Order by field (prefix with '-' for descending) */
    order?: string;
}

/**
 * Strictly typed options for Form getPage() - includes pagination
 */
export interface FormPageOptions extends FormListOptions {
    /** Items per page (1-100, default: 25) */
    perPage?: number;
    /** Page number */
    page?: number;
}

// ===== Report Endpoint Options =====

/**
 * Strictly typed where clause for Report endpoint
 */
export interface ReportWhereClause {
    body?: string;
    created_at?: string; // date_time format: ISO 8601
    name?: string;
    updated_at?: string; // date_time format: ISO 8601
}

/**
 * Strictly typed options for Report getAll() - no pagination options
 */
export interface ReportListOptions {
    /** Filter by specific fields */
    where?: ReportWhereClause;
    /** Include related resources */
    include?: string[];
    /** Order by field (prefix with '-' for descending) */
    order?: string;
}

/**
 * Strictly typed options for Report getPage() - includes pagination
 */
export interface ReportPageOptions extends ReportListOptions {
    /** Items per page (1-100, default: 25) */
    perPage?: number;
    /** Page number */
    page?: number;
}

// ===== ServiceTime Endpoint Options =====
// Note: ServiceTime endpoint does not support where[] filtering in the API
/**
 * Strictly typed options for ServiceTime getAll() - no pagination options
 */
export interface ServiceTimeListOptions {
    /** Filter by specific fields - Note: ServiceTime endpoint does not support where[] filtering */
    where?: never; // ServiceTime endpoint doesn't support where clauses
    /** Include related resources */
    include?: string[];
    /** Order by field (prefix with '-' for descending) */
    order?: string;
}

/**
 * Strictly typed options for ServiceTime getPage() - includes pagination
 */
export interface ServiceTimePageOptions extends ServiceTimeListOptions {
    /** Items per page (1-100, default: 25) */
    perPage?: number;
    /** Page number */
    page?: number;
}
