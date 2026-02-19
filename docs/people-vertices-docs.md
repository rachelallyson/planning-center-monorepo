# Planning Center People API – Vertex Reference

Generated from [developer.planning.center](https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices/).

---

## Person

*Vertex: `person`*

# Person

A person record represents a single member/user of the application. Each person has different permissions that determine how the user can use this app (if at all).

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/people
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/people)

## Example Object

```
{
  "type": "Person",
  "id": "1",
  "attributes": {
    "accounting_administrator": true,
    "anniversary": "2000-01-01",
    "avatar": "string",
    "birthdate": "2000-01-01",
    "can_create_forms": true,
    "can_email_lists": true,
    "child": true,
    "created_at": "2000-01-01T12:00:00Z",
    "demographic_avatar_url": "string",
    "directory_shared_info": {},
    "directory_status": "string",
    "first_name": "string",
    "gender": "string",
    "given_name": "string",
    "grade": 1,
    "graduation_year": 1,
    "inactivated_at": "2000-01-01T12:00:00Z",
    "last_name": "string",
    "login_identifier": "string",
    "medical_notes": "string",
    "membership": "string",
    "mfa_configured": true,
    "middle_name": "string",
    "name": "string",
    "nickname": "string",
    "passed_background_check": true,
    "people_permissions": "string",
    "remote_id": 1,
    "resource_permission_flags": {},
    "school_type": "string",
    "site_administrator": true,
    "status": "string",
    "stripe_customer_identifier": "string",
    "updated_at": "2000-01-01T12:00:00Z"
  },
  "relationships": {
    "primary_campus": {
      "data": {
        "type": "PrimaryCampus",
        "id": "1"
      }
    },
    "created_by": {
      "data": {
        "type": "Person",
        "id": "1"
      }
    }
  }
}
```

## Attributes

Name

Type

Description

Note

`accounting_administrator`

`boolean`

`anniversary`

`date`

`avatar`

`string`

