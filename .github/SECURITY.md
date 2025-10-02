# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it by:

1. **DO NOT** open a public issue
2. Email the maintainers directly (or use GitHub Security Advisories)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Measures

This project implements several security measures:

### Code Security
- **SAST**: Semgrep scans on every PR
- **Dependency Scanning**: Trivy scans for known CVEs
- **Container Scanning**: Images scanned before deployment
- **Automated Updates**: Dependabot for dependency updates

### Runtime Security
- **Rate Limiting**: Redis-based rate limiting on sensitive endpoints
- **Admin Authentication**: API key protection for admin operations
- **CORS**: Configurable CORS policy
- **Input Validation**: Zod schema validation on all inputs

### Best Practices
- Minimal base images (Alpine Linux)
- Non-root container users (where applicable)
- Environment variable configuration
- Secrets not committed to repository
- Regular dependency updates

## Known Issues

Check the [Security tab](../../security) for any reported vulnerabilities and their status.

