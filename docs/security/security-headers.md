# Security Headers

PulseStage implements comprehensive HTTP security headers using Helmet middleware to protect against common web vulnerabilities.

## Overview

PulseStage implements security headers at two levels:

1. **API (Backend)**: Helmet middleware applies headers to all API responses
2. **Web (Frontend)**: CSP meta tag and Nginx headers protect the SPA

Both implementations follow Mozilla Observatory best practices to achieve an A grade or higher.

## Implemented Headers

### Content-Security-Policy (CSP)

#### API CSP (Backend)

Strict Content Security Policy for API responses:

```
default-src 'self';
script-src 'self';
style-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

#### Frontend CSP (Web SPA)

The web frontend includes CSP via meta tag in `web/index.html`:

```html
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self'; 
           script-src 'self'; 
           style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
           font-src 'self' https://fonts.gstatic.com; 
           img-src 'self' data: https:; 
           connect-src 'self' https://*.pulsestage.app http://localhost:3000; 
           frame-ancestors 'none'; 
           base-uri 'self'; 
           form-action 'self'; 
           object-src 'none'; 
           upgrade-insecure-requests" />
```

**Why `'unsafe-inline'` for styles?**
- React components use dynamic inline styles for tag colors (`style={{ backgroundColor: tag.color }}`)
- Future enhancement: migrate to CSS custom properties to eliminate `'unsafe-inline'`
- This is the only relaxation from strict CSP and is acceptable for modern SPAs

**CSP Directives Explained:**
- `default-src 'self'`: Only load resources from same origin by default
- `script-src 'self'`: No inline scripts, only bundled JavaScript
- `style-src`: Self + Google Fonts + inline styles (for React dynamic styles)
- `font-src`: Self + Google Fonts CDN
- `img-src`: Self + data URIs + HTTPS images
- `connect-src`: API calls to configured domains + localhost (dev)
- `frame-ancestors 'none'`: Prevent clickjacking
- `upgrade-insecure-requests`: Auto-upgrade HTTP → HTTPS

#### Nginx CSP Headers (Production)

For production deployments with Nginx, add headers to your server block:

```nginx
# See docs/deployment/nginx-csp.conf for complete configuration
add_header Content-Security-Policy "..." always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
```

**Benefits of Nginx headers over meta tags:**
- Can use `frame-ancestors`, `report-uri`, and `sandbox` directives
- More control over CSP policies
- Can differ by environment

**Both work together:**
- Meta tag provides baseline CSP (works in all environments)
- Nginx headers enhance CSP for production (when available)

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