File UUID (see [File Uploads](#file-uploads) section)

`birthdate`

`date`

`can_create_forms`

`boolean`

`can_email_lists`

`boolean`

`child`

`boolean`

`created_at`

`date_time`

`demographic_avatar_url`

`string`

`directory_shared_info`

`json`

Only available when requested with the `?fields` param

`directory_status`

`string`

`first_name`

`string`

`gender`

`string`

`given_name`

`string`

`grade`

`integer`

`graduation_year`

`integer`

`id`

`primary_key`

`inactivated_at`

`date_time`

Set to an ISO 8601 date or time to make the profile inactive. Set to "null" to reactivate the profile.

`last_name`

`string`

`login_identifier`

`string`

`medical_notes`

`string`

`membership`

`string`

`mfa_configured`

`boolean`

Only available when requested with the `?fields` param

Set to "true" or "false" to filter. Can only be viewed and queried by an Organization Administrator.

`middle_name`

`string`

`name`

`string`

`nickname`

`string`

`passed_background_check`

`boolean`

`people_permissions`

`string`

`remote_id`

`integer`

`resource_permission_flags`

`json`

`school_type`

`string`

`site_administrator`

`boolean`

`status`

`string`

Set to "inactive" to set "inactivated\_at" to the current time and make the profile inactive. Set to anything else to clear "inactivated\_at" and reactivate the profile.

`stripe_customer_identifier`

`string`

Only available when requested with the `?fields` param

`updated_at`

`date_time`

## Relationships

Name

Type

Association Type

Note

primary\_campus

PrimaryCampus

to\_one

created\_by

Person

to\_one

## URL Parameters

# Can Include

Parameter

Value

Description

Assignable

include

addresses

include associated addresses

create and update

include

emails

include associated emails

create and update

include

field\_data

include associated field\_data

include

households

include associated households

include

inactive\_reason

include associated inactive\_reason

create and update

include

marital\_status

include associated marital\_status

create and update

include

name\_prefix

include associated name\_prefix

create and update

include

name\_suffix

include associated name\_suffix

create and update

include

organization

include associated organization

include

person\_apps

include associated person\_apps

include

phone\_numbers

include associated phone\_numbers

create and update

include

platform\_notifications

include associated platform\_notifications

include

primary\_campus

include associated primary\_campus

create and update

include

school

include associated school

create and update

include

social\_profiles

include associated social\_profiles

create and update

# Order By

Parameter

Value

Type

Description

order

accounting\_administrator

string

prefix with a hyphen (-accounting\_administrator) to reverse the order

order

anniversary

string

prefix with a hyphen (-anniversary) to reverse the order

order

birthdate

string

prefix with a hyphen (-birthdate) to reverse the order

order

child

string

prefix with a hyphen (-child) to reverse the order

order

created\_at

string

prefix with a hyphen (-created\_at) to reverse the order

order

first\_name

string

prefix with a hyphen (-first\_name) to reverse the order

order

gender

string

prefix with a hyphen (-gender) to reverse the order

order

given\_name

string

prefix with a hyphen (-given\_name) to reverse the order

order

grade

string

prefix with a hyphen (-grade) to reverse the order

order

graduation\_year

string

prefix with a hyphen (-graduation\_year) to reverse the order

order

inactivated\_at

string

prefix with a hyphen (-inactivated\_at) to reverse the order

order

last\_name

string

prefix with a hyphen (-last\_name) to reverse the order

order

membership

string

prefix with a hyphen (-membership) to reverse the order

order

middle\_name

string

prefix with a hyphen (-middle\_name) to reverse the order

order

nickname

string

prefix with a hyphen (-nickname) to reverse the order

order

people\_permissions

string

prefix with a hyphen (-people\_permissions) to reverse the order

order

remote\_id

string

prefix with a hyphen (-remote\_id) to reverse the order

order

site\_administrator

string

prefix with a hyphen (-site\_administrator) to reverse the order

order

status

string

prefix with a hyphen (-status) to reverse the order

order

updated\_at

string

prefix with a hyphen (-updated\_at) to reverse the order

# Query By

Name

Parameter

Type

Description

Example

accounting\_administrator

where\[accounting\_administrator\]

boolean

Query on a specific accounting\_administrator

`?where[accounting_administrator]=true`

anniversary

where\[anniversary\]

date

Query on a specific anniversary

`?where[anniversary]=2000-01-01`[](#/overview/dates-times)

birthdate

where\[birthdate\]

date

Query on a specific birthdate

`?where[birthdate]=2000-01-01`[](#/overview/dates-times)

child

where\[child\]

boolean

Query on a specific child

`?where[child]=true`

created\_at

where\[created\_at\]

date\_time

Query on a specific created\_at

`?where[created_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

first\_name

where\[first\_name\]

string

Query on a specific first\_name

`?where[first_name]=string`

gender

where\[gender\]

string

Query on a specific gender

`?where[gender]=string`

given\_name

where\[given\_name\]

string

Query on a specific given\_name

`?where[given_name]=string`

grade

where\[grade\]

integer

Query on a specific grade

`?where[grade]=1`

graduation\_year

where\[graduation\_year\]

integer

Query on a specific graduation\_year

`?where[graduation_year]=1`

id

where\[id\]

primary\_key

Query on a specific id

`?where[id]=primary_key`

inactivated\_at

where\[inactivated\_at\]

date\_time

Set to an ISO 8601 date or time to make the profile inactive. Set to "null" to reactivate the profile.

`?where[inactivated_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

last\_name

where\[last\_name\]

string

Query on a specific last\_name

`?where[last_name]=string`

medical\_notes

where\[medical\_notes\]

string

Query on a specific medical\_notes

`?where[medical_notes]=string`

membership

where\[membership\]

string

Query on a specific membership

`?where[membership]=string`

mfa\_configured

where\[mfa\_configured\]

boolean

Set to "true" or "false" to filter. Can only be viewed and queried by an Organization Administrator.

`?where[mfa_configured]=true`

middle\_name

where\[middle\_name\]

string

Query on a specific middle\_name

`?where[middle_name]=string`

nickname

where\[nickname\]

string

Query on a specific nickname

`?where[nickname]=string`

people\_permissions

where\[people\_permissions\]

string

Query on a specific people\_permissions

`?where[people_permissions]=string`

primary\_campus\_id

where\[primary\_campus\_id\]

integer

Query on a related primary\_campus

`?where[primary_campus_id]=1`

remote\_id

where\[remote\_id\]

integer

Query on a specific remote\_id

`?where[remote_id]=1`

search\_name

where\[search\_name\]

string

Query on a specific search\_name

`?where[search_name]=string`

search\_name\_or\_email

where\[search\_name\_or\_email\]

string

Query on a specific search\_name\_or\_email

`?where[search_name_or_email]=string`

search\_name\_or\_email\_or\_phone\_number

where\[search\_name\_or\_email\_or\_phone\_number\]

string

Query on a specific search\_name\_or\_email\_or\_phone\_number

`?where[search_name_or_email_or_phone_number]=string`

search\_phone\_number

where\[search\_phone\_number\]

string

Query on a specific search\_phone\_number

`?where[search_phone_number]=string`

search\_phone\_number\_e164

where\[search\_phone\_number\_e164\]

string

Query on a specific search\_phone\_number\_e164

`?where[search_phone_number_e164]=string`

site\_administrator

where\[site\_administrator\]

boolean

Query on a specific site\_administrator

`?where[site_administrator]=true`

status

where\[status\]

string

Set to "inactive" to set "inactivated\_at" to the current time and make the profile inactive. Set to anything else to clear "inactivated\_at" and reactivate the profile.

`?where[status]=string`

updated\_at

where\[updated\_at\]

date\_time

Query on a specific updated\_at

`?where[updated_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/people`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/people/{id}`

Copy

# Creating

HTTP Method

Endpoint

Assignable Attributes

POST

`/people/v2/people`

Copy

*   accounting\_administrator
*   anniversary
*   birthdate
*   child
*   given\_name
*   grade
*   graduation\_year
*   middle\_name
*   nickname
*   people\_permissions
*   site\_administrator
*   gender
*   inactivated\_at
*   medical\_notes
*   membership
*   stripe\_customer\_identifier
*   created\_by\_id
*   avatar
*   first\_name
*   last\_name
*   primary\_campus\_id
*   remote\_id
*   status

# Updating

HTTP Method

Endpoint

Assignable Attributes

PATCH

`/people/v2/people/{id}`

Copy

*   accounting\_administrator
*   anniversary
*   birthdate
*   child
*   given\_name
*   grade
*   graduation\_year
*   middle\_name
*   nickname
*   people\_permissions
*   site\_administrator
*   gender
*   inactivated\_at
*   medical\_notes
*   membership
*   stripe\_customer\_identifier
*   avatar
*   first\_name
*   last\_name
*   primary\_campus\_id
*   remote\_id
*   status

# Deleting

HTTP Method

Endpoint

DELETE

`/people/v2/people/{id}`

Copy

## Associations

# addresses

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/addresses`

Copy

[Address](#/apps/people/2025-11-10/vertices/address)

# apps

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/apps`

Copy

[App](#/apps/people/2025-11-10/vertices/app)

# background\_checks

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/background_checks`

Copy

[BackgroundCheck](#/apps/people/2025-11-10/vertices/background_check)

# connected\_people

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/connected_people`

Copy

[ConnectedPerson](#/apps/people/2025-11-10/vertices/connected_person)

# emails

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/emails`

Copy

[Email](#/apps/people/2025-11-10/vertices/email)

# field\_data

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/field_data`

Copy

[FieldDatum](#/apps/people/2025-11-10/vertices/field_datum)

# household\_memberships

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/household_memberships`

Copy

[HouseholdMembership](#/apps/people/2025-11-10/vertices/household_membership)

# households

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/households`

Copy

[Household](#/apps/people/2025-11-10/vertices/household)

# inactive\_reason

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/inactive_reason`

Copy

[InactiveReason](#/apps/people/2025-11-10/vertices/inactive_reason)

# marital\_status

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/marital_status`

Copy

[MaritalStatus](#/apps/people/2025-11-10/vertices/marital_status)

# message\_groups

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/message_groups`

Copy

[MessageGroup](#/apps/people/2025-11-10/vertices/message_group)

# messages

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/messages`

Copy

[Message](#/apps/people/2025-11-10/vertices/message)

The Person's received messages. Can also receive a filter to return `sent` or `unread` e.g. `?filter=sent`

*   `created_after`
    
*   `received`
    
*   `sent`
    
*   `unread`
    

# name\_prefix

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/name_prefix`

Copy

[NamePrefix](#/apps/people/2025-11-10/vertices/name_prefix)

# name\_suffix

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/name_suffix`

Copy

[NameSuffix](#/apps/people/2025-11-10/vertices/name_suffix)

# notes

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/notes`

Copy

[Note](#/apps/people/2025-11-10/vertices/note)

# organization

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/organization`

Copy

[Organization](#/apps/people/2025-11-10/vertices/organization)

# person\_apps

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/person_apps`

Copy

[PersonApp](#/apps/people/2025-11-10/vertices/person_app)

# phone\_numbers

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/phone_numbers`

Copy

[PhoneNumber](#/apps/people/2025-11-10/vertices/phone_number)

# platform\_notifications

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/platform_notifications`

Copy

[PlatformNotification](#/apps/people/2025-11-10/vertices/platform_notification)

# primary\_campus

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/primary_campus`

Copy

[Campus](#/apps/people/2025-11-10/vertices/campus)

# school

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/school`

Copy

[SchoolOption](#/apps/people/2025-11-10/vertices/school_option)

# social\_profiles

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/social_profiles`

Copy

[SocialProfile](#/apps/people/2025-11-10/vertices/social_profile)

# workflow\_cards

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/workflow_cards`

Copy

[WorkflowCard](#/apps/people/2025-11-10/vertices/workflow_card)

*   `assigned`
    

# workflow\_shares

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/workflow_shares`

Copy

[WorkflowShare](#/apps/people/2025-11-10/vertices/workflow_share)

## Belongs To

# BackgroundCheck

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/background_checks/{background_check_id}/person`

Copy

[BackgroundCheck](#/apps/people/2025-11-10/vertices/background_check)

# Condition

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/lists/{list_id}/rules/{rule_id}/conditions/{condition_id}/created_by`

Copy

[Condition](#/apps/people/2025-11-10/vertices/condition)

# Email

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/emails/{email_id}/person`

Copy

[Email](#/apps/people/2025-11-10/vertices/email)

# FieldDatum

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/field_data/{field_datum_id}/person`

Copy

[FieldDatum](#/apps/people/2025-11-10/vertices/field_datum)

# FormSubmission

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/forms/{form_id}/form_submissions/{form_submission_id}/person`

Copy

[FormSubmission](#/apps/people/2025-11-10/vertices/form_submission)

# HouseholdMembership

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/households/{household_id}/household_memberships/{household_membership_id}/person`

Copy

[HouseholdMembership](#/apps/people/2025-11-10/vertices/household_membership)

# Household

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/households/{household_id}/people`

Copy

[Household](#/apps/people/2025-11-10/vertices/household)

*   `non_pending`
    
*   `without_deceased`
    

# List

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/lists/{list_id}/created_by`

Copy

[List](#/apps/people/2025-11-10/vertices/list)

# List

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/lists/{list_id}/people`

Copy

[List](#/apps/people/2025-11-10/vertices/list)

# ListShare

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/lists/{list_id}/shares/{list_share_id}/person`

Copy

[ListShare](#/apps/people/2025-11-10/vertices/list_share)

# List

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/lists/{list_id}/updated_by`

Copy

[List](#/apps/people/2025-11-10/vertices/list)

# MessageGroup

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/message_groups/{message_group_id}/from`

Copy

[MessageGroup](#/apps/people/2025-11-10/vertices/message_group)

# Message

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/messages/{message_id}/to`

Copy

[Message](#/apps/people/2025-11-10/vertices/message)

# NoteCategoryShare

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/note_categories/{note_category_id}/shares/{note_category_share_id}/person`

Copy

[NoteCategoryShare](#/apps/people/2025-11-10/vertices/note_category_share)

# NoteCategory

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/note_categories/{note_category_id}/subscribers`

Copy

[NoteCategory](#/apps/people/2025-11-10/vertices/note_category)

# NoteCategorySubscription

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/note_category_subscriptions/{note_category_subscription_id}/person`

Copy

[NoteCategorySubscription](#/apps/people/2025-11-10/vertices/note_category_subscription)

# Note

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/notes/{note_id}/created_by`

Copy

[Note](#/apps/people/2025-11-10/vertices/note)

# Note

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/notes/{note_id}/person`

Copy

[Note](#/apps/people/2025-11-10/vertices/note)

# Organization

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/people`

Copy

[Organization](#/apps/people/2025-11-10/vertices/organization)

*   `admins`
    
*   `created_since` — filter people created in the last 24 hours; pass an additional `time` parameter in ISO 8601 format to specify your own timeframe
    
*   `organization_admins`
    

# PeopleImportHistory

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/people_imports/{people_import_id}/histories/{people_import_history_id}/person`

Copy

[PeopleImportHistory](#/apps/people/2025-11-10/vertices/people_import_history)

# Report

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/reports/{report_id}/created_by`

Copy

[Report](#/apps/people/2025-11-10/vertices/report)

# Report

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/reports/{report_id}/updated_by`

Copy

[Report](#/apps/people/2025-11-10/vertices/report)

# SocialProfile

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/social_profiles/{social_profile_id}/person`

Copy

[SocialProfile](#/apps/people/2025-11-10/vertices/social_profile)

# WorkflowCard

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/people/{person_id}/workflow_cards/{workflow_card_id}/assignee`

Copy

[WorkflowCard](#/apps/people/2025-11-10/vertices/workflow_card)

# WorkflowCard

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/people/{person_id}/workflow_cards/{workflow_card_id}/person`

Copy

[WorkflowCard](#/apps/people/2025-11-10/vertices/workflow_card)

# WorkflowShare

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/people/{person_id}/workflow_shares/{workflow_share_id}/person`

Copy

[WorkflowShare](#/apps/people/2025-11-10/vertices/workflow_share)

# Workflow

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/workflows/{workflow_id}/shared_people`

Copy

[Workflow](#/apps/people/2025-11-10/vertices/workflow)

# WorkflowStepAssigneeSummary

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/workflows/{workflow_id}/steps/{step_id}/assignee_summaries/{workflow_step_assignee_summary_id}/person`

Copy

[WorkflowStepAssigneeSummary](#/apps/people/2025-11-10/vertices/workflow_step_assignee_summary)

# WorkflowStep

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/workflows/{workflow_id}/steps/{workflow_step_id}/default_assignee`

Copy

[WorkflowStep](#/apps/people/2025-11-10/vertices/workflow_step)

---

## Household

*Vertex: `household`*

# Household

A household links people together and can have a primary contact. To add a person to an existing household, use the HouseholdMemberships endpoint.

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/households
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/households)

## Example Object

```
{
  "type": "Household",
  "id": "1",
  "attributes": {
    "avatar": "string",
    "created_at": "2000-01-01T12:00:00Z",
    "member_count": 1,
    "name": "string",
    "primary_contact_id": "primary_key",
    "primary_contact_name": "string",
    "updated_at": "2000-01-01T12:00:00Z"
  },
  "relationships": {
    "primary_contact": {
      "data": {
        "type": "Person",
        "id": "1"
      }
    },
    "people": {
      "data": [
        {
          "type": "Person",
          "id": "1"
        }
      ]
    }
  }
}
```

## Attributes

Name

Type

Description

Note

`avatar`

`string`

File UUID (see [File Uploads](#file-uploads) section)

`created_at`

`date_time`

`id`

`primary_key`

`member_count`

`integer`

`name`

`string`

`primary_contact_id`

`primary_key`

`primary_contact_name`

`string`

`updated_at`

`date_time`

## Relationships

Name

Type

Association Type

Note

primary\_contact

Person

to\_one

people

Person

to\_many

## URL Parameters

# Can Include

Parameter

Value

Description

Assignable

include

people

include associated people

create and update

# Order By

Parameter

Value

Type

Description

order

created\_at

string

prefix with a hyphen (-created\_at) to reverse the order

order

member\_count

string

prefix with a hyphen (-member\_count) to reverse the order

order

name

string

prefix with a hyphen (-name) to reverse the order

order

primary\_contact\_name

string

prefix with a hyphen (-primary\_contact\_name) to reverse the order

order

updated\_at

string

prefix with a hyphen (-updated\_at) to reverse the order

# Query By

Name

Parameter

Type

Description

Example

created\_at

where\[created\_at\]

date\_time

Query on a specific created\_at

`?where[created_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

member\_count

where\[member\_count\]

integer

Query on a specific member\_count

`?where[member_count]=1`

name

where\[name\]

string

Query on a specific name

`?where[name]=string`

primary\_contact\_name

where\[primary\_contact\_name\]

string

Query on a specific primary\_contact\_name

`?where[primary_contact_name]=string`

updated\_at

where\[updated\_at\]

date\_time

Query on a specific updated\_at

`?where[updated_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/households`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/households/{id}`

Copy

# Creating

HTTP Method

Endpoint

Assignable Attributes

POST

`/people/v2/households`

Copy

*   name
*   member\_count
*   avatar
*   primary\_contact\_id

Notes:

To create a new household, you must specify the primary contact and the people as relationships: `{"data":{"attributes":{"name":"Smith"},"relationships":{"people":{"data":[{"type":"Person","id":"1"},{"type":"Person","id":"2"}]},"primary_contact":{"data":{"type":"Person","id":"1"}}}}}`

# Updating

HTTP Method

Endpoint

Assignable Attributes

PATCH

`/people/v2/households/{id}`

Copy

*   name
*   member\_count
*   avatar
*   primary\_contact\_id

# Deleting

HTTP Method

Endpoint

DELETE

`/people/v2/households/{id}`

Copy

## Associations

# household\_memberships

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/households/{household_id}/household_memberships`

Copy

[HouseholdMembership](#/apps/people/2025-11-10/vertices/household_membership)

# people

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/households/{household_id}/people`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

*   `non_pending`
    
*   `without_deceased`
    

## Belongs To

# HouseholdMembership

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/households/{household_id}/household_memberships/{household_membership_id}/household`

Copy

[HouseholdMembership](#/apps/people/2025-11-10/vertices/household_membership)

# Organization

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/households`

Copy

[Organization](#/apps/people/2025-11-10/vertices/organization)

# PeopleImportHistory

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/people_imports/{people_import_id}/histories/{people_import_history_id}/household`

Copy

[PeopleImportHistory](#/apps/people/2025-11-10/vertices/people_import_history)

# Person

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/people/{person_id}/households`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

---

## Campus

*Vertex: `campus`*

# Campus

A Campus is a location belonging to an Organization

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/campuses
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/campuses)

## Example Object

```
{
  "type": "Campus",
  "id": "1",
  "attributes": {
    "avatar_url": "string",
    "church_center_enabled": true,
    "city": "string",
    "contact_email_address": "string",
    "country": "string",
    "created_at": "2000-01-01T12:00:00Z",
    "date_format": 1,
    "description": "string",
    "geolocation_set_manually": true,
    "latitude": 1.42,
    "longitude": 1.42,
    "name": "string",
    "phone_number": "string",
    "state": "string",
    "street": "string",
    "time_zone": "string",
    "time_zone_raw": "string",
    "twenty_four_hour_time": true,
    "updated_at": "2000-01-01T12:00:00Z",
    "website": "string",
    "zip": "string"
  },
  "relationships": {
    "organization": {
      "data": {
        "type": "Organization",
        "id": "1"
      }
    }
  }
}
```

## Attributes

Name

Type

Description

`avatar_url`

`string`

`church_center_enabled`

`boolean`

`city`

`string`

`contact_email_address`

`string`

`country`

`string`

`created_at`

`date_time`

`date_format`

`integer`

`description`

`string`

`geolocation_set_manually`

`boolean`

`id`

`primary_key`

`latitude`

`float`

`longitude`

`float`

`name`

`string`

`phone_number`

`string`

`state`

`string`

`street`

`string`

`time_zone`

`string`

`time_zone_raw`

`string`

Only available when requested with the `?fields` param

`twenty_four_hour_time`

`boolean`

`updated_at`

`date_time`

`website`

`string`

`zip`

`string`

## Relationships

Name

Type

Association Type

Note

organization

Organization

to\_one

## URL Parameters

# Can Include

Parameter

Value

Description

Assignable

include

lists

include associated lists

include

service\_times

include associated service\_times

create and update

# Order By

Parameter

Value

Type

Description

order

created\_at

string

prefix with a hyphen (-created\_at) to reverse the order

order

name

string

prefix with a hyphen (-name) to reverse the order

order

updated\_at

string

prefix with a hyphen (-updated\_at) to reverse the order

# Query By

Name

Parameter

Type

Description

Example

created\_at

where\[created\_at\]

date\_time

Query on a specific created\_at

`?where[created_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

id

where\[id\]

primary\_key

Query on a specific id

`?where[id]=primary_key`

updated\_at

where\[updated\_at\]

date\_time

Query on a specific updated\_at

`?where[updated_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/campuses`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/campuses/{id}`

Copy

# Creating

HTTP Method

Endpoint

Assignable Attributes

POST

`/people/v2/campuses`

Copy

*   latitude
*   longitude
*   description
*   street
*   city
*   state
*   zip
*   country
*   phone\_number
*   website
*   twenty\_four\_hour\_time
*   date\_format
*   church\_center\_enabled
*   contact\_email\_address
*   time\_zone
*   geolocation\_set\_manually
*   name

Notes:

Must be an Organization Administrator

# Updating

HTTP Method

Endpoint

Assignable Attributes

PATCH

`/people/v2/campuses/{id}`

Copy

*   latitude
*   longitude
*   description
*   street
*   city
*   state
*   zip
*   country
*   phone\_number
*   website
*   twenty\_four\_hour\_time
*   date\_format
*   church\_center\_enabled
*   contact\_email\_address
*   time\_zone
*   geolocation\_set\_manually
*   name

Notes:

Must be an Organization Administrator

# Deleting

HTTP Method

Endpoint

DELETE

`/people/v2/campuses/{id}`

Copy

Notes:

Must be an Organization Administrator

## Associations

# lists

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/campuses/{campus_id}/lists`

Copy

[List](#/apps/people/2025-11-10/vertices/list)

# service\_times

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/campuses/{campus_id}/service_times`

Copy

[ServiceTime](#/apps/people/2025-11-10/vertices/service_time)

## Belongs To

# Form

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/forms/{form_id}/campus`

Copy

[Form](#/apps/people/2025-11-10/vertices/form)

# List

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/lists/{list_id}/campus`

Copy

[List](#/apps/people/2025-11-10/vertices/list)

# Organization

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/campuses`

Copy

[Organization](#/apps/people/2025-11-10/vertices/organization)

# Person

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/people/{person_id}/primary_campus`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

---

## Field Definition

*Vertex: `field_definition`*

# FieldDefinition

A field definition represents a custom field -- its name, data type, etc.

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/field_definitions
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/field_definitions)

## Example Object

```
{
  "type": "FieldDefinition",
  "id": "1",
  "attributes": {
    "config": "string",
    "data_type": "string",
    "deleted_at": "2000-01-01T12:00:00Z",
    "name": "string",
    "sequence": 1,
    "slug": "string",
    "tab_id": "primary_key"
  },
  "relationships": {
    "tab": {
      "data": {
        "type": "Tab",
        "id": "1"
      }
    }
  }
}
```

## Attributes

Name

Type

Description

`config`

`string`

`data_type`

`string`

`deleted_at`

`date_time`

`id`

`primary_key`

`name`

`string`

`sequence`

`integer`

`slug`

`string`

`tab_id`

`primary_key`

## Relationships

Name

Type

Association Type

Note

tab

Tab

to\_one

## URL Parameters

# Can Include

Parameter

Value

Description

Assignable

include

field\_options

include associated field\_options

include

tab

include associated tab

create and update

# Order By

Parameter

Value

Type

Description

order

config

string

prefix with a hyphen (-config) to reverse the order

order

data\_type

string

prefix with a hyphen (-data\_type) to reverse the order

order

deleted\_at

string

prefix with a hyphen (-deleted\_at) to reverse the order

order

name

string

prefix with a hyphen (-name) to reverse the order

order

sequence

string

prefix with a hyphen (-sequence) to reverse the order

order

slug

string

prefix with a hyphen (-slug) to reverse the order

order

tab\_id

string

prefix with a hyphen (-tab\_id) to reverse the order

# Query By

Name

Parameter

Type

Description

Example

config

where\[config\]

string

Query on a specific config

`?where[config]=string`

data\_type

where\[data\_type\]

string

Query on a specific data\_type

`?where[data_type]=string`

deleted\_at

where\[deleted\_at\]

date\_time

Query on a specific deleted\_at

`?where[deleted_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

name

where\[name\]

string

Query on a specific name

`?where[name]=string`

sequence

where\[sequence\]

integer

Query on a specific sequence

`?where[sequence]=1`

slug

where\[slug\]

string

Query on a specific slug

`?where[slug]=string`

tab\_id

where\[tab\_id\]

primary\_key

Query on a specific tab\_id

`?where[tab_id]=primary_key`

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/field_definitions`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/field_definitions/{id}`

Copy

# Creating

HTTP Method

Endpoint

Assignable Attributes

POST

`/people/v2/tabs/{tab_id}/field_definitions`

Copy

*   data\_type
*   name
*   sequence
*   slug
*   config
*   deleted\_at

Notes:

If you want to create a `number` type field, and you want to set a minimum or maximum value, you can pass a hash into the `config` attribute with the `min` and/or `max` keys:

```
```
"data": {
    "attributes": {
      "data_type": "number",
      "name": "My Number Field",
      "config": {
        "min": "0",
        "max": "100"
      }
    }
  }
```
```

This example will create a number field that requires its value to be between 0 and 100.

# Updating

HTTP Method

Endpoint

Assignable Attributes

PATCH

`/people/v2/field_definitions/{id}`

Copy

*   data\_type
*   name
*   sequence
*   slug
*   config
*   deleted\_at

Notes:

Similarly to creating a `number` type field definition, you can update the `config` object of a `number` field definition to set a minimum or maximum value.

```
```
"data": {
    "attributes": {
      "config": {
        "min": "0",
        "max": "100"
      }
    }
  }
```
```

This will update the field definition to require its value to be between 0 and 100.

# Deleting

HTTP Method

Endpoint

DELETE

`/people/v2/field_definitions/{id}`

Copy

Notes:

Deleting a field definition internally sets its `deleted_at` attribute to the current time.

## Associations

# field\_options

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/field_definitions/{field_definition_id}/field_options`

Copy

[FieldOption](#/apps/people/2025-11-10/vertices/field_option)

# tab

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/field_definitions/{field_definition_id}/tab`

Copy

[Tab](#/apps/people/2025-11-10/vertices/tab)

## Belongs To

# FieldDatum

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/field_data/{field_datum_id}/field_definition`

Copy

[FieldDatum](#/apps/people/2025-11-10/vertices/field_datum)

# Organization

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/field_definitions`

Copy

[Organization](#/apps/people/2025-11-10/vertices/organization)

*   `include_deleted` — By default, deleted fields are not included. Pass filter=include\_deleted to include them.
    

# Tab

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/tabs/{tab_id}/field_definitions`

Copy

[Tab](#/apps/people/2025-11-10/vertices/tab)

*   `with_deleted`

---

## Workflow

*Vertex: `workflow`*

# Workflow

A Workflow

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/workflows
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/workflows)

## Example Object

```
{
  "type": "Workflow",
  "id": "1",
  "attributes": {
    "archived_at": "2000-01-01T12:00:00Z",
    "campus_id": "primary_key",
    "completed_card_count": 1,
    "created_at": "2000-01-01T12:00:00Z",
    "deleted_at": "2000-01-01T12:00:00Z",
    "my_due_soon_card_count": 1,
    "my_overdue_card_count": 1,
    "my_ready_card_count": 1,
    "name": "string",
    "recently_viewed": true,
    "total_cards_count": 1,
    "total_overdue_card_count": 1,
    "total_ready_and_snoozed_card_count": 1,
    "total_ready_card_count": 1,
    "total_steps_count": 1,
    "total_unassigned_card_count": 1,
    "total_unassigned_steps_count": 1,
    "updated_at": "2000-01-01T12:00:00Z",
    "workflow_category_id": "primary_key"
  },
  "relationships": {
    "workflow_category": {
      "data": {
        "type": "WorkflowCategory",
        "id": "1"
      }
    },
    "campus": {
      "data": {
        "type": "Campus",
        "id": "1"
      }
    }
  }
}
```

## Attributes

Name

Type

Description

`archived_at`

`date_time`

`campus_id`

`primary_key`

`completed_card_count`

`integer`

`created_at`

`date_time`

`deleted_at`

`date_time`

`id`

`primary_key`

`my_due_soon_card_count`

`integer`

Only available when requested with the `?fields` param

`my_overdue_card_count`

`integer`

Only available when requested with the `?fields` param

`my_ready_card_count`

`integer`

`name`

`string`

`recently_viewed`

`boolean`

`total_cards_count`

`integer`

`total_overdue_card_count`

`integer`

`total_ready_and_snoozed_card_count`

`integer`

`total_ready_card_count`

`integer`

`total_steps_count`

`integer`

`total_unassigned_card_count`

`integer`

`total_unassigned_steps_count`

`integer`

`updated_at`

`date_time`

`workflow_category_id`

`primary_key`

## Relationships

Name

Type

Association Type

Note

workflow\_category

WorkflowCategory

to\_one

campus

Campus

to\_one

## URL Parameters

# Can Include

Parameter

Value

Description

Assignable

include

category

include associated category

include

shares

include associated shares

include

steps

include associated steps

# Order By

Parameter

Value

Type

Description

order

archived\_at

string

prefix with a hyphen (-archived\_at) to reverse the order

order

campus\_id

string

prefix with a hyphen (-campus\_id) to reverse the order

order

created\_at

string

prefix with a hyphen (-created\_at) to reverse the order

order

deleted\_at

string

prefix with a hyphen (-deleted\_at) to reverse the order

order

name

string

prefix with a hyphen (-name) to reverse the order

order

updated\_at

string

prefix with a hyphen (-updated\_at) to reverse the order

order

workflow\_category\_id

string

prefix with a hyphen (-workflow\_category\_id) to reverse the order

# Query By

Name

Parameter

Type

Description

Example

archived\_at

where\[archived\_at\]

date\_time

Query on a specific archived\_at

`?where[archived_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

campus\_id

where\[campus\_id\]

primary\_key

Query on a specific campus\_id

`?where[campus_id]=primary_key`

created\_at

where\[created\_at\]

date\_time

Query on a specific created\_at

`?where[created_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

deleted\_at

where\[deleted\_at\]

date\_time

Query on a specific deleted\_at

`?where[deleted_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

id

where\[id\]

primary\_key

Query on a specific id

`?where[id]=primary_key`

name

where\[name\]

string

Query on a specific name

`?where[name]=string`

updated\_at

where\[updated\_at\]

date\_time

Query on a specific updated\_at

`?where[updated_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

workflow\_category\_id

where\[workflow\_category\_id\]

primary\_key

Query on a specific workflow\_category\_id

`?where[workflow_category_id]=primary_key`

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/workflows`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/workflows/{id}`

Copy

# Creating

HTTP Method

Endpoint

Assignable Attributes

POST

`/people/v2/workflows`

Copy

*   name
*   campus\_id
*   workflow\_category\_id

# Updating

HTTP Method

Endpoint

Assignable Attributes

PATCH

`/people/v2/workflows/{id}`

Copy

*   name
*   campus\_id
*   workflow\_category\_id

# Deleting

HTTP Method

Endpoint

DELETE

`/people/v2/workflows/{id}`

Copy

## Associations

# cards

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/workflows/{workflow_id}/cards`

Copy

[WorkflowCard](#/apps/people/2025-11-10/vertices/workflow_card)

# category

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/workflows/{workflow_id}/category`

Copy

[WorkflowCategory](#/apps/people/2025-11-10/vertices/workflow_category)

# shared\_people

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/workflows/{workflow_id}/shared_people`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

# shares

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/workflows/{workflow_id}/shares`

Copy

[WorkflowShare](#/apps/people/2025-11-10/vertices/workflow_share)

# steps

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/workflows/{workflow_id}/steps`

Copy

[WorkflowStep](#/apps/people/2025-11-10/vertices/workflow_step)

## Belongs To

# Organization

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/workflows`

Copy

[Organization](#/apps/people/2025-11-10/vertices/organization)

*   `archived`
    
*   `has_my_cards`
    
*   `manage_cards_allowed`
    
*   `not_archived`
    
*   `only_deleted`
    
*   `recently_viewed`
    
*   `unassigned`
    
*   `with_deleted`
    
*   `with_recoverable`
    
*   `with_steps`
    

# WorkflowCard

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/people/{person_id}/workflow_cards/{workflow_card_id}/workflow`

Copy

[WorkflowCard](#/apps/people/2025-11-10/vertices/workflow_card)

---

## Note

*Vertex: `note`*

# Note

A note is text with a category connected to a person’s profile.

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/notes
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/notes)

## Example Object

```
{
  "type": "Note",
  "id": "1",
  "attributes": {
    "created_at": "2000-01-01T12:00:00Z",
    "created_by_id": "primary_key",
    "display_date": "2000-01-01T12:00:00Z",
    "note": "string",
    "note_category_id": "primary_key",
    "organization_id": "primary_key",
    "person_id": "primary_key",
    "updated_at": "2000-01-01T12:00:00Z"
  },
  "relationships": {
    "note_category": {
      "data": {
        "type": "NoteCategory",
        "id": "1"
      }
    },
    "organization": {
      "data": {
        "type": "Organization",
        "id": "1"
      }
    },
    "person": {
      "data": {
        "type": "Person",
        "id": "1"
      }
    },
    "created_by": {
      "data": {
        "type": "Person",
        "id": "1"
      }
    }
  }
}
```

## Attributes

Name

Type

Description

`created_at`

`date_time`

`created_by_id`

`primary_key`

`display_date`

`date_time`

`id`

`primary_key`

`note`

`string`

`note_category_id`

`primary_key`

`organization_id`

`primary_key`

`person_id`

`primary_key`

`updated_at`

`date_time`

## Relationships

Name

Type

Association Type

Note

note\_category

NoteCategory

to\_one

organization

Organization

to\_one

person

Person

to\_one

created\_by

Person

to\_one

## URL Parameters

# Can Include

Parameter

Value

Description

Assignable

include

category

include associated category

include

created\_by

include associated created\_by

create and update

include

person

include associated person

create and update

# Order By

Parameter

Value

Type

Description

order

created\_at

string

prefix with a hyphen (-created\_at) to reverse the order

order

display\_date

string

prefix with a hyphen (-display\_date) to reverse the order

order

id

string

prefix with a hyphen (-id) to reverse the order

order

note

string

prefix with a hyphen (-note) to reverse the order

order

note\_category\_id

string

prefix with a hyphen (-note\_category\_id) to reverse the order

order

updated\_at

string

prefix with a hyphen (-updated\_at) to reverse the order

# Query By

Name

Parameter

Type

Description

Example

note

where\[note\]

string

Query on a specific note

`?where[note]=string`

note\_category\_id

where\[note\_category\_id\]

primary\_key

Query on a specific note\_category\_id

`?where[note_category_id]=primary_key`

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/notes`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/notes/{id}`

Copy

# Creating

HTTP Method

Endpoint

Assignable Attributes

POST

`/people/v2/people/{person_id}/notes`

Copy

*   note
*   created\_at
*   updated\_at
*   display\_date
*   note\_category\_id

# Updating

HTTP Method

Endpoint

Assignable Attributes

PATCH

`/people/v2/notes/{id}`

Copy

*   note
*   created\_at
*   updated\_at
*   display\_date
*   note\_category\_id

# Deleting

HTTP Method

Endpoint

DELETE

`/people/v2/notes/{id}`

Copy

## Associations

# category

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/notes/{note_id}/category`

Copy

[NoteCategory](#/apps/people/2025-11-10/vertices/note_category)

# created\_by

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/notes/{note_id}/created_by`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

# person

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/notes/{note_id}/person`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

## Belongs To

# Organization

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/notes`

Copy

[Organization](#/apps/people/2025-11-10/vertices/organization)

# Person

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/people/{person_id}/notes`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

---

## List

*Vertex: `list`*

# List

A list is a powerful tool for finding and grouping people together using any criteria imaginable.

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/lists
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/lists)

## Example Object

```
{
  "type": "List",
  "id": "1",
  "attributes": {
    "auto_generated_name": true,
    "auto_refresh": true,
    "auto_refresh_frequency": "string",
    "automations_active": true,
    "automations_count": 1,
    "batch_completed_at": "2000-01-01T12:00:00Z",
    "created_at": "2000-01-01T12:00:00Z",
    "description": "string",
    "has_inactive_results": true,
    "include_inactive": true,
    "invalid": true,
    "name": "string",
    "name_or_description": "string",
    "paused_automations_count": 1,
    "recently_viewed": true,
    "refreshed_at": "2000-01-01T12:00:00Z",
    "return_original_if_none": true,
    "returns": "string",
    "starred": true,
    "status": "string",
    "subset": "string",
    "total_people": 1,
    "updated_at": "2000-01-01T12:00:00Z"
  },
  "relationships": {}
}
```

## Attributes

Name

Type

Description

`auto_generated_name`

`boolean`

`auto_refresh`

`boolean`

`auto_refresh_frequency`

`string`

`automations_active`

`boolean`

`automations_count`

`integer`

`batch_completed_at`

`date_time`

`created_at`

`date_time`

`description`

`string`

`has_inactive_results`

`boolean`

`id`

`primary_key`

`include_inactive`

`boolean`

`invalid`

`boolean`

`name`

`string`

`name_or_description`

`string`

`paused_automations_count`

`integer`

`recently_viewed`

`boolean`

`refreshed_at`

`date_time`

`return_original_if_none`

`boolean`

`returns`

`string`

`starred`

`boolean`

`status`

`string`

`subset`

`string`

`total_people`

`integer`

`updated_at`

`date_time`

## URL Parameters

# Can Include

Parameter

Value

Description

Assignable

include

campus

include associated campus

create and update

include

category

include associated category

include

created\_by

include associated created\_by

include

mailchimp\_sync\_status

include associated mailchimp\_sync\_status

include

people

include associated people

include

rules

include associated rules

include

shares

include associated shares

include

updated\_by

include associated updated\_by

# Order By

Parameter

Value

Type

Description

order

batch\_completed\_at

string

prefix with a hyphen (-batch\_completed\_at) to reverse the order

order

campus\_id

string

prefix with a hyphen (-campus\_id) to reverse the order

order

created\_at

string

prefix with a hyphen (-created\_at) to reverse the order

order

list\_categories.name

string

prefix with a hyphen (-list\_categories.name) to reverse the order

order

list\_category\_id

string

prefix with a hyphen (-list\_category\_id) to reverse the order

order

name

string

prefix with a hyphen (-name) to reverse the order

order

name\_or\_description

string

prefix with a hyphen (-name\_or\_description) to reverse the order

order

updated\_at

string

prefix with a hyphen (-updated\_at) to reverse the order

# Query By

Name

Parameter

Type

Description

Example

batch\_completed\_at

where\[batch\_completed\_at\]

date\_time

Query on a specific batch\_completed\_at

`?where[batch_completed_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

created\_at

where\[created\_at\]

date\_time

Query on a specific created\_at

`?where[created_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

id

where\[id\]

primary\_key

Query on a specific id

`?where[id]=primary_key`

name

where\[name\]

string

Query on a specific name

`?where[name]=string`

updated\_at

where\[updated\_at\]

date\_time

Query on a specific updated\_at

`?where[updated_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/lists`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/lists/{id}`

Copy

# Updating

HTTP Method

Endpoint

Assignable Attributes

PATCH

`/people/v2/lists/{id}`

Copy

## Actions

# mailchimp\_sync

HTTP Method

Endpoint

Description

POST

`/people/v2/lists/{list_id}/mailchimp_sync`

Copy

Sync a List to Mailchimp. (Mailchimp integration must already be configured for this organization.)

Permissions:

Must be authenticated

# run

HTTP Method

Endpoint

Description

POST

`/people/v2/lists/{list_id}/run`

Copy

Run a List to update its results.

Permissions:

Must be authenticated

## Associations

# campus

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/lists/{list_id}/campus`

Copy

[Campus](#/apps/people/2025-11-10/vertices/campus)

# category

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/lists/{list_id}/category`

Copy

[ListCategory](#/apps/people/2025-11-10/vertices/list_category)

# created\_by

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/lists/{list_id}/created_by`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

# list\_results

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/lists/{list_id}/list_results`

Copy

[ListResult](#/apps/people/2025-11-10/vertices/list_result)

# mailchimp\_sync\_status

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/lists/{list_id}/mailchimp_sync_status`

Copy

[MailchimpSyncStatus](#/apps/people/2025-11-10/vertices/mailchimp_sync_status)

# people

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/lists/{list_id}/people`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

# rules

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/lists/{list_id}/rules`

Copy

[Rule](#/apps/people/2025-11-10/vertices/rule)

# shares

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/lists/{list_id}/shares`

Copy

[ListShare](#/apps/people/2025-11-10/vertices/list_share)

# star

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/lists/{list_id}/star`

Copy

[ListStar](#/apps/people/2025-11-10/vertices/list_star)

# updated\_by

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/lists/{list_id}/updated_by`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

## Belongs To

# Campus

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/campuses/{campus_id}/lists`

Copy

[Campus](#/apps/people/2025-11-10/vertices/campus)

# ListCategory

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/list_categories/{list_category_id}/lists`

Copy

[ListCategory](#/apps/people/2025-11-10/vertices/list_category)

# Organization

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/lists`

Copy

[Organization](#/apps/people/2025-11-10/vertices/organization)

*   `can_manage`
    
*   `recently_viewed`
    
*   `starred`
    
*   `unassigned`

---

## Report

*Vertex: `report`*

# Report

A report is editable liquid syntax that provides a powerful tool for presenting your Lists however you want.

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/reports
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/reports)

## Example Object

```
{
  "type": "Report",
  "id": "1",
  "attributes": {
    "body": "string",
    "created_at": "2000-01-01T12:00:00Z",
    "name": "string",
    "updated_at": "2000-01-01T12:00:00Z"
  },
  "relationships": {}
}
```

## Attributes

Name

Type

Description

`body`

`string`

`created_at`

`date_time`

`id`

`primary_key`

`name`

`string`

`updated_at`

`date_time`

## URL Parameters

# Can Include

Parameter

Value

Description

Assignable

include

created\_by

include associated created\_by

include

updated\_by

include associated updated\_by

# Order By

Parameter

Value

Type

Description

order

body

string

prefix with a hyphen (-body) to reverse the order

order

created\_at

string

prefix with a hyphen (-created\_at) to reverse the order

order

name

string

prefix with a hyphen (-name) to reverse the order

order

updated\_at

string

prefix with a hyphen (-updated\_at) to reverse the order

# Query By

Name

Parameter

Type

Description

Example

body

where\[body\]

string

Query on a specific body

`?where[body]=string`

created\_at

where\[created\_at\]

date\_time

Query on a specific created\_at

`?where[created_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

name

where\[name\]

string

Query on a specific name

`?where[name]=string`

updated\_at

where\[updated\_at\]

date\_time

Query on a specific updated\_at

`?where[updated_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/reports`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/reports/{id}`

Copy

# Creating

HTTP Method

Endpoint

Assignable Attributes

POST

`/people/v2/reports`

Copy

*   name
*   body

# Updating

HTTP Method

Endpoint

Assignable Attributes

PATCH

`/people/v2/reports/{id}`

Copy

*   name
*   body

# Deleting

HTTP Method

Endpoint

DELETE

`/people/v2/reports/{id}`

Copy

## Associations

# created\_by

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/reports/{report_id}/created_by`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

# updated\_by

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/reports/{report_id}/updated_by`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

## Belongs To

# Organization

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/reports`

Copy

[Organization](#/apps/people/2025-11-10/vertices/organization)

---

## Form

*Vertex: `form`*

# Form

A custom form for people to fill out.

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/forms
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/forms)

## Example Object

```
{
  "type": "Form",
  "id": "1",
  "attributes": {
    "active": true,
    "archived": true,
    "archived_at": "2000-01-01T12:00:00Z",
    "created_at": "2000-01-01T12:00:00Z",
    "deleted_at": "2000-01-01T12:00:00Z",
    "description": "string",
    "login_required": true,
    "name": "string",
    "public_url": "string",
    "recently_viewed": true,
    "send_submission_notification_to_submitter": true,
    "submission_count": 1,
    "updated_at": "2000-01-01T12:00:00Z"
  },
  "relationships": {
    "campus": {
      "data": {
        "type": "Campus",
        "id": "1"
      }
    },
    "form_category": {
      "data": {
        "type": "FormCategory",
        "id": "1"
      }
    }
  }
}
```

## Attributes

Name

Type

Description

`active`

`boolean`

`archived`

`boolean`

`archived_at`

`date_time`

`created_at`

`date_time`

`deleted_at`

`date_time`

`description`

`string`

`id`

`primary_key`

`login_required`

`boolean`

`name`

`string`

`public_url`

`string`

`recently_viewed`

`boolean`

`send_submission_notification_to_submitter`

`boolean`

`submission_count`

`integer`

`updated_at`

`date_time`

## Relationships

Name

Type

Association Type

Note

campus

Campus

to\_one

form\_category

FormCategory

to\_one

## URL Parameters

# Can Include

Parameter

Value

Description

Assignable

include

campus

include associated campus

create and update

include

category

include associated category

# Order By

Parameter

Value

Type

Description

order

active

string

prefix with a hyphen (-active) to reverse the order

order

archived\_at

string

prefix with a hyphen (-archived\_at) to reverse the order

order

created\_at

string

prefix with a hyphen (-created\_at) to reverse the order

order

deleted\_at

string

prefix with a hyphen (-deleted\_at) to reverse the order

order

description

string

prefix with a hyphen (-description) to reverse the order

order

name

string

prefix with a hyphen (-name) to reverse the order

order

updated\_at

string

prefix with a hyphen (-updated\_at) to reverse the order

# Query By

Name

Parameter

Type

Description

Example

active

where\[active\]

boolean

Query on a specific active

`?where[active]=true`

id

where\[id\]

primary\_key

Query on a specific id

`?where[id]=primary_key`

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/forms`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/forms/{id}`

Copy

## Associations

# campus

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/forms/{form_id}/campus`

Copy

[Campus](#/apps/people/2025-11-10/vertices/campus)

# category

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/forms/{form_id}/category`

Copy

[FormCategory](#/apps/people/2025-11-10/vertices/form_category)

# fields

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/forms/{form_id}/fields`

Copy

[FormField](#/apps/people/2025-11-10/vertices/form_field)

# form\_submissions

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/forms/{form_id}/form_submissions`

Copy

[FormSubmission](#/apps/people/2025-11-10/vertices/form_submission)

## Belongs To

# FormSubmission

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/forms/{form_id}/form_submissions/{form_submission_id}/form`

Copy

[FormSubmission](#/apps/people/2025-11-10/vertices/form_submission)

# Organization

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/forms`

Copy

[Organization](#/apps/people/2025-11-10/vertices/organization)

*   `archived`
    
*   `closed`
    
*   `not_archived`
    
*   `open`
    
*   `recently_viewed`
    
*   `with_recoverable`

---

## Service Time

*Vertex: `service_time`*

# ServiceTime

A ServiceTime Resource

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/campuses/{campus_id}/service_times
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/campuses/{campus_id}/service_times)

## Example Object

```
{
  "type": "ServiceTime",
  "id": "1",
  "attributes": {
    "day": "value",
    "description": "string",
    "start_time": 1
  },
  "relationships": {
    "organization": {
      "data": {
        "type": "Organization",
        "id": "1"
      }
    },
    "campus": {
      "data": {
        "type": "Campus",
        "id": "1"
      }
    }
  }
}
```

## Attributes

Name

Type

Description

`day`

`string`

Possible values: `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, or `saturday`

`description`

`string`

`id`

`primary_key`

`start_time`

`integer`

## Relationships

Name

Type

Association Type

Note

organization

Organization

to\_one

campus

Campus

to\_one

## URL Parameters

# Order By

Parameter

Value

Type

Description

order

time

string

prefix with a hyphen (-time) to reverse the order

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/campuses/{campus_id}/service_times`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/campuses/{campus_id}/service_times/{id}`

Copy

# Creating

HTTP Method

Endpoint

Assignable Attributes

POST

`/people/v2/campuses/{campus_id}/service_times`

Copy

*   start\_time
*   day
*   description

Notes:

Must be an Organization Administrator

# Updating

HTTP Method

Endpoint

Assignable Attributes

PATCH

`/people/v2/campuses/{campus_id}/service_times/{id}`

Copy

*   start\_time
*   day
*   description

Notes:

Must be an Organization Administrator

# Deleting

HTTP Method

Endpoint

DELETE

`/people/v2/campuses/{campus_id}/service_times/{id}`

Copy

Notes:

Must be an Organization Administrator

## Belongs To

# Campus

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/campuses/{campus_id}/service_times`

Copy

[Campus](#/apps/people/2025-11-10/vertices/campus)

---

## Tab

*Vertex: `tab`*

# Tab

A tab is a custom tab and groups like field definitions.

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/tabs
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/tabs)

## Example Object

```
{
  "type": "Tab",
  "id": "1",
  "attributes": {
    "name": "string",
    "sequence": 1,
    "slug": "string"
  },
  "relationships": {}
}
```

## Attributes

Name

Type

Description

`id`

`primary_key`

`name`

`string`

`sequence`

`integer`

`slug`

`string`

## URL Parameters

# Can Include

Parameter

Value

Description

Assignable

include

field\_definitions

include associated field\_definitions

include

field\_options

include associated field\_options

# Order By

Parameter

Value

Type

Description

order

name

string

prefix with a hyphen (-name) to reverse the order

order

sequence

string

prefix with a hyphen (-sequence) to reverse the order

order

slug

string

prefix with a hyphen (-slug) to reverse the order

# Query By

Name

Parameter

Type

Description

Example

name

where\[name\]

string

Query on a specific name

`?where[name]=string`

sequence

where\[sequence\]

integer

Query on a specific sequence

`?where[sequence]=1`

slug

where\[slug\]

string

Query on a specific slug

`?where[slug]=string`

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/tabs`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/tabs/{id}`

Copy

# Creating

HTTP Method

Endpoint

Assignable Attributes

POST

`/people/v2/tabs`

Copy

*   name
*   sequence

# Updating

HTTP Method

Endpoint

Assignable Attributes

PATCH

`/people/v2/tabs/{id}`

Copy

*   name
*   sequence

# Deleting

HTTP Method

Endpoint

DELETE

`/people/v2/tabs/{id}`

Copy

## Associations

# field\_definitions

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/tabs/{tab_id}/field_definitions`

Copy

[FieldDefinition](#/apps/people/2025-11-10/vertices/field_definition)

*   `with_deleted`
    

# field\_options

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/tabs/{tab_id}/field_options`

Copy

[FieldOption](#/apps/people/2025-11-10/vertices/field_option)

## Belongs To

# FieldDatum

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/field_data/{field_datum_id}/tab`

Copy

[FieldDatum](#/apps/people/2025-11-10/vertices/field_datum)

# FieldDefinition

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/field_definitions/{field_definition_id}/tab`

Copy

[FieldDefinition](#/apps/people/2025-11-10/vertices/field_definition)

# Organization

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/tabs`

Copy

[Organization](#/apps/people/2025-11-10/vertices/organization)

*   `with_field_definitions`

---

## Address

*Vertex: `address`*

# Address

An address represents a physical and/or mailing address for a person.

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/addresses
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/addresses)

## Example Object

```
{
  "type": "Address",
  "id": "1",
  "attributes": {
    "city": "string",
    "country_code": "string",
    "country_name": "string",
    "created_at": "2000-01-01T12:00:00Z",
    "location": "string",
    "primary": true,
    "state": "string",
    "street_line_1": "string",
    "street_line_2": "string",
    "updated_at": "2000-01-01T12:00:00Z",
    "zip": "string"
  },
  "relationships": {
    "person": {
      "data": {
        "type": "Person",
        "id": "1"
      }
    }
  }
}
```

## Attributes

Name

Type

Description

`city`

`string`

`country_code`

`string`

`country_name`

`string`

`created_at`

`date_time`

`id`

`primary_key`

`location`

`string`

`primary`

`boolean`

`state`

`string`

`street_line_1`

`string`

`street_line_2`

`string`

`updated_at`

`date_time`

`zip`

`string`

## Relationships

Name

Type

Association Type

Note

person

Person

to\_one

## URL Parameters

# Order By

Parameter

Value

Type

Description

order

city

string

prefix with a hyphen (-city) to reverse the order

order

country\_code

string

prefix with a hyphen (-country\_code) to reverse the order

order

created\_at

string

prefix with a hyphen (-created\_at) to reverse the order

order

location

string

prefix with a hyphen (-location) to reverse the order

order

primary

string

prefix with a hyphen (-primary) to reverse the order

order

state

string

prefix with a hyphen (-state) to reverse the order

order

street\_line\_1

string

prefix with a hyphen (-street\_line\_1) to reverse the order

order

street\_line\_2

string

prefix with a hyphen (-street\_line\_2) to reverse the order

order

updated\_at

string

prefix with a hyphen (-updated\_at) to reverse the order

order

zip

string

prefix with a hyphen (-zip) to reverse the order

# Query By

Name

Parameter

Type

Description

Example

city

where\[city\]

string

Query on a specific city

`?where[city]=string`

country\_code

where\[country\_code\]

string

Query on a specific country\_code

`?where[country_code]=string`

location

where\[location\]

string

Query on a specific location

`?where[location]=string`

primary

where\[primary\]

boolean

Query on a specific primary

`?where[primary]=true`

state

where\[state\]

string

Query on a specific state

`?where[state]=string`

street\_line\_1

where\[street\_line\_1\]

string

Query on a specific street\_line\_1

`?where[street_line_1]=string`

street\_line\_2

where\[street\_line\_2\]

string

Query on a specific street\_line\_2

`?where[street_line_2]=string`

zip

where\[zip\]

string

Query on a specific zip

`?where[zip]=string`

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/addresses`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/addresses/{id}`

Copy

# Creating

HTTP Method

Endpoint

Assignable Attributes

POST

`/people/v2/people/{person_id}/addresses`

Copy

*   city
*   state
*   zip
*   country\_code
*   location
*   primary
*   street\_line\_1
*   street\_line\_2

# Updating

HTTP Method

Endpoint

Assignable Attributes

PATCH

`/people/v2/addresses/{id}`

Copy

*   city
*   state
*   zip
*   country\_code
*   location
*   primary
*   street\_line\_1
*   street\_line\_2

# Deleting

HTTP Method

Endpoint

DELETE

`/people/v2/addresses/{id}`

Copy

## Belongs To

# Organization

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/addresses`

Copy

[Organization](#/apps/people/2025-11-10/vertices/organization)

# Person

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/people/{person_id}/addresses`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

---

## Email

*Vertex: `email`*

# Email

An email represents an email address and location.

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/emails
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/emails)

## Example Object

```
{
  "type": "Email",
  "id": "1",
  "attributes": {
    "address": "string",
    "blocked": true,
    "created_at": "2000-01-01T12:00:00Z",
    "location": "string",
    "primary": true,
    "updated_at": "2000-01-01T12:00:00Z"
  },
  "relationships": {
    "person": {
      "data": {
        "type": "Person",
        "id": "1"
      }
    }
  }
}
```

## Attributes

Name

Type

Description

`address`

`string`

`blocked`

`boolean`

`created_at`

`date_time`

`id`

`primary_key`

`location`

`string`

`primary`

`boolean`

`updated_at`

`date_time`

## Relationships

Name

Type

Association Type

Note

person

Person

to\_one

## URL Parameters

# Order By

Parameter

Value

Type

Description

order

address

string

prefix with a hyphen (-address) to reverse the order

order

created\_at

string

prefix with a hyphen (-created\_at) to reverse the order

order

location

string

prefix with a hyphen (-location) to reverse the order

order

primary

string

prefix with a hyphen (-primary) to reverse the order

order

updated\_at

string

prefix with a hyphen (-updated\_at) to reverse the order

# Query By

Name

Parameter

Type

Description

Example

address

where\[address\]

string

Query on a specific address

`?where[address]=string`

blocked

where\[blocked\]

boolean

Query on a specific blocked

`?where[blocked]=true`

created\_at

where\[created\_at\]

date\_time

Query on a specific created\_at

`?where[created_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

location

where\[location\]

string

Query on a specific location

`?where[location]=string`

primary

where\[primary\]

boolean

Query on a specific primary

`?where[primary]=true`

updated\_at

where\[updated\_at\]

date\_time

Query on a specific updated\_at

`?where[updated_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/emails`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/emails/{id}`

Copy

# Creating

HTTP Method

Endpoint

Assignable Attributes

POST

`/people/v2/people/{person_id}/emails`

Copy

*   address
*   location
*   primary

# Updating

HTTP Method

Endpoint

Assignable Attributes

PATCH

`/people/v2/emails/{id}`

Copy

*   address
*   location
*   primary

# Deleting

HTTP Method

Endpoint

DELETE

`/people/v2/emails/{id}`

Copy

## Associations

# person

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/emails/{email_id}/person`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

## Belongs To

# Organization

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/emails`

Copy

[Organization](#/apps/people/2025-11-10/vertices/organization)

# Person

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/people/{person_id}/emails`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

---

## Household Membership

*Vertex: `household_membership`*

# HouseholdMembership

A household membership is the linking record between a household and a person.

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/households/{household_id}/household_memberships
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/households/{household_id}/household_memberships)

## Example Object

```
{
  "type": "HouseholdMembership",
  "id": "1",
  "attributes": {
    "household_role": "string",
    "pending": true,
    "person_name": "string"
  },
  "relationships": {
    "person": {
      "data": {
        "type": "Person",
        "id": "1"
      }
    }
  }
}
```

## Attributes

Name

Type

Description

Note

`household_role`

`string`

The role of the person within the household. Possible values are: `adult`, `child_or_dependent`, `other_adult`or`parent_guardian`.

Only available if the 'Parent and guardian household roles' feature is enabled.

`id`

`primary_key`

`pending`

`boolean`

False when a person's membership in a household is unverified.

`person_name`

`string`

## Relationships

Name

Type

Association Type

Note

person

Person

to\_one

## URL Parameters

# Can Include

Parameter

Value

Description

Assignable

include

household

include associated household

include

person

include associated person

create and update

# Order By

Parameter

Value

Type

Description

order

pending

string

prefix with a hyphen (-pending) to reverse the order

order

person\_name

string

prefix with a hyphen (-person\_name) to reverse the order

# Query By

Name

Parameter

Type

Description

Example

pending

where\[pending\]

boolean

Query on a specific pending

`?where[pending]=true`

person\_name

where\[person\_name\]

string

Query on a specific person\_name

`?where[person_name]=string`

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/households/{household_id}/household_memberships`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/households/{household_id}/household_memberships/{id}`

Copy

# Creating

HTTP Method

Endpoint

Assignable Attributes

POST

`/people/v2/households/{household_id}/household_memberships`

Copy

*   person\_id
*   pending
*   household\_role

Notes:

To add someone to a household, you must specify the person as a relationship: `{"data":{"attributes":{},"relationships":{"person":{"data":{"type":"Person","id":"1"}}}}}`

# Updating

HTTP Method

Endpoint

Assignable Attributes

PATCH

`/people/v2/households/{household_id}/household_memberships/{id}`

Copy

*   person\_id
*   pending
*   household\_role

# Deleting

HTTP Method

Endpoint

DELETE

`/people/v2/households/{household_id}/household_memberships/{id}`

Copy

## Associations

# household

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/households/{household_id}/household_memberships/{household_membership_id}/household`

Copy

[Household](#/apps/people/2025-11-10/vertices/household)

# person

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/households/{household_id}/household_memberships/{household_membership_id}/person`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

## Belongs To

# Household

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/households/{household_id}/household_memberships`

Copy

[Household](#/apps/people/2025-11-10/vertices/household)

# Person

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/people/{person_id}/household_memberships`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

---

## Organization

*Vertex: `organization`*

# Organization

The organization represents a single church. Every other resource is scoped to this record.

## Example Request

```
curl https://api.planningcenteronline.com/people/v2
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2)

## Example Object

```
{
  "type": "Organization",
  "id": "1",
  "attributes": {
    "avatar_url": "string",
    "church_center_subdomain": "string",
    "contact_website": "string",
    "country_code": "string",
    "created_at": "2000-01-01T12:00:00Z",
    "date_format": 1,
    "grades": [],
    "name": "string",
    "time_zone": "string"
  },
  "relationships": {}
}
```

## Attributes

Name

Type

Description

`avatar_url`

`string`

`church_center_subdomain`

`string`

`contact_website`

`string`

`country_code`

`string`

`created_at`

`date_time`

`date_format`

`integer`

`grades`

`array`

`id`

`primary_key`

`name`

`string`

`time_zone`

`string`

## URL Parameters

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/{id}`

Copy

## Associations

# addresses

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/addresses`

Copy

[Address](#/apps/people/2025-11-10/vertices/address)

# apps

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/apps`

Copy

[App](#/apps/people/2025-11-10/vertices/app)

# background\_checks

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/background_checks`

Copy

[BackgroundCheck](#/apps/people/2025-11-10/vertices/background_check)

*   `current` — filter background checks to only those considered "current"
    

# birthday\_people

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/birthday_people`

Copy

[BirthdayPeople](#/apps/people/2025-11-10/vertices/birthday_people)

# campuses

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/campuses`

Copy

[Campus](#/apps/people/2025-11-10/vertices/campus)

# carriers

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/carriers`

Copy

[Carrier](#/apps/people/2025-11-10/vertices/carrier)

# emails

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/emails`

Copy

[Email](#/apps/people/2025-11-10/vertices/email)

# field\_data

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/field_data`

Copy

[FieldDatum](#/apps/people/2025-11-10/vertices/field_datum)

# field\_definitions

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/field_definitions`

Copy

[FieldDefinition](#/apps/people/2025-11-10/vertices/field_definition)

*   `include_deleted` — By default, deleted fields are not included. Pass filter=include\_deleted to include them.
    

# form\_categories

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/form_categories`

Copy

[FormCategory](#/apps/people/2025-11-10/vertices/form_category)

# forms

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/forms`

Copy

[Form](#/apps/people/2025-11-10/vertices/form)

*   `archived`
    
*   `closed`
    
*   `not_archived`
    
*   `open`
    
*   `recently_viewed`
    
*   `with_recoverable`
    

# households

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/households`

Copy

[Household](#/apps/people/2025-11-10/vertices/household)

# inactive\_reasons

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/inactive_reasons`

Copy

[InactiveReason](#/apps/people/2025-11-10/vertices/inactive_reason)

# list\_categories

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/list_categories`

Copy

[ListCategory](#/apps/people/2025-11-10/vertices/list_category)

# lists

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/lists`

Copy

[List](#/apps/people/2025-11-10/vertices/list)

*   `can_manage`
    
*   `recently_viewed`
    
*   `starred`
    
*   `unassigned`
    

# marital\_statuses

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/marital_statuses`

Copy

[MaritalStatus](#/apps/people/2025-11-10/vertices/marital_status)

# message\_groups

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/message_groups`

Copy

[MessageGroup](#/apps/people/2025-11-10/vertices/message_group)

# messages

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/messages`

Copy

[Message](#/apps/people/2025-11-10/vertices/message)

*   `created_after`
    

# name\_prefixes

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/name_prefixes`

Copy

[NamePrefix](#/apps/people/2025-11-10/vertices/name_prefix)

# name\_suffixes

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/name_suffixes`

Copy

[NameSuffix](#/apps/people/2025-11-10/vertices/name_suffix)

# note\_categories

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/note_categories`

Copy

[NoteCategory](#/apps/people/2025-11-10/vertices/note_category)

*   `view_creatable`
    

# note\_category\_subscriptions

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/note_category_subscriptions`

Copy

[NoteCategorySubscription](#/apps/people/2025-11-10/vertices/note_category_subscription)

# notes

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/notes`

Copy

[Note](#/apps/people/2025-11-10/vertices/note)

# people

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

*   `admins`
    
*   `created_since` — filter people created in the last 24 hours; pass an additional `time` parameter in ISO 8601 format to specify your own timeframe
    
*   `organization_admins`
    

# people\_imports

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people_imports`

Copy

[PeopleImport](#/apps/people/2025-11-10/vertices/people_import)

# person\_mergers

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/person_mergers`

Copy

[PersonMerger](#/apps/people/2025-11-10/vertices/person_merger)

# phone\_numbers

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/phone_numbers`

Copy

[PhoneNumber](#/apps/people/2025-11-10/vertices/phone_number)

# reports

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/reports`

Copy

[Report](#/apps/people/2025-11-10/vertices/report)

# school\_options

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/school_options`

Copy

[SchoolOption](#/apps/people/2025-11-10/vertices/school_option)

# social\_profiles

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/social_profiles`

Copy

[SocialProfile](#/apps/people/2025-11-10/vertices/social_profile)

# spam\_email\_addresses

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/spam_email_addresses`

Copy

[SpamEmailAddress](#/apps/people/2025-11-10/vertices/spam_email_address)

# stats

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/stats`

Copy

[OrganizationStatistics](#/apps/people/2025-11-10/vertices/organization_statistics)

# tabs

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/tabs`

Copy

[Tab](#/apps/people/2025-11-10/vertices/tab)

*   `with_field_definitions`
    

# workflows

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/workflows`

Copy

[Workflow](#/apps/people/2025-11-10/vertices/workflow)

*   `archived`
    
*   `has_my_cards`
    
*   `manage_cards_allowed`
    
*   `not_archived`
    
*   `only_deleted`
    
*   `recently_viewed`
    
*   `unassigned`
    
*   `with_deleted`
    
*   `with_recoverable`
    
*   `with_steps`
    

## Belongs To

# Person

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/people/{person_id}/organization`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

---

## Inactive Reason

*Vertex: `inactive_reason`*

# InactiveReason

An inactive reason is a small bit of text indicating why a member is no longer active.

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/inactive_reasons
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/inactive_reasons)

## Example Object

```
{
  "type": "InactiveReason",
  "id": "1",
  "attributes": {
    "value": "string"
  },
  "relationships": {}
}
```

## Attributes

Name

Type

Description

`id`

`primary_key`

`value`

`string`

## URL Parameters

# Order By

Parameter

Value

Type

Description

order

value

string

prefix with a hyphen (-value) to reverse the order

# Query By

Name

Parameter

Type

Description

Example

value

where\[value\]

string

Query on a specific value

`?where[value]=string`

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/inactive_reasons`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/inactive_reasons/{id}`

Copy

# Creating

HTTP Method

Endpoint

Assignable Attributes

POST

`/people/v2/inactive_reasons`

Copy

*   value

# Updating

HTTP Method

Endpoint

Assignable Attributes

PATCH

`/people/v2/inactive_reasons/{id}`

Copy

*   value

# Deleting

HTTP Method

Endpoint

DELETE

`/people/v2/inactive_reasons/{id}`

Copy

## Belongs To

# Organization

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/inactive_reasons`

Copy

[Organization](#/apps/people/2025-11-10/vertices/organization)

# Person

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/people/{person_id}/inactive_reason`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

---

## Workflow Card

*Vertex: `workflow_card`*

# WorkflowCard

A Card

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/people/{person_id}/workflow_cards
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/people/{person_id}/workflow_cards)

## Example Object

```
{
  "type": "WorkflowCard",
  "id": "1",
  "attributes": {
    "calculated_due_at_in_days_ago": 1,
    "completed_at": "2000-01-01T12:00:00Z",
    "created_at": "2000-01-01T12:00:00Z",
    "flagged_for_notification_at": "2000-01-01T12:00:00Z",
    "moved_to_step_at": "2000-01-01T12:00:00Z",
    "overdue": true,
    "removed_at": "2000-01-01T12:00:00Z",
    "snooze_until": "2000-01-01T12:00:00Z",
    "stage": "string",
    "sticky_assignment": true,
    "updated_at": "2000-01-01T12:00:00Z"
  },
  "relationships": {
    "assignee": {
      "data": {
        "type": "Assignee",
        "id": "1"
      }
    },
    "person": {
      "data": {
        "type": "Person",
        "id": "1"
      }
    },
    "workflow": {
      "data": {
        "type": "Workflow",
        "id": "1"
      }
    },
    "current_step": {
      "data": {
        "type": "WorkflowStep",
        "id": "1"
      }
    }
  }
}
```

## Attributes

Name

Type

Description

`calculated_due_at_in_days_ago`

`integer`

`completed_at`

`date_time`

`created_at`

`date_time`

`flagged_for_notification_at`

`date_time`

`id`

`primary_key`

`moved_to_step_at`

`date_time`

`overdue`

`boolean`

`removed_at`

`date_time`

`snooze_until`

`date_time`

`stage`

`string`

`sticky_assignment`

`boolean`

`updated_at`

`date_time`

## Relationships

Name

Type

Association Type

Note

assignee

Assignee

to\_one

person

Person

to\_one

workflow

Workflow

to\_one

current\_step

WorkflowStep

to\_one

## URL Parameters

# Can Include

Parameter

Value

Description

Assignable

include

assignee

include associated assignee

create and update

include

current\_step

include associated current\_step

create and update

include

person

include associated person

create and update

include

workflow

include associated workflow

create and update

# Order By

Parameter

Value

Type

Description

order

completed\_at

string

prefix with a hyphen (-completed\_at) to reverse the order

order

created\_at

string

prefix with a hyphen (-created\_at) to reverse the order

order

first\_name

string

prefix with a hyphen (-first\_name) to reverse the order

order

flagged\_for\_notification\_at

string

prefix with a hyphen (-flagged\_for\_notification\_at) to reverse the order

order

last\_name

string

prefix with a hyphen (-last\_name) to reverse the order

order

moved\_to\_step\_at

string

prefix with a hyphen (-moved\_to\_step\_at) to reverse the order

order

removed\_at

string

prefix with a hyphen (-removed\_at) to reverse the order

order

stage

string

prefix with a hyphen (-stage) to reverse the order

order

updated\_at

string

prefix with a hyphen (-updated\_at) to reverse the order

# Query By

Name

Parameter

Type

Description

Example

assignee\_id

where\[assignee\_id\]

integer

Query on a related assignee

`?where[assignee_id]=1`

overdue

where\[overdue\]

boolean

Query on a specific overdue

`?where[overdue]=true`

stage

where\[stage\]

string

Query on a specific stage

`?where[stage]=string`

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/people/{person_id}/workflow_cards`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/people/{person_id}/workflow_cards/{id}`

Copy

# Creating

HTTP Method

Endpoint

Assignable Attributes

POST

`/people/v2/workflows/{workflow_id}/cards`

Copy

*   sticky\_assignment
*   assignee\_id
*   person\_id

# Updating

HTTP Method

Endpoint

Assignable Attributes

PATCH

`/people/v2/people/{person_id}/workflow_cards/{id}`

Copy

*   sticky\_assignment
*   assignee\_id
*   person\_id

# Deleting

HTTP Method

Endpoint

DELETE

`/people/v2/people/{person_id}/workflow_cards/{id}`

Copy

## Actions

# go\_back

HTTP Method

Endpoint

Description

POST

`/people/v2/people/{person_id}/workflow_cards/{workflow_card_id}/go_back`

Copy

Move a Workflow Card back to the previous step.

Permissions:

Must be authenticated

# promote

HTTP Method

Endpoint

Description

POST

`/people/v2/people/{person_id}/workflow_cards/{workflow_card_id}/promote`

Copy

Move a Workflow Card to the next step.

Permissions:

Must be authenticated

# remove

HTTP Method

Endpoint

Description

POST

`/people/v2/people/{person_id}/workflow_cards/{workflow_card_id}/remove`

Copy

Removes a card

Permissions:

Must be authenticated

# restore

HTTP Method

Endpoint

Description

POST

`/people/v2/people/{person_id}/workflow_cards/{workflow_card_id}/restore`

Copy

Restore a card

Permissions:

Must be authenticated

# send\_email

HTTP Method

Endpoint

Description

POST

`/people/v2/people/{person_id}/workflow_cards/{workflow_card_id}/send_email`

Copy

Sends an email to the subject of the card

Details:

Pass in a subject and note.

Example Post Body:

```
{
  "data": {
    "attributes": {
      "subject": "Thanks for visiting this past Sunday!",
      "note": "It was great to meet you this past Sunday! Hope to see you again."
    }
  }
}
```

Permissions:

Must be authenticated

# skip\_step

HTTP Method

Endpoint

Description

POST

`/people/v2/people/{person_id}/workflow_cards/{workflow_card_id}/skip_step`

Copy

Move a Workflow Card to the next step without completing the current step.

Permissions:

Must be authenticated

# snooze

HTTP Method

Endpoint

Description

POST

`/people/v2/people/{person_id}/workflow_cards/{workflow_card_id}/snooze`

Copy

Snoozes a card for a specific duration

Details:

Pass in a duration in days.

Example Post Body:

```
{
  "data": {
    "attributes": {
      "duration": 15
    }
  }
}
```

Permissions:

Must be an editor or the person the card is assigned to

# unsnooze

HTTP Method

Endpoint

Description

POST

`/people/v2/people/{person_id}/workflow_cards/{workflow_card_id}/unsnooze`

Copy

Unsnoozes a card

Permissions:

Must be authenticated

## Associations

# activities

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/workflow_cards/{workflow_card_id}/activities`

Copy

[WorkflowCardActivity](#/apps/people/2025-11-10/vertices/workflow_card_activity)

# assignee

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/workflow_cards/{workflow_card_id}/assignee`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

# current\_step

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/workflow_cards/{workflow_card_id}/current_step`

Copy

[WorkflowStep](#/apps/people/2025-11-10/vertices/workflow_step)

# notes

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/workflow_cards/{workflow_card_id}/notes`

Copy

[WorkflowCardNote](#/apps/people/2025-11-10/vertices/workflow_card_note)

# person

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/workflow_cards/{workflow_card_id}/person`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

# workflow

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/people/{person_id}/workflow_cards/{workflow_card_id}/workflow`

Copy

[Workflow](#/apps/people/2025-11-10/vertices/workflow)

## Belongs To

# Person

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/people/{person_id}/workflow_cards`

Copy

[Person](#/apps/people/2025-11-10/vertices/person)

*   `assigned`
    

# Workflow

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/workflows/{workflow_id}/cards`

Copy

[Workflow](#/apps/people/2025-11-10/vertices/workflow)

---

## List Category

*Vertex: `list_category`*

# ListCategory

A List Category

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/list_categories
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/list_categories)

## Example Object

```
{
  "type": "ListCategory",
  "id": "1",
  "attributes": {
    "created_at": "2000-01-01T12:00:00Z",
    "name": "string",
    "organization_id": "primary_key",
    "updated_at": "2000-01-01T12:00:00Z"
  },
  "relationships": {
    "organization": {
      "data": {
        "type": "Organization",
        "id": "1"
      }
    }
  }
}
```

## Attributes

Name

Type

Description

`created_at`

`date_time`

`id`

`primary_key`

`name`

`string`

`organization_id`

`primary_key`

`updated_at`

`date_time`

## Relationships

Name

Type

Association Type

Note

organization

Organization

to\_one

## URL Parameters

# Can Include

Parameter

Value

Description

Assignable

include

lists

include associated lists

# Order By

Parameter

Value

Type

Description

order

created\_at

string

prefix with a hyphen (-created\_at) to reverse the order

order

name

string

prefix with a hyphen (-name) to reverse the order

order

organization\_id

string

prefix with a hyphen (-organization\_id) to reverse the order

order

updated\_at

string

prefix with a hyphen (-updated\_at) to reverse the order

# Query By

Name

Parameter

Type

Description

Example

created\_at

where\[created\_at\]

date\_time

Query on a specific created\_at

`?where[created_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

name

where\[name\]

string

Query on a specific name

`?where[name]=string`

organization\_id

where\[organization\_id\]

primary\_key

Query on a specific organization\_id

`?where[organization_id]=primary_key`

updated\_at

where\[updated\_at\]

date\_time

Query on a specific updated\_at

`?where[updated_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/list_categories`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/list_categories/{id}`

Copy

# Creating

HTTP Method

Endpoint

Assignable Attributes

POST

`/people/v2/list_categories`

Copy

*   name

# Updating

HTTP Method

Endpoint

Assignable Attributes

PATCH

`/people/v2/list_categories/{id}`

Copy

*   name

# Deleting

HTTP Method

Endpoint

DELETE

`/people/v2/list_categories/{id}`

Copy

## Associations

# lists

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/list_categories/{list_category_id}/lists`

Copy

[List](#/apps/people/2025-11-10/vertices/list)

## Belongs To

# List

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/lists/{list_id}/category`

Copy

[List](#/apps/people/2025-11-10/vertices/list)

# Organization

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/list_categories`

Copy

[Organization](#/apps/people/2025-11-10/vertices/organization)

---

## Form Field

*Vertex: `form_field`*

# FormField

A field in a custom form.

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/forms/{form_id}/fields
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/forms/{form_id}/fields)

## Example Object

```
{
  "type": "FormField",
  "id": "1",
  "attributes": {
    "created_at": "2000-01-01T12:00:00Z",
    "description": "string",
    "field_type": "value",
    "label": "string",
    "required": true,
    "sequence": 1,
    "settings": "string",
    "updated_at": "2000-01-01T12:00:00Z"
  },
  "relationships": {
    "form": {
      "data": {
        "type": "Form",
        "id": "1"
      }
    },
    "fieldable": {
      "data": {
        "type": "Fieldable",
        "id": "1"
      }
    },
    "options": {
      "data": {
        "type": "FormFieldOption",
        "id": "1"
      }
    },
    "form_field_conditions": {
      "data": [
        {
          "type": "FormFieldCondition",
          "id": "1"
        }
      ]
    }
  }
}
```

## Attributes

Name

Type

Description

`created_at`

`date_time`

`description`

`string`

`field_type`

`string`

Possible values: `string`, `text`, `checkboxes`, `dropdown`, `date`, `phone_number`, `address`, `birthday`, `gender`, `custom_field`, `note`, `workflow`, `heading`, `number`, `boolean`, `file`, `medical`, `workflow_checkbox`, `workflow_checkboxes`, `workflow_dropdown`, `marital_status`, `anniversary`, `grade`, `primary_campus`, `school`, or `household`

`id`

`primary_key`

`label`

`string`

`required`

`boolean`

`sequence`

`integer`

`settings`

`string`

`updated_at`

`date_time`

## Relationships

Name

Type

Association Type

Note

form

Form

to\_one

fieldable

Fieldable

to\_one

Polymorphic. Fieldable can be any of the following: FieldDefinition, NoteCategory, or Workflow.

options

FormFieldOption

to\_one

form\_field\_conditions

FormFieldCondition

to\_many

## URL Parameters

# Can Include

Parameter

Value

Description

Assignable

include

options

include associated options

create and update

# Order By

Parameter

Value

Type

Description

order

created\_at

string

prefix with a hyphen (-created\_at) to reverse the order

order

sequence

string

prefix with a hyphen (-sequence) to reverse the order

order

updated\_at

string

prefix with a hyphen (-updated\_at) to reverse the order

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/forms/{form_id}/fields`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/forms/{form_id}/fields/{id}`

Copy

## Associations

# options

HTTP Method

Endpoint

Returns

Details

Filter By

GET

`/people/v2/forms/{form_id}/fields/{form_field_id}/options`

Copy

[FormFieldOption](#/apps/people/2025-11-10/vertices/form_field_option)

## Belongs To

# Form

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/forms/{form_id}/fields`

Copy

[Form](#/apps/people/2025-11-10/vertices/form)

# FormSubmission

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/forms/{form_id}/form_submissions/{form_submission_id}/form_fields`

Copy

[FormSubmission](#/apps/people/2025-11-10/vertices/form_submission)

---

## Form Category

*Vertex: `form_category`*

# FormCategory

A Form Category

## Example Request

```
curl https://api.planningcenteronline.com/people/v2/form_categories
```

[View in API Explorer](https://api.planningcenteronline.com/explorer/people/v2/form_categories)

## Example Object

```
{
  "type": "FormCategory",
  "id": "1",
  "attributes": {
    "created_at": "2000-01-01T12:00:00Z",
    "name": "string",
    "updated_at": "2000-01-01T12:00:00Z"
  },
  "relationships": {}
}
```

## Attributes

Name

Type

Description

`created_at`

`date_time`

`id`

`primary_key`

`name`

`string`

`updated_at`

`date_time`

## URL Parameters

# Order By

Parameter

Value

Type

Description

order

created\_at

string

prefix with a hyphen (-created\_at) to reverse the order

order

name

string

prefix with a hyphen (-name) to reverse the order

order

updated\_at

string

prefix with a hyphen (-updated\_at) to reverse the order

# Query By

Name

Parameter

Type

Description

Example

created\_at

where\[created\_at\]

date\_time

Query on a specific created\_at

`?where[created_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

name

where\[name\]

string

Query on a specific name

`?where[name]=string`

updated\_at

where\[updated\_at\]

date\_time

Query on a specific updated\_at

`?where[updated_at]=2000-01-01T12:00:00Z`[](#/overview/dates-times)

# Pagination

Name

Parameter

Type

Description

per\_page

per\_page

integer

how many records to return per page (min=1, max=100, default=25)

offset

offset

integer

get results from given offset

## Endpoints

# Listing

HTTP Method

Endpoint

GET

`/people/v2/form_categories`

Copy

# Reading

HTTP Method

Endpoint

GET

`/people/v2/form_categories/{id}`

Copy

# Creating

HTTP Method

Endpoint

Assignable Attributes

POST

`/people/v2/form_categories`

Copy

*   name

# Updating

HTTP Method

Endpoint

Assignable Attributes

PATCH

`/people/v2/form_categories/{id}`

Copy

*   name

# Deleting

HTTP Method

Endpoint

DELETE

`/people/v2/form_categories/{id}`

Copy

## Belongs To

# Form

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/forms/{form_id}/category`

Copy

[Form](#/apps/people/2025-11-10/vertices/form)

# Organization

HTTP Method

Endpoint

Association

Details

Filter By

GET

`/people/v2/form_categories`

Copy

[Organization](#/apps/people/2025-11-10/vertices/organization)

---
