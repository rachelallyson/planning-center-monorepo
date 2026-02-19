/**
 * Planning Center People API Types
 * Based on JSON:API 1.0 specification.
 * Each *Resource is a plain interface (type, id, attributes and resolved relationships at top level).
 */

import type {
  Links,
  Meta,
  Relationship,
  ListResponse,
} from '@rachelallyson/planning-center-base-ts';

export type { ListResponse };

/** Relationship reference when the related resource was not in the response's `included` (resolver leaves it as { type, id }). */
export interface ResourceRef {
  type: string;
  id: string;
}

// ===== Person Resource =====

export interface PersonAttributes {
  first_name?: string;
  last_name?: string;
  given_name?: string | null;
  middle_name?: string | null;
  nickname?: string | null;
  /** API may return YYYY-MM-DD string or null when not set */
  birthdate?: string | null;
  anniversary?: string | null;
  gender?: string | null;
  grade?: string | null;
  child?: boolean;
  status?: string;
  medical_notes?: string | null;
  created_at?: string;
  updated_at?: string;
  name?: string;
  family_name?: string;
  job_title?: string;
  employer?: string;
  school?: string;
  graduation_year?: string | null;
  avatar?: string;
  site_administrator?: boolean;
  accounting_administrator?: boolean;
  people_permissions?: string | null;
  // Additional attributes seen in live responses
  directory_status?: string | null;
  login_identifier?: string | null;
  membership?: string | null;
  remote_id?: string | null;
  demographic_avatar_url?: string | null;
  inactivated_at?: string | null;
  resource_permission_flags?: Record<string, boolean>;
  /** Relationship ID for create/update payloads */
  primary_campus_id?: string | null;
  /** Relationship ID for create/update payloads */
  household_id?: string | null;
}

/** Person relationship keys with resolved *Resource types (output of getSingle/getList) */
export interface PersonRelOutputs {
  emails?: EmailResource[];
  phone_numbers?: PhoneNumberResource[];
  addresses?: AddressResource[];
  household?: HouseholdResource | null;
  primary_campus?: CampusResource | null;
  workflow_cards?: WorkflowCardResource[];
  notes?: NoteResource[];
  field_data?: FieldDatumResource[];
  social_profiles?: SocialProfileResource[];
}

