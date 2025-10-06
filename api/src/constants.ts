/*
 * Copyright 2025 Sean M. Dalton
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Application constants to eliminate magic numbers and improve maintainability.
 * All numeric values used throughout the application should be defined here.
 */

// ============================================================================
// RATE LIMITING CONSTANTS
// ============================================================================

export const RATE_LIMITS = {
  /** Default requests per minute for general endpoints */
  DEFAULT_REQUESTS_PER_MINUTE: 10,

  /** Default time window in milliseconds (1 minute) */
  DEFAULT_WINDOW_MS: 60 * 1000,

  /** Specific rate limits for different endpoint types */
  CREATE_QUESTION: 10,
  UPVOTE: 10,
  SEARCH: 100,
  ADMIN_OPERATIONS: 50,

  /** Redis key expiration calculation helper */
  MS_PER_SECOND: 1000,
} as const;

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ============================================================================
// DATABASE & PAGINATION LIMITS
// ============================================================================

export const DATABASE_LIMITS = {
  /** Default pagination limit for list endpoints */
  DEFAULT_PAGINATION: 10,

  /** Maximum items for export preview */
  EXPORT_PREVIEW: 100,

  /** Validation limits for user input */
  MAX_TEAM_NAME: 100,
  MAX_TEAM_DESCRIPTION: 500,
  MAX_TEAM_SLUG: 50,
  MAX_TAG_NAME: 100,
  MAX_TAG_DESCRIPTION: 500,
  MAX_QUESTION_BODY_PREVIEW: 100, // For audit logs

  /** Search and filtering limits */
  MAX_SEARCH_RESULTS: 100,
  DEFAULT_SEARCH_LIMIT: 10,
} as const;

// ============================================================================
// TIME CONSTANTS
// ============================================================================

export const TIME_CONSTANTS = {
  /** Session expiry time in milliseconds (30 minutes) */
  SESSION_EXPIRY_MS: 30 * 60 * 1000,

  /** Time conversion constants */
  MS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,

  /** Audit log time calculations */
  AUDIT_RESPONSE_TIME_CONVERSION: {
    MS_TO_SECONDS: 1000,
    SECONDS_TO_MINUTES: 60,
  },
} as const;

// ============================================================================
// NETWORK & SERVICE CONSTANTS
// ============================================================================

export const NETWORK = {
  /** Default service ports */
  DEFAULT_REDIS_PORT: 6379,
  DEFAULT_POSTGRES_PORT: 5432,
  DEFAULT_API_PORT: 3000,

  /** Default service URLs */
  DEFAULT_REDIS_URL: 'redis://redis:6379',
  DEFAULT_DATABASE_URL: 'postgresql://app:app@db:5432/ama',
} as const;

// ============================================================================
// VALIDATION PATTERNS
// ============================================================================

export const VALIDATION_PATTERNS = {
  /** Team slug pattern: lowercase letters, numbers, and hyphens only */
  TEAM_SLUG: /^[a-z0-9-]+$/,

  /** Color hex pattern: 6-digit hex color codes */
  HEX_COLOR: /^#[0-9A-F]{6}$/i,
} as const;

// ============================================================================
// AUDIT LOG CONSTANTS
// ============================================================================

export const AUDIT_CONSTANTS = {
  /** Maximum length for entity descriptions in audit logs */
  MAX_ENTITY_DESCRIPTION_LENGTH: 100,

  /** Audit log export limits */
  DEFAULT_EXPORT_LIMIT: 100,
  DEFAULT_EXPORT_OFFSET: 0,
} as const;

// ============================================================================
// MODERATION CONSTANTS
// ============================================================================

export const MODERATION = {
  /** Default limits for moderation queue */
  DEFAULT_QUEUE_LIMIT: 100,
  DEFAULT_QUEUE_OFFSET: 0,

  /** Bulk operation limits */
  MAX_BULK_OPERATIONS: 50,
} as const;

// ============================================================================
// SSE (SERVER-SENT EVENTS) CONSTANTS
// ============================================================================

export const SSE_CONSTANTS = {
  /** SSE headers */
  CONTENT_TYPE: 'text/event-stream',
  CACHE_CONTROL: 'no-cache',
  CONNECTION: 'keep-alive',

  /** SSE event types */
  EVENT_TYPES: {
    QUESTION_UPDATE: 'question-update',
    MODERATION_UPDATE: 'moderation-update',
    TEAM_UPDATE: 'team-update',
  },
} as const;

// ============================================================================
// TYPE HELPERS
// ============================================================================

/** Extract numeric values from constants for type safety */
export type RateLimitValue = (typeof RATE_LIMITS)[keyof typeof RATE_LIMITS];
export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
export type DatabaseLimit = (typeof DATABASE_LIMITS)[keyof typeof DATABASE_LIMITS];
