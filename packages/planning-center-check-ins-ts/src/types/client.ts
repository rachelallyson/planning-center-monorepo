/**
 * Check-Ins Client Configuration Types
 */

import type { PcoClientConfig } from '@rachelallyson/planning-center-base-ts';

/**
 * Configuration for the Check-Ins API client
 * Extends the base client config with check-ins specific defaults
 */
export interface PcoCheckInsClientConfig extends Omit<PcoClientConfig, 'baseURL'> {
  /** Base URL override (defaults to https://api.planningcenteronline.com) */
  baseUrl?: string;
}

