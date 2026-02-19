// JSON:API types (from core)
export type {
  JsonValue,
  Meta,
  LinkObject,
  Link,
  Links,
  PaginationLinks,
  TopLevelLinks,
  ResourceIdentifier,
  Relationship,
  Attributes,
  ResourceObject,
  ErrorObject,
  Response,
  ToOne,
  ToMany,
  ErrorDocument,
  Paginated,
} from '@rachelallyson/planning-center-base-ts';

// All People resource types
export * from './people';

// API option types (where, include, order, GetPage/GetAll/GetById per resource)
export * from './api-options';
