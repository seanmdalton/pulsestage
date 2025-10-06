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

import { doubleCsrf } from 'csrf-csrf';
import { Request, Response, NextFunction } from 'express';
import { env } from '../env.js';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * CSRF Protection using Double Submit Cookie pattern
 * More secure than single-token approach and doesn't require session storage
 */
const {
  invalidCsrfTokenError, // Error to check against
  generateCsrfToken, // Token generation for GET requests
  doubleCsrfProtection, // Protection middleware for state-changing requests
} = doubleCsrf({
  getSecret: () => env.ADMIN_KEY || 'fallback-csrf-secret-change-me', // Secret for signing tokens
  cookieName: 'x-csrf-token', // Cookie name
  cookieOptions: {
    httpOnly: true, // Prevent JavaScript access
    secure: isProduction, // HTTPS-only in production
    sameSite: 'lax', // CSRF protection
    path: '/',
    maxAge: 30 * 60 * 1000, // 30 minutes
  },
  size: 64, // Token size
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], // Don't require CSRF for safe methods
  getCsrfTokenFromRequest: (req: Request) => {
    // Check multiple locations for the token
    return (
      (req.headers['x-csrf-token'] as string) ||
      req.body?.csrfToken ||
      (req.query?.csrfToken as string)
    );
  },
  getSessionIdentifier: req => req.sessionID || 'anonymous', // Use session ID for token binding
});

/**
 * Middleware to generate and provide CSRF token
 * Apply this to routes that need to provide a token (e.g., login pages, forms)
 */
export function provideCsrfToken() {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = generateCsrfToken(req, res);
    // Attach token to response locals so it can be accessed in routes
    res.locals.csrfToken = token;
    next();
  };
}

/**
 * Middleware to validate CSRF token on state-changing requests
 * Apply this to POST, PUT, DELETE, PATCH routes
 */
export function validateCsrfToken() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF for mock auth (development/testing)
    if (req.headers['x-mock-sso-user']) {
      return next();
    }

    // Apply CSRF protection
    doubleCsrfProtection(req, res, error => {
      if (error) {
        if (error === invalidCsrfTokenError) {
          return res.status(403).json({
            error: 'CSRF token validation failed',
            message: 'Invalid or missing CSRF token',
          });
        }
        return res.status(500).json({
          error: 'CSRF validation error',
          message: 'Failed to validate CSRF token',
        });
      }
      next();
    });
  };
}

/**
 * Endpoint to get a CSRF token
 * Frontend can call this before making state-changing requests
 */
export function csrfTokenEndpoint() {
  return (req: Request, res: Response) => {
    const token = generateCsrfToken(req, res);
    res.json({ csrfToken: token });
  };
}

// Extend Express Request to include CSRF token
declare module 'express-serve-static-core' {
  interface Response {
    locals: {
      csrfToken?: string;
    };
  }
}
