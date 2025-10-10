/**
 * Extend express-session types to include our custom session data
 */

import 'express-session';
import type { AuthUser } from '../lib/auth/types.js';

declare module 'express-session' {
  interface SessionData {
    user?: AuthUser;
    oauthState?: string;
    tenantSlug?: string;
  }
}
