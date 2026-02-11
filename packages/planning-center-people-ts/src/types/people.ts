/**
 * Planning Center People API Types
 * Based on JSON:API 1.0 specification
 */

import {
  Attributes,
  Meta,
  Relationship,
  ResourceObject,
  TopLevelLinks,
} from './json-api';
import type { FlattenedResource } from '@rachelallyson/planning-center-base-ts';

/** List response shape returned by the client (data is always flattened) */
export interface ListResponse<T> {
  data: T[];
  meta?: Meta;
  links?: TopLevelLinks;
}

// ===== Person Resource =====

export interface PersonAttributes extends Attributes {
  first_name?: string;
  last_name?: string;
  given_name?: string | null;
  middle_name?: string | null;
  nickname?: string | null;
  birthdate?: string;
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
}

export interface PersonRelationships {
  emails?: Relationship;
  phone_numbers?: Relationship;
  addresses?: Relationship;
  household?: Relationship;
  primary_campus?: Relationship;
  gender?: Relationship;
  workflow_cards?: Relationship;
  notes?: Relationship;
  field_data?: Relationship;
  social_profiles?: Relationship;
}

/** Internal JSON:API resource shape; use PersonResource for the type returned by the client */
export interface PersonResourceObject
  extends ResourceObject<'Person', PersonAttributes, PersonRelationships> { }

/**
 * Mapping of Person relationship keys to their resource types (internal JSON:API shape)
 */
export type PersonRelationshipMap = {
  emails: EmailResourceObject[];
  phone_numbers: PhoneNumberResourceObject[];
  addresses: AddressResourceObject[];
  household: HouseholdResourceObject;
  primary_campus: CampusResourceObject;
  gender: ResourceObject<string, any, any>; // Gender is a simple resource, not fully typed
  workflow_cards: WorkflowCardResourceObject[];
  notes: NoteResourceObject[];
  field_data: FieldDatumResourceObject[];
  social_profiles: SocialProfileResourceObject[];
};

/**
 * Map from People API resource type name to that type's relationship map.
 * Used so nested FlattenedResource types get correct relationship typing.
 */
export interface PeopleResourceTypeToRelMap extends Record<string, object> {
  Person: PersonRelationshipMap;
  FieldDatum: FieldDatumRelationshipMap;
}

/** Person resource as returned by the client (attributes and relationships at top level) */
export type PersonResource = FlattenedResource<
  PersonResourceObject['type'],
  PersonAttributes,
  PersonRelationships,
  PersonRelationshipMap,
  PeopleResourceTypeToRelMap
>;

export type PeopleList = ListResponse<PersonResource>;
export type PersonSingle = PersonResource;

// ===== Email Resource =====

export interface EmailAttributes extends Attributes {
  address: string;
  location: 'Home' | 'Work' | 'Other';
  primary?: boolean;
  created_at?: string;
  updated_at?: string;
  blocked?: boolean;
}

export interface EmailRelationships {
  person?: Relationship;
}

/** Internal JSON:API resource shape; use EmailResource for the type returned by the client */
export interface EmailResourceObject
  extends ResourceObject<'Email', EmailAttributes, EmailRelationships> { }

/** Email resource as returned by the client (attributes and relationships at top level) */
export type EmailResource = FlattenedResource<'Email', EmailAttributes, EmailRelationships>;

export type EmailsList = ListResponse<EmailResource>;
export type EmailSingle = EmailResource;

// ===== Phone Number Resource =====

