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

import helmet from 'helmet';
import { RequestHandler } from 'express';

/**
 * Comprehensive security headers middleware using Helmet
 * Implements Mozilla Observatory best practices
 */
export function securityHeadersMiddleware(): RequestHandler {
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },

    // Strict Transport Security (HSTS)
    // Note: Only enable in production behind HTTPS
    strictTransportSecurity: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },

    // Prevent MIME type sniffing
    noSniff: true,

    // Referrer Policy - only send origin on cross-origin requests
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },

    // X-Frame-Options - prevent clickjacking
    frameguard: {
      action: 'deny',
    },

    // Hide X-Powered-By header
    hidePoweredBy: true,

    // X-DNS-Prefetch-Control
    dnsPrefetchControl: {
      allow: false,
    },

    // X-Download-Options for IE8+
    ieNoOpen: true,

    // Cross-Origin-Embedder-Policy
    crossOriginEmbedderPolicy: false, // Disabled for compatibility

    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: {
      policy: 'same-origin',
    },

    // Cross-Origin-Resource-Policy
    crossOriginResourcePolicy: {
      policy: 'same-origin',
    },

    // Origin-Agent-Cluster
    originAgentCluster: true,
  });
}

/**
 * Additional security headers for API responses
 */
export function apiSecurityHeaders(): RequestHandler {
  return (req, res, next) => {
    // Prevent caching of sensitive data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Additional security headers
    res.setHeader('X-XSS-Protection', '0'); // Disabled per modern best practices

    // Permissions Policy (Helmet doesn't set this by default)
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    );

    next();
  };
}

/**
 * Relaxed CSP for development environment
 * Allows Vite dev server features
 */
export function developmentSecurityHeaders(): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-eval'"], // Vite needs eval in dev
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'ws:', 'wss:'], // WebSocket for HMR
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },

    // Keep same security headers as production
    noSniff: true,
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    frameguard: {
      action: 'deny',
    },
    hidePoweredBy: true,
    dnsPrefetchControl: {
      allow: false,
    },
    ieNoOpen: true,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: {
      policy: 'same-origin',
    },
    crossOriginResourcePolicy: {
      policy: 'same-origin',
    },
    originAgentCluster: true,

    strictTransportSecurity: false, // Disable HSTS in development
  });
}