/** Person resource as returned by the client (attributes and relationships at top level). API may return type as "Person" or "person". */
export interface PersonResource extends PersonAttributes, PersonRelOutputs {
  type: 'Person' | 'person';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type PeopleList = ListResponse<PersonResource>;
export type PersonSingle = PersonResource;

// ===== Email Resource =====

/** Per docs/public/vertices/people/vertices/email.html */
export interface EmailAttributes {
  address: string;
  /** API returns string (e.g. "Home", "Work", "Other") */
  location: string;
  primary?: boolean;
  created_at?: string;
  updated_at?: string;
  blocked?: boolean;
}

/** Email relationship keys with resolved *Resource types */
export interface EmailRelOutputs {
  person?: PersonResource | null;
}

/** Email resource as returned by the client (attributes and relationships at top level) */
export interface EmailResource extends EmailAttributes, EmailRelOutputs {
  type: 'Email';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type EmailsList = ListResponse<EmailResource>;
export type EmailSingle = EmailResource;

// ===== Phone Number Resource =====

/** Per docs/public/vertices/people/vertices/phone.html */
export interface PhoneNumberAttributes {
  number: string;
  /** API returns string (e.g. "Home", "Work", "Other") */
  location?: string;
  primary?: boolean;
  created_at?: string;
  updated_at?: string;
  /** Assignable on create/update per API docs */
  carrier?: string | null;
  country_code?: string | null;
  /** E.164 format; only with ?fields */
  e164?: string | null;
  /** Only when requested with ?fields */
  formatted_number?: string | null;
  international?: string | null;
  national?: string | null;
}

/** PhoneNumber relationship keys with resolved *Resource types */
export interface PhoneNumberRelOutputs {
  person?: PersonResource | null;
}

/** PhoneNumber resource as returned by the client */
export interface PhoneNumberResource extends PhoneNumberAttributes, PhoneNumberRelOutputs {
  type: 'PhoneNumber';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type PhoneNumbersList = ListResponse<PhoneNumberResource>;
export type PhoneNumberSingle = PhoneNumberResource;

// ===== Address Resource =====

export interface AddressAttributes {
  street_line_1?: string | null;
  street_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country_code?: string | null;
  country_name?: string | null;
  location?: string;
  primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Address relationship keys with resolved *Resource types */
export interface AddressRelOutputs {
  person?: PersonResource | null;
  household?: HouseholdResource | null;
}

/** Address resource as returned by the client */
export interface AddressResource extends AddressAttributes, AddressRelOutputs {
  type: 'Address';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type AddressesList = ListResponse<AddressResource>;
export type AddressSingle = AddressResource;

// ===== Household Resource =====

/** Per docs/public/vertices/people/vertices/household.html */
export interface HouseholdAttributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
  /** File UUID (see File Uploads in API docs) */
  avatar?: string | null;
  member_count?: number;
  primary_contact_id?: string | null;
  primary_contact_name?: string | null;
}

export interface HouseholdRelationships {
  people?: Relationship;
  primary_contact?: Relationship;
}

/** Household relationship keys with resolved *Resource types */
export interface HouseholdRelOutputs {
  people?: PersonResource[];
  primary_contact?: PersonResource | null;
}

/** Household resource as returned by the client */
export interface HouseholdResource extends HouseholdAttributes, HouseholdRelOutputs {
  type: 'Household';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type HouseholdsList = ListResponse<HouseholdResource>;
export type HouseholdSingle = HouseholdResource;

/** Payload for creating a household; API accepts attributes and optional relationships (e.g. people). */
export type HouseholdCreatePayload = HouseholdAttributes & {
  relationships?: { people?: { data: Array<{ type: 'Person'; id: string }> } };
};

// ===== Social Profile Resource =====

export interface SocialProfileAttributes {
  site?: string;
  url?: string;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** SocialProfile has no relationships in API */
export type SocialProfileRelOutputs = Record<string, never>;

/** SocialProfile resource as returned by the client (attributes at top level, no relationships) */
export interface SocialProfileResource extends SocialProfileAttributes {
  type: 'SocialProfile';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type SocialProfilesList = ListResponse<SocialProfileResource>;
export type SocialProfileSingle = SocialProfileResource;

// ===== Field Definition Resource =====

/** API returns these; additional values may exist in some orgs */
export type FieldDataType = 'boolean' | 'checkboxes' | 'date' | 'file' | 'number' | 'select' | 'string' | 'text' | string;

export interface FieldDefinitionAttributes {
  /** API returns varying shapes; use unknown to accept any response */
  config: unknown;
  data_type: FieldDataType | undefined;
  deleted_at: string | null | false | undefined; // API can omit (undefined) or return date string, null, or false
  name: string;
  sequence: number;
  slug: string;
  tab_id: number;
}

/** FieldDefinition resource as returned by the client */
export interface FieldDefinitionResource extends FieldDefinitionAttributes {
  type: 'FieldDefinition';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type FieldDefinitionsList = ListResponse<FieldDefinitionResource>;
export type FieldDefinitionSingle = FieldDefinitionResource;

// ===== Tab Resource =====

/** Per docs/public/vertices/people/vertices/tab.html */
export interface TabAttributes {
  name?: string;
  sequence?: number;
  slug?: string;
}

/** Tab resource as returned by the client */
export interface TabResource extends TabAttributes {
  type: 'Tab';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type TabsList = ListResponse<TabResource>;
export type TabSingle = TabResource;

// ===== Field Option Resource =====

export interface FieldOptionAttributes {
  value: string;
  sequence: string | number;
}

/** FieldOption resource as returned by the client */
export interface FieldOptionResource extends FieldOptionAttributes {
  type: 'FieldOption';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type FieldOptionsList = ListResponse<FieldOptionResource>;
export type FieldOptionSingle = FieldOptionResource;

// ===== Field Datum Resource (aka field_data) =====

export interface FieldDatumFileMetadata {
  url?: string | null;
  // Additional file metadata that may be present (e.g., filename, size, etc.)
  [key: string]: string | number | boolean | null | undefined;
}

/** Per docs/public/vertices/people/vertices/field_data.html */
export interface FieldDatumAttributes {
  value?: string | null;
  /** URL string or metadata object from API */
  file?: string | FieldDatumFileMetadata | null;
  file_content_type?: string | null;
  file_name?: string | null;
  /** integer in API */
  file_size?: number | null;
}

/** FieldDatum relationship keys. field_definition is full resource when included, or ResourceRef when not in response. */
export interface FieldDatumRelOutputs {
  field_definition?: FieldDefinitionResource | ResourceRef | null;
  field_option?: FieldOptionResource | null;
  customizable?: PersonResource | null;
}

/** FieldDatum resource as returned by the client (attributes and relationships at top level) */
export interface FieldDatumResource extends FieldDatumAttributes, FieldDatumRelOutputs {
  type: 'FieldDatum';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type FieldDataList = ListResponse<FieldDatumResource>;
export type FieldDataSingle = FieldDatumResource;

// ===== List Resource =====

export interface ListAttributes {
  name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}


/** List resource as returned by the client */
export interface ListResource extends ListAttributes {
  type: 'List';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type ListsList = ListResponse<ListResource>;
export type ListSingle = ListResource;

// ===== List Category Resource =====

export interface ListCategoryAttributes {
  name?: string;
  created_at: string;
  updated_at: string;
  /** API may return string or number */
  organization_id: string | number;
}

/** ListCategory resource as returned by the client */
export interface ListCategoryResource extends ListCategoryAttributes {
  type: 'ListCategory';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type ListCategoriesList = ListResponse<ListCategoryResource>;
export type ListCategorySingle = ListCategoryResource;

// ===== List Share Resource =====

export interface ListShareAttributes {
  permission?: string;
  created_at?: string;
  updated_at?: string;
}

/** ListShare resource as returned by the client */
export interface ListShareResource extends ListShareAttributes {
  type: 'ListShare';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type ListSharesList = ListResponse<ListShareResource>;
export type ListShareSingle = ListShareResource;

// ===== List Star Resource =====

export interface ListStarAttributes {
  created_at?: string;
  updated_at?: string;
}

/** ListStar resource as returned by the client */
export interface ListStarResource extends ListStarAttributes {
  type: 'ListStar';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type ListStarsList = ListResponse<ListStarResource>;
export type ListStarSingle = ListStarResource;

// ===== List Rule Resource =====
// GET /people/v2/lists/:id/rules

export interface ListRuleAttributes {
  group?: string;
  operator?: string;
  value?: string;
  created_at?: string;
  updated_at?: string;
}

/** ListRule resource as returned by the client */
export interface ListRuleResource extends ListRuleAttributes {
  type: 'Rule';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type ListRulesList = ListResponse<ListRuleResource>;
export type ListRuleSingle = ListRuleResource;

// ===== Note Resource =====

export interface NoteAttributes {
  note?: string;
  /** API may return string or number */
  note_category_id?: string | number;
  created_at?: string;
  updated_at?: string;
}

/** Note relationship keys with resolved *Resource types */
export interface NoteRelOutputs {
  person?: PersonResource | null;
  note_category?: NoteCategoryResource | null;
  organization?: OrganizationResource | null;
  created_by?: PersonResource | null;
}

/** Note resource as returned by the client */
export interface NoteResource extends NoteAttributes, NoteRelOutputs {
  type: 'Note';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type NotesList = ListResponse<NoteResource>;
export type NoteSingle = NoteResource;

// ===== Note Category Resource =====

export interface NoteCategoryAttributes {
  /** API may return string, number, null, or boolean in some contexts */
  name: string | number | null | boolean | undefined;
  /** API may return boolean, number (0/1), string, or null */
  locked?: boolean | number | string | null;
  /** API may return number, string, or null */
  organization_id?: number | string | null;
  /** API may return string, number (timestamp), or null */
  created_at?: string | number | null;
  updated_at?: string | number | null;
}

/** NoteCategory resource as returned by the client */
export interface NoteCategoryResource extends NoteCategoryAttributes {
  type: 'NoteCategory';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type NoteCategoriesList = ListResponse<NoteCategoryResource>;
export type NoteCategorySingle = NoteCategoryResource;

// ===== Note Category Share Resource =====

export interface NoteCategoryShareAttributes {
  permission?: string;
  created_at?: string;
  updated_at?: string;
}

/** NoteCategoryShare resource as returned by the client */
export interface NoteCategoryShareResource extends NoteCategoryShareAttributes {
  type: 'NoteCategoryShare';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type NoteCategorySharesList = ListResponse<NoteCategoryShareResource>;
export type NoteCategoryShareSingle = NoteCategoryShareResource;

// ===== Note Category Subscription Resource =====

export interface NoteCategorySubscriptionAttributes {
  created_at?: string;
  updated_at?: string;
}

/** NoteCategorySubscription resource as returned by the client */
export interface NoteCategorySubscriptionResource extends NoteCategorySubscriptionAttributes {
  type: 'NoteCategorySubscription';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type NoteCategorySubscriptionsList = ListResponse<NoteCategorySubscriptionResource>;
export type NoteCategorySubscriptionSingle = NoteCategorySubscriptionResource;

// ===== Workflow Resource =====

export interface WorkflowAttributes {
  name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

/** Workflow resource as returned by the client */
export interface WorkflowResource extends WorkflowAttributes {
  type: 'Workflow';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type WorkflowsList = ListResponse<WorkflowResource>;
export type WorkflowSingle = WorkflowResource;

// ===== Workflow Card Resource =====

export interface WorkflowCardAttributes {
  // Common fields
  title?: string;
  description?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;