export interface PhoneNumberAttributes extends Attributes {
  number: string;
  location: 'Home' | 'Work' | 'Other';
  primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PhoneNumberRelationships {
  person?: Relationship;
}

/** Internal JSON:API resource shape; use PhoneNumberResource for the type returned by the client */
export interface PhoneNumberResourceObject
  extends ResourceObject<
    'PhoneNumber',
    PhoneNumberAttributes,
    PhoneNumberRelationships
  > { }

/** PhoneNumber resource as returned by the client */
export type PhoneNumberResource = FlattenedResource<'PhoneNumber', PhoneNumberAttributes, PhoneNumberRelationships>;

export type PhoneNumbersList = ListResponse<PhoneNumberResource>;
export type PhoneNumberSingle = PhoneNumberResource;

// ===== Address Resource =====

export interface AddressAttributes extends Attributes {
  street_line_1?: string;
  street_line_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country_code?: string;
  country_name?: string;
  location?: string;
  primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AddressRelationships {
  person?: Relationship;
  household?: Relationship;
}

/** Internal JSON:API resource shape; use AddressResource for the type returned by the client */
export interface AddressResourceObject
  extends ResourceObject<'Address', AddressAttributes, AddressRelationships> { }

/** Address resource as returned by the client */
export type AddressResource = FlattenedResource<'Address', AddressAttributes, AddressRelationships>;

export type AddressesList = ListResponse<AddressResource>;
export type AddressSingle = AddressResource;

// ===== Household Resource =====

export interface HouseholdAttributes extends Attributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HouseholdRelationships {
  people?: Relationship;
  primary_contact?: Relationship;
}

/** Internal JSON:API resource shape; use HouseholdResource for the type returned by the client */
export interface HouseholdResourceObject
  extends ResourceObject<
    'Household',
    HouseholdAttributes,
    HouseholdRelationships
  > { }

/** Household resource as returned by the client */
export type HouseholdResource = FlattenedResource<'Household', HouseholdAttributes, HouseholdRelationships>;

export type HouseholdsList = ListResponse<HouseholdResource>;
export type HouseholdSingle = HouseholdResource;

// ===== Social Profile Resource =====

export interface SocialProfileAttributes extends Attributes {
  site?: string;
  url?: string;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SocialProfileRelationships {
  // According to API docs, SocialProfile has no relationships
}

/** Internal JSON:API resource shape; use SocialProfileResource for the type returned by the client */
export interface SocialProfileResourceObject
  extends ResourceObject<
    'SocialProfile',
    SocialProfileAttributes,
    SocialProfileRelationships
  > { }

/** SocialProfile resource as returned by the client */
export type SocialProfileResource = FlattenedResource<'SocialProfile', SocialProfileAttributes, SocialProfileRelationships>;

export type SocialProfilesList = ListResponse<SocialProfileResource>;
export type SocialProfileSingle = SocialProfileResource;

// ===== Field Definition Resource =====

export type FieldDataType = 'boolean' | 'checkboxes' | 'date' | 'file' | 'number'| 'select' | 'string' | 'text';

export interface FieldDefinitionAttributes extends Attributes {
  config: string | Record<string, any> | null;
  data_type: FieldDataType;
  deleted_at: string | null | false; // Can be date string, null, or boolean false
  name: string;
  sequence: number;
  slug: string;
  tab_id: number;
}

export interface FieldDefinitionRelationships {
  tab?: Relationship;
}

/** Internal JSON:API resource shape; use FieldDefinitionResource for the type returned by the client */
export interface FieldDefinitionResourceObject
  extends ResourceObject<
    'FieldDefinition',
    FieldDefinitionAttributes,
    FieldDefinitionRelationships
  > { }

/** FieldDefinition resource as returned by the client */
export type FieldDefinitionResource = FlattenedResource<'FieldDefinition', FieldDefinitionAttributes, FieldDefinitionRelationships>;

export type FieldDefinitionsList = ListResponse<FieldDefinitionResource>;
export type FieldDefinitionSingle = FieldDefinitionResource;

// ===== Tab Resource =====

export interface TabAttributes extends Attributes {
  name?: string;
  sequence?: string | number;
  created_at?: string;
  updated_at?: string;
}

export interface TabRelationships {
  // Tabs may have relationships to field definitions
  field_definitions?: Relationship;
}

/** Internal JSON:API resource shape; use TabResource for the type returned by the client */
export interface TabResourceObject
  extends ResourceObject<
    'Tab',
    TabAttributes,
    TabRelationships
  > { }

/** Tab resource as returned by the client */
export type TabResource = FlattenedResource<'Tab', TabAttributes, TabRelationships>;

export type TabsList = ListResponse<TabResource>;
export type TabSingle = TabResource;

// ===== Field Option Resource =====

export interface FieldOptionAttributes extends Attributes {
  value: string;
  sequence: string | number;
}

export interface FieldOptionRelationships {
  field_definition?: Relationship;
}

/** Internal JSON:API resource shape; use FieldOptionResource for the type returned by the client */
export interface FieldOptionResourceObject
  extends ResourceObject<
    'FieldOption',
    FieldOptionAttributes,
    FieldOptionRelationships
  > { }

/** FieldOption resource as returned by the client */
export type FieldOptionResource = FlattenedResource<'FieldOption', FieldOptionAttributes, FieldOptionRelationships>;

export type FieldOptionsList = ListResponse<FieldOptionResource>;
export type FieldOptionSingle = FieldOptionResource;

// ===== Field Datum Resource (aka field_data) =====

export interface FieldDatumFileMetadata {
  url?: string | null;
  // Additional file metadata that may be present (e.g., filename, size, etc.)
  [key: string]: string | number | boolean | null | undefined;
}

export interface FieldDatumAttributes extends Attributes {
  value?: string | null;
  file?: FieldDatumFileMetadata | null;
  file_content_type?: string | null;
  file_name?: string | null;
  file_size?: string | number | null;

}

export interface FieldDatumRelationships {
  field_definition?: Relationship;
  field_option?: Relationship;
  // The API uses a polymorphic "customizable" relationship pointing to Person
  customizable?: Relationship;
}

/** Internal JSON:API resource shape; use FieldDatumResource for the type returned by the client */
export interface FieldDatumResourceObject
  extends ResourceObject<
    'FieldDatum',
    FieldDatumAttributes,
    FieldDatumRelationships
  > { }

/**
 * Mapping of FieldDatum relationship keys to their resource types (internal JSON:API shape)
 */
export type FieldDatumRelationshipMap = {
  field_definition: FieldDefinitionResourceObject;
  field_option: FieldOptionResourceObject;
  customizable: PersonResourceObject; // Polymorphic relationship to Person
};

/** FieldDatum resource as returned by the client (attributes and relationships at top level) */
export type FieldDatumResource = FlattenedResource<
  FieldDatumResourceObject['type'],
  FieldDatumAttributes,
  FieldDatumRelationships,
  FieldDatumRelationshipMap,
  PeopleResourceTypeToRelMap
>;

export type FieldDataList = ListResponse<FieldDatumResource>;
export type FieldDataSingle = FieldDatumResource;

// ===== List Resource =====

export interface ListAttributes extends Attributes {
  name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}


/** Internal JSON:API resource shape; use ListResource for the type returned by the client */
export interface ListResourceObject
  extends ResourceObject<'List', ListAttributes, {}> { }

/** List resource as returned by the client */
export type ListResource = FlattenedResource<'List', ListAttributes, Record<string, never>>;

export type ListsList = ListResponse<ListResource>;
export type ListSingle = ListResource;

// ===== List Category Resource =====

export interface ListCategoryAttributes extends Attributes {
  name?: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

export interface ListCategoryRelationships {
  organization?: Relationship;
}

/** Internal JSON:API resource shape; use ListCategoryResource for the type returned by the client */
export interface ListCategoryResourceObject
  extends ResourceObject<
    'ListCategory',
    ListCategoryAttributes,
    ListCategoryRelationships
  > { }

/** ListCategory resource as returned by the client */
export type ListCategoryResource = FlattenedResource<'ListCategory', ListCategoryAttributes, ListCategoryRelationships>;

export type ListCategoriesList = ListResponse<ListCategoryResource>;
export type ListCategorySingle = ListCategoryResource;

// ===== List Share Resource =====

export interface ListShareAttributes extends Attributes {
  permission?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ListShareRelationships {
  list?: Relationship;
  person?: Relationship;
}

/** Internal JSON:API resource shape; use ListShareResource for the type returned by the client */
export interface ListShareResourceObject
  extends ResourceObject<
    'ListShare',
    ListShareAttributes,
    ListShareRelationships
  > { }

/** ListShare resource as returned by the client */
export type ListShareResource = FlattenedResource<'ListShare', ListShareAttributes, ListShareRelationships>;

export type ListSharesList = ListResponse<ListShareResource>;
export type ListShareSingle = ListShareResource;

// ===== List Star Resource =====

export interface ListStarAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface ListStarRelationships {
  list?: Relationship;
  person?: Relationship;
}

/** Internal JSON:API resource shape; use ListStarResource for the type returned by the client */
export interface ListStarResourceObject
  extends ResourceObject<
    'ListStar',
    ListStarAttributes,
    ListStarRelationships
  > { }

/** ListStar resource as returned by the client */
export type ListStarResource = FlattenedResource<'ListStar', ListStarAttributes, ListStarRelationships>;

export type ListStarsList = ListResponse<ListStarResource>;
export type ListStarSingle = ListStarResource;

// ===== List Rule Resource =====
// GET /people/v2/lists/:id/rules

export interface ListRuleAttributes extends Attributes {
  group?: string;
  operator?: string;
  value?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ListRuleRelationships {
  list?: Relationship;
}

/** Internal JSON:API resource shape; use ListRuleResource for the type returned by the client */
export interface ListRuleResourceObject
  extends ResourceObject<
    'Rule',
    ListRuleAttributes,
    ListRuleRelationships
  > { }

/** ListRule resource as returned by the client */
export type ListRuleResource = FlattenedResource<'Rule', ListRuleAttributes, ListRuleRelationships>;

export type ListRulesList = ListResponse<ListRuleResource>;
export type ListRuleSingle = ListRuleResource;

// ===== Note Resource =====

export interface NoteAttributes extends Attributes {
  note?: string;
  note_category_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NoteRelationships {
  person?: Relationship;
  note_category?: Relationship;
  organization?: Relationship;
  created_by?: Relationship;
}

/** Internal JSON:API resource shape; use NoteResource for the type returned by the client */
export interface NoteResourceObject
  extends ResourceObject<'Note', NoteAttributes, NoteRelationships> { }

/** Note resource as returned by the client */
export type NoteResource = FlattenedResource<'Note', NoteAttributes, NoteRelationships>;

export type NotesList = ListResponse<NoteResource>;
export type NoteSingle = NoteResource;

// ===== Note Category Resource =====

export interface NoteCategoryAttributes extends Attributes {
  name: string;
  locked: boolean;
  organization_id: number;
  created_at: string;
  updated_at: string;
}

export interface NoteCategoryRelationships {
  organization?: Relationship;
  shares?: Relationship;
  subscriptions?: Relationship;
}

/** Internal JSON:API resource shape; use NoteCategoryResource for the type returned by the client */
export interface NoteCategoryResourceObject
  extends ResourceObject<
    'NoteCategory',
    NoteCategoryAttributes,
    NoteCategoryRelationships
  > { }

/** NoteCategory resource as returned by the client */
export type NoteCategoryResource = FlattenedResource<'NoteCategory', NoteCategoryAttributes, NoteCategoryRelationships>;

export type NoteCategoriesList = ListResponse<NoteCategoryResource>;
export type NoteCategorySingle = NoteCategoryResource;

// ===== Note Category Share Resource =====

export interface NoteCategoryShareAttributes extends Attributes {
  permission?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NoteCategoryShareRelationships {
  category?: Relationship;
  person?: Relationship;
}

/** Internal JSON:API resource shape; use NoteCategoryShareResource for the type returned by the client */
export interface NoteCategoryShareResourceObject
  extends ResourceObject<
    'NoteCategoryShare',
    NoteCategoryShareAttributes,
    NoteCategoryShareRelationships
  > { }

/** NoteCategoryShare resource as returned by the client */
export type NoteCategoryShareResource = FlattenedResource<'NoteCategoryShare', NoteCategoryShareAttributes, NoteCategoryShareRelationships>;

export type NoteCategorySharesList = ListResponse<NoteCategoryShareResource>;
export type NoteCategoryShareSingle = NoteCategoryShareResource;

// ===== Note Category Subscription Resource =====

export interface NoteCategorySubscriptionAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface NoteCategorySubscriptionRelationships {
  category?: Relationship;
  person?: Relationship;
}

/** Internal JSON:API resource shape; use NoteCategorySubscriptionResource for the type returned by the client */
export interface NoteCategorySubscriptionResourceObject
  extends ResourceObject<
    'NoteCategorySubscription',
    NoteCategorySubscriptionAttributes,
    NoteCategorySubscriptionRelationships
  > { }

/** NoteCategorySubscription resource as returned by the client */
export type NoteCategorySubscriptionResource = FlattenedResource<'NoteCategorySubscription', NoteCategorySubscriptionAttributes, NoteCategorySubscriptionRelationships>;

export type NoteCategorySubscriptionsList = ListResponse<NoteCategorySubscriptionResource>;
export type NoteCategorySubscriptionSingle = NoteCategorySubscriptionResource;

// ===== Workflow Resource =====

export interface WorkflowAttributes extends Attributes {
  name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkflowRelationships {
  workflow_category?: Relationship;
  campus?: Relationship;
}

/** Internal JSON:API resource shape; use WorkflowResource for the type returned by the client */
export interface WorkflowResourceObject
  extends ResourceObject<
    'Workflow',
    WorkflowAttributes,
    WorkflowRelationships
  > { }

/** Workflow resource as returned by the client */
export type WorkflowResource = FlattenedResource<'Workflow', WorkflowAttributes, WorkflowRelationships>;

export type WorkflowsList = ListResponse<WorkflowResource>;
export type WorkflowSingle = WorkflowResource;

// ===== Workflow Card Resource =====

export interface WorkflowCardAttributes extends Attributes {
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

