# Security Headers

PulseStage implements comprehensive HTTP security headers using Helmet middleware to protect against common web vulnerabilities.

## Overview

All API responses include strict security headers following Mozilla Observatory best practices to achieve an A grade or higher.

## Implemented Headers

### Content-Security-Policy (CSP)

Strict Content Security Policy to prevent XSS attacks:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

**Features:**
- No inline scripts allowed (prevents XSS)
- Only load resources from same origin
- Prevents framing (clickjacking protection)
- Automatically upgrades HTTP to HTTPS requests

### X-Frame-Options

```
X-Frame-Options: DENY
```

Prevents the site from being embedded in iframes, protecting against clickjacking attacks.

### X-Content-Type-Options

```
X-Content-Type-Options: nosniff
```

Prevents browsers from MIME-type sniffing, reducing exposure to drive-by download attacks.

### Referrer-Policy

```
Referrer-Policy: strict-origin-when-cross-origin
```

Only sends the origin (not full URL) in the Referer header for cross-origin requests, protecting user privacy.

### Strict-Transport-Security (HSTS)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

Forces browsers to only use HTTPS connections for 1 year. **Only enabled in production behind HTTPS.**

### Cross-Origin-Opener-Policy

```
Cross-Origin-Opener-Policy: same-origin
```

Ensures that top-level documents do not share a browsing context group with cross-origin documents.

### Cross-Origin-Resource-Policy

```
Cross-Origin-Resource-Policy: same-origin
```

Prevents other origins from reading the resource.

### Permissions-Policy

```
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()
```

Disables access to sensitive browser APIs and device features.

### Additional Headers

- `Origin-Agent-Cluster: ?1` - Provides origin-keyed agent cluster isolation
- `X-DNS-Prefetch-Control: off` - Disables DNS prefetching
- `X-Download-Options: noopen` - Prevents IE from executing downloads
- `X-Powered-By: (removed)` - Hides server technology

## Development vs Production

### Production Mode

Strict security headers with:
- No eval() in JavaScript
- HSTS enabled
- Strict CSP
- All security headers enforced

### Development Mode

Relaxed headers for local development with Vite:
- Allows `'unsafe-eval'` for Vite HMR
- Allows WebSocket connections (ws:, wss:)
- HSTS disabled (no HTTPS required)
- All other security headers remain strict

## Testing Security Headers

### Automated Testing (Recommended)

We integrate [MDN HTTP Observatory](https://github.com/mdn/mdn-http-observatory/) directly into our test suite:

```bash
cd api
npm test observatory.test.ts
```

This runs 6 automated security tests including:
- Overall security grade and score
- Content-Security-Policy validation
- X-Content-Type-Options check
- X-Frame-Options check
- Referrer-Policy check
- Detailed test result logging

**Development Mode Results:**
- Expected Grade: C (relaxed CSP for Vite HMR)
- Expected Score: 50/100
- Acceptable: 7/10 tests passing

**Production Mode Expectations:**
- Target Grade: A or better
- Target Score: 70+/100
- All critical security tests passing

### Local Testing

Check headers locally:

```bash
curl -I http://localhost:5001/health
```

### Mozilla HTTP Observatory (Manual)

Test your deployed site manually:

1. Visit: https://developer.mozilla.org/en-US/observatory/
2. Enter your site URL
3. Run the scan
4. Target score: **A grade or higher**

### SecurityHeaders.com

Alternative testing tool:

1. Visit: https://securityheaders.com/
2. Enter your site URL
3. Check for all security headers

## Implementation

The security headers are implemented in `api/src/middleware/securityHeaders.ts` using Helmet:

```typescript
import helmet from 'helmet';

export function securityHeadersMiddleware(): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // ... more directives
      },
    },
    // ... more options
  });
}
```

Applied in `api/src/app.ts`:

```typescript
// Production
app.use(securityHeadersMiddleware());
app.use(apiSecurityHeaders());

// Development
app.use(developmentSecurityHeaders());
app.use(apiSecurityHeaders());
```

## Testing

### Unit Tests

Comprehensive test suite in `api/src/middleware/securityHeaders.test.ts`:

- 17 security header tests
- Verifies all headers are present
- Checks header values match expectations
- Tests CSP directives
- Validates Mozilla Observatory requirements

```bash
cd api
npm test securityHeaders.test.ts
```

### Observatory Integration Tests

Automated MDN HTTP Observatory scanning in `api/src/middleware/observatory.test.ts`:

- 6 automated Observatory tests
- Runs actual security scanner against local server
- Validates grade and score
- Tests specific security headers
- Provides detailed results

```bash
cd api
npm test observatory.test.ts
```

### Run All Security Tests

```bash
cd api
npm test -- --grep "security|observatory"
```

## Best Practices

1. **Never disable security headers** in production
2. **Always test after deployment** with Observatory
3. **Monitor CSP violations** in production logs
4. **Keep Helmet up to date** for latest security patches
5. **Review headers quarterly** as security best practices evolve

## Related Documentation

- [Security Overview](overview.md)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [Helmet Documentation](https://helmetjs.github.io/)
- [CSP Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