  // Computed/Read-only fields (cannot be assigned directly)
  stage?: string; // Computed field - cannot be assigned
  completed_at?: string | null; // Computed field - cannot be assigned
  overdue?: boolean; // Computed field
  calculated_due_at_in_days_ago?: number | null; // Computed field
  flagged_for_notification_at?: string | null; // Computed field
  moved_to_step_at?: string | null; // Computed field

  // Fields that can be set via actions (not direct assignment)
  snooze_until?: string | null; // Set via snooze action
  removed_at?: string | null; // Set via remove action

  overdue_at?: string | null;
  stage_id?: string;

  // Assignable/read from API (API may return null when unset)
  sticky_assignment?: boolean | null;
  step_title?: string;
}

/** WorkflowCard relationship keys with resolved *Resource types */
export interface WorkflowCardRelOutputs {
  workflow?: WorkflowResource | null;
  person?: PersonResource | null;
  /** API returns assignee with type "Assignee" or "Person"; same shape as Person. */
  assignee?: (Omit<PersonResource, 'type'> & { type: 'Assignee' | 'Person' | 'person' }) | null;
  /** Resolved when included; step shape varies by workflow */
  current_step?: object | null;
}

// Assignable fields for workflow card updates (only these can be set via PATCH)
export interface WorkflowCardAssignableAttributes {
  sticky_assignment?: boolean | null;
  assignee_id?: string;
  person_id?: string;
}

// Parameters for workflow card actions
export interface WorkflowCardSnoozeAttributes {
  duration: number; // Duration in days
}

export interface WorkflowCardEmailAttributes {
  subject: string;
  note: string;
}

/** WorkflowCard resource as returned by the client */
export interface WorkflowCardResource extends WorkflowCardAttributes, WorkflowCardRelOutputs {
  type: 'WorkflowCard';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type WorkflowCardsList = ListResponse<WorkflowCardResource>;
export type WorkflowCardSingle = WorkflowCardResource;

// ===== Workflow Card Note Resource =====

export interface WorkflowCardNoteAttributes {
  note?: string;
}



/** WorkflowCardNote resource as returned by the client */
export interface WorkflowCardNoteResource extends WorkflowCardNoteAttributes {
  type: 'WorkflowCardNote';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type WorkflowCardNotesList = ListResponse<WorkflowCardNoteResource>;
export type WorkflowCardNoteSingle = WorkflowCardNoteResource;

// ===== Organization Resource =====

export interface OrganizationAttributes {
  avatar_url?: string | null;
  church_center_subdomain?: string;
  contact_website?: string | null;
  country_code?: string;
  created_at?: string;
  date_format?: string;
  name?: string;
  time_zone?: string;
}

export interface OrganizationRelationships {
  people?: Relationship;
  statistics?: Relationship;
}

/** Organization resource as returned by the client */
export interface OrganizationResource extends OrganizationAttributes {
  type: 'Organization';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type OrganizationsList = ListResponse<OrganizationResource>;
export type OrganizationSingle = OrganizationResource;

// ===== Organization Statistic Resource =====

export interface OrganizationStatisticAttributes {
  name?: string;
  value?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationStatisticRelationships {
  organization?: Relationship;
}

/** OrganizationStatistic resource as returned by the client */
export interface OrganizationStatisticResource extends OrganizationStatisticAttributes {
  type: 'OrganizationStatistic';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type OrganizationStatisticsList = ListResponse<OrganizationStatisticResource>;
export type OrganizationStatisticSingle = OrganizationStatisticResource;

// ===== Campus Resource =====

export interface CampusAttributes {
  name?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  description?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone_number?: string | null;
  website?: string | null;
  twenty_four_hour_time?: boolean | null;
  date_format?: number | null;
  church_center_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CampusRelationships {
  organization?: Relationship;
}

/** Campus resource as returned by the client. API may return "Campus", "campus", or "PrimaryCampus" (e.g. on person.primary_campus). */
export interface CampusResource extends CampusAttributes {
  type: 'Campus' | 'campus' | 'PrimaryCampus';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type CampusesList = ListResponse<CampusResource>;
export type CampusSingle = CampusResource;

// ===== ServiceTime Resource =====

export interface ServiceTimeAttributes {
  start_time?: number; // Minutes from midnight (e.g., 540 for 9:00 AM)
  day?: number | string; // Input: number (0-6), Output: string ('sunday', 'monday', etc.)
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceTimeRelationships {
  organization?: Relationship;
  campus?: Relationship;
}

/** ServiceTime resource as returned by the client */
export interface ServiceTimeResource extends ServiceTimeAttributes {
  type: 'ServiceTime';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type ServiceTimesList = ListResponse<ServiceTimeResource>;
export type ServiceTimeSingle = ServiceTimeResource;

// ===== Form Resource =====

export interface FormAttributes {
  name?: string;
  description?: string | null;
  active?: boolean;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Form relationship keys with resolved *Resource types */
export interface FormRelOutputs {
  campus?: CampusResource | null;
  category?: FormCategoryResource | null;
  organization?: OrganizationResource | null;
  form_category?: FormCategoryResource | null;
}

/** Form resource as returned by the client */
export interface FormResource extends FormAttributes, FormRelOutputs {
  type: 'Form';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type FormsList = ListResponse<FormResource>;
export type FormSingle = FormResource;

// ===== FormCategory Resource =====

export interface FormCategoryAttributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FormCategoryRelationships {
  organization?: Relationship;
}

/** FormCategory resource as returned by the client */
export interface FormCategoryResource extends FormCategoryAttributes {
  type: 'FormCategory';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type FormCategoriesList = ListResponse<FormCategoryResource>;
export type FormCategorySingle = FormCategoryResource;

// ===== FormField Resource =====

export interface FormFieldAttributes {
  name?: string;
  field_type?: string;
  required?: boolean;
  sequence?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FormFieldRelationships {
  form?: Relationship;
}

/** FormField resource as returned by the client */
export interface FormFieldResource extends FormFieldAttributes {
  type: 'FormField';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type FormFieldsList = ListResponse<FormFieldResource>;
export type FormFieldSingle = FormFieldResource;

// ===== FormFieldOption Resource =====

export interface FormFieldOptionAttributes {
  value?: string;
  sequence?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FormFieldOptionRelationships {
  form_field?: Relationship;
}

/** FormFieldOption resource as returned by the client */
export interface FormFieldOptionResource extends FormFieldOptionAttributes {
  type: 'FormFieldOption';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type FormFieldOptionsList = ListResponse<FormFieldOptionResource>;
export type FormFieldOptionSingle = FormFieldOptionResource;

// ===== FormSubmission Resource =====

export interface FormSubmissionAttributes {
  submitted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FormSubmissionRelationships {
  form?: Relationship;
  person?: Relationship;
}

/** FormSubmission resource as returned by the client */
export interface FormSubmissionResource extends FormSubmissionAttributes {
  type: 'FormSubmission';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type FormSubmissionsList = ListResponse<FormSubmissionResource>;
export type FormSubmissionSingle = FormSubmissionResource;

// ===== FormSubmissionValue Resource =====

export interface FormSubmissionValueAttributes {
  value?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FormSubmissionValueRelationships {
  form_submission?: Relationship;
  form_field?: Relationship;
}

/** FormSubmissionValue resource as returned by the client */
export interface FormSubmissionValueResource extends FormSubmissionValueAttributes {
  type: 'FormSubmissionValue';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type FormSubmissionValuesList = ListResponse<FormSubmissionValueResource>;
export type FormSubmissionValueSingle = FormSubmissionValueResource;

// ===== Report Resource =====

export interface ReportAttributes {
  name?: string;
  /** API can return null for report body. */
  body?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Report relationship keys with resolved *Resource types */
export interface ReportRelOutputs {
  organization?: OrganizationResource | null;
  created_by?: PersonResource | null;
  updated_by?: PersonResource | null;
}

/** Report resource as returned by the client */
export interface ReportResource extends ReportAttributes, ReportRelOutputs {
  type: 'Report';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type ReportsList = ListResponse<ReportResource>;
export type ReportSingle = ReportResource;

// ===== Included union for People =====

export type PeopleIncluded =
  | EmailResource
  | AddressResource
  | PhoneNumberResource
  | HouseholdResource
  | SocialProfileResource
  | FieldDatumResource
  | TabResource
  | CampusResource
  | ServiceTimeResource
  | FormResource
  | FormCategoryResource
  | FormFieldResource
  | FormFieldOptionResource
  | FormSubmissionResource
  | FormSubmissionValueResource
  | ReportResource;