  // Legacy fields (may be deprecated)
  overdue_at?: string | null;
  stage_id?: string;
}

// Assignable fields for workflow card updates (only these can be set via PATCH)
export interface WorkflowCardAssignableAttributes {
  sticky_assignment?: boolean;
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

export interface WorkflowCardRelationships {
  workflow?: Relationship;
  person?: Relationship;
  assignee?: Relationship;
  current_step?: Relationship;
}

/** Internal JSON:API resource shape; use WorkflowCardResource for the type returned by the client */
export interface WorkflowCardResourceObject
  extends ResourceObject<
    'WorkflowCard',
    WorkflowCardAttributes,
    WorkflowCardRelationships
  > { }

/** WorkflowCard resource as returned by the client */
export type WorkflowCardResource = FlattenedResource<'WorkflowCard', WorkflowCardAttributes, WorkflowCardRelationships>;

export type WorkflowCardsList = ListResponse<WorkflowCardResource>;
export type WorkflowCardSingle = WorkflowCardResource;

// ===== Workflow Card Note Resource =====

export interface WorkflowCardNoteAttributes extends Attributes {
  note?: string;
}



/** Internal JSON:API resource shape; use WorkflowCardNoteResource for the type returned by the client */
export interface WorkflowCardNoteResourceObject
  extends ResourceObject<
    'WorkflowCardNote',
    WorkflowCardNoteAttributes,
    {}> { }

/** WorkflowCardNote resource as returned by the client */
export type WorkflowCardNoteResource = FlattenedResource<'WorkflowCardNote', WorkflowCardNoteAttributes, Record<string, never>>;

export type WorkflowCardNotesList = ListResponse<WorkflowCardNoteResource>;
export type WorkflowCardNoteSingle = WorkflowCardNoteResource;

// ===== Organization Resource =====

export interface OrganizationAttributes extends Attributes {
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

/** Internal JSON:API resource shape; use OrganizationResource for the type returned by the client */
export interface OrganizationResourceObject
  extends ResourceObject<
    'Organization',
    OrganizationAttributes,
    OrganizationRelationships
  > { }

/** Organization resource as returned by the client */
export type OrganizationResource = FlattenedResource<'Organization', OrganizationAttributes, OrganizationRelationships>;

export type OrganizationsList = ListResponse<OrganizationResource>;
export type OrganizationSingle = OrganizationResource;

// ===== Organization Statistic Resource =====

export interface OrganizationStatisticAttributes extends Attributes {
  name?: string;
  value?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationStatisticRelationships {
  organization?: Relationship;
}

/** Internal JSON:API resource shape; use OrganizationStatisticResource for the type returned by the client */
export interface OrganizationStatisticResourceObject
  extends ResourceObject<
    'OrganizationStatistic',
    OrganizationStatisticAttributes,
    OrganizationStatisticRelationships
  > { }

/** OrganizationStatistic resource as returned by the client */
export type OrganizationStatisticResource = FlattenedResource<'OrganizationStatistic', OrganizationStatisticAttributes, OrganizationStatisticRelationships>;

export type OrganizationStatisticsList = ListResponse<OrganizationStatisticResource>;
export type OrganizationStatisticSingle = OrganizationStatisticResource;

// ===== Campus Resource =====

export interface CampusAttributes extends Attributes {
  name: string;
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

/** Internal JSON:API resource shape; use CampusResource for the type returned by the client */
export interface CampusResourceObject
  extends ResourceObject<
    'Campus',
    CampusAttributes,
    CampusRelationships
  > { }

/** Campus resource as returned by the client */
export type CampusResource = FlattenedResource<'Campus', CampusAttributes, CampusRelationships>;

export type CampusesList = ListResponse<CampusResource>;
export type CampusSingle = CampusResource;

// ===== ServiceTime Resource =====

export interface ServiceTimeAttributes extends Attributes {
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

/** Internal JSON:API resource shape; use ServiceTimeResource for the type returned by the client */
export interface ServiceTimeResourceObject
  extends ResourceObject<
    'ServiceTime',
    ServiceTimeAttributes,
    ServiceTimeRelationships
  > { }

/** ServiceTime resource as returned by the client */
export type ServiceTimeResource = FlattenedResource<'ServiceTime', ServiceTimeAttributes, ServiceTimeRelationships>;

export type ServiceTimesList = ListResponse<ServiceTimeResource>;
export type ServiceTimeSingle = ServiceTimeResource;

// ===== Form Resource =====

export interface FormAttributes extends Attributes {
  name?: string;
  description?: string;
  active?: boolean;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FormRelationships {
  organization?: Relationship;
  form_category?: Relationship;
}

/** Internal JSON:API resource shape; use FormResource for the type returned by the client */
export interface FormResourceObject
  extends ResourceObject<
    'Form',
    FormAttributes,
    FormRelationships
  > { }

/** Form resource as returned by the client */
export type FormResource = FlattenedResource<'Form', FormAttributes, FormRelationships>;

export type FormsList = ListResponse<FormResource>;
export type FormSingle = FormResource;

// ===== FormCategory Resource =====

export interface FormCategoryAttributes extends Attributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FormCategoryRelationships {
  organization?: Relationship;
}

/** Internal JSON:API resource shape; use FormCategoryResource for the type returned by the client */
export interface FormCategoryResourceObject
  extends ResourceObject<
    'FormCategory',
    FormCategoryAttributes,
    FormCategoryRelationships
  > { }

/** FormCategory resource as returned by the client */
export type FormCategoryResource = FlattenedResource<'FormCategory', FormCategoryAttributes, FormCategoryRelationships>;

export type FormCategoriesList = ListResponse<FormCategoryResource>;
export type FormCategorySingle = FormCategoryResource;

// ===== FormField Resource =====

export interface FormFieldAttributes extends Attributes {
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

/** Internal JSON:API resource shape; use FormFieldResource for the type returned by the client */
export interface FormFieldResourceObject
  extends ResourceObject<
    'FormField',
    FormFieldAttributes,
    FormFieldRelationships
  > { }

/** FormField resource as returned by the client */
export type FormFieldResource = FlattenedResource<'FormField', FormFieldAttributes, FormFieldRelationships>;

export type FormFieldsList = ListResponse<FormFieldResource>;
export type FormFieldSingle = FormFieldResource;

// ===== FormFieldOption Resource =====

export interface FormFieldOptionAttributes extends Attributes {
  value?: string;
  sequence?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FormFieldOptionRelationships {
  form_field?: Relationship;
}

/** Internal JSON:API resource shape; use FormFieldOptionResource for the type returned by the client */
export interface FormFieldOptionResourceObject
  extends ResourceObject<
    'FormFieldOption',
    FormFieldOptionAttributes,
    FormFieldOptionRelationships
  > { }

/** FormFieldOption resource as returned by the client */
export type FormFieldOptionResource = FlattenedResource<'FormFieldOption', FormFieldOptionAttributes, FormFieldOptionRelationships>;

export type FormFieldOptionsList = ListResponse<FormFieldOptionResource>;
export type FormFieldOptionSingle = FormFieldOptionResource;

// ===== FormSubmission Resource =====

export interface FormSubmissionAttributes extends Attributes {
  submitted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FormSubmissionRelationships {
  form?: Relationship;
  person?: Relationship;
}

/** Internal JSON:API resource shape; use FormSubmissionResource for the type returned by the client */
export interface FormSubmissionResourceObject
  extends ResourceObject<
    'FormSubmission',
    FormSubmissionAttributes,
    FormSubmissionRelationships
  > { }

/** FormSubmission resource as returned by the client */
export type FormSubmissionResource = FlattenedResource<'FormSubmission', FormSubmissionAttributes, FormSubmissionRelationships>;

export type FormSubmissionsList = ListResponse<FormSubmissionResource>;
export type FormSubmissionSingle = FormSubmissionResource;

// ===== FormSubmissionValue Resource =====

export interface FormSubmissionValueAttributes extends Attributes {
  value?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FormSubmissionValueRelationships {
  form_submission?: Relationship;
  form_field?: Relationship;
}

/** Internal JSON:API resource shape; use FormSubmissionValueResource for the type returned by the client */
export interface FormSubmissionValueResourceObject
  extends ResourceObject<
    'FormSubmissionValue',
    FormSubmissionValueAttributes,
    FormSubmissionValueRelationships
  > { }

/** FormSubmissionValue resource as returned by the client */
export type FormSubmissionValueResource = FlattenedResource<'FormSubmissionValue', FormSubmissionValueAttributes, FormSubmissionValueRelationships>;

export type FormSubmissionValuesList = ListResponse<FormSubmissionValueResource>;
export type FormSubmissionValueSingle = FormSubmissionValueResource;

// ===== Report Resource =====

export interface ReportAttributes extends Attributes {
  name?: string;
  body?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReportRelationships {
  organization?: Relationship;
  created_by?: Relationship;
  updated_by?: Relationship;
}

/** Internal JSON:API resource shape; use ReportResource for the type returned by the client */
export interface ReportResourceObject
  extends ResourceObject<
    'Report',
    ReportAttributes,
    ReportRelationships
  > { }

/** Report resource as returned by the client */
export type ReportResource = FlattenedResource<'Report', ReportAttributes, ReportRelationships>;

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
