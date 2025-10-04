# CI Security Scanning

PulseStage implements comprehensive automated security scanning in our CI/CD pipeline to detect vulnerabilities before they reach production.

## Overview

Every push to `main` and every pull request triggers:

1. **Semgrep SAST** - Static code analysis
2. **Trivy Filesystem** - Dependency vulnerability scanning
3. **Trivy Image** - Docker image vulnerability scanning
4. **SBOM Generation** - Software Bill of Materials

**Fail Criteria**: Builds fail on **High** or **Critical** severity findings.

## Scanning Tools

### 1. Semgrep (SAST)

**What it scans**: Source code for security vulnerabilities and code quality issues

**Rulesets**:
- `p/ci` - CI/CD best practices
- `p/typescript` - TypeScript-specific security rules
- `p/nodejs` - Node.js security patterns
- `p/docker` - Dockerfile best practices
- `p/security-audit` - Security audit rules

**Severity Levels**:
- ERROR (High/Critical) - **Fails the build**
- WARNING (Medium) - Reported but doesn't fail
- INFO (Low) - Informational only

**Example Output**:
```
🔍 Semgrep SAST Results:
   High/Critical findings: 0
✅ No high/critical security issues found
```

### 2. Trivy Filesystem Scanner

**What it scans**: Dependencies in `package.json`, `package-lock.json`, and other manifest files

**Checks for**:
- Known CVEs in npm packages
- Outdated dependencies with security issues
- Transitive dependency vulnerabilities

**Severity Levels**:
- CRITICAL - **Fails the build**
- HIGH - **Fails the build**
- MEDIUM - Reported only
- LOW - Reported only

**Example Output**:
```
🔍 Trivy Filesystem Scan Results:
   High/Critical vulnerabilities: 2
❌ Found 2 high/critical vulnerabilities in dependencies
  - axios@0.21.1: Improper Input Validation (Severity: HIGH)
  - express@4.17.1: Information Exposure (Severity: MEDIUM)
```

### 3. Trivy Docker Image Scanner

**What it scans**: Built Docker images (`api` and `web`)

**Checks for**:
- Vulnerabilities in base images (node:20-alpine, etc.)
- Vulnerabilities in installed OS packages
- Known CVEs in all image layers

**Matrix Strategy**: Scans both `api` and `web` images separately

**Example Output**:
```
🔍 Trivy api Image Scan:
   High/Critical vulnerabilities: 0
✅ No high/critical vulnerabilities found in api image
```

### 4. SBOM Generation (Syft)

**What it generates**: Software Bill of Materials in two formats

**Formats**:
- **SPDX JSON** - Industry standard format
- **CycloneDX JSON** - OWASP standard format

**Retention**: 90 days

**Contents**:
- All packages and dependencies
- Version information
- License information
- Package relationships

**Example**:
```
📦 SBOM Generated for api
   Format: SPDX + CycloneDX JSON
   Total packages: 342
   Retention: 90 days
```

## Workflow Triggers

### Automatic Triggers

1. **Push to main** - Full scan on every merge
2. **Pull requests** - Scan before merge to catch issues early
3. **Daily schedule** - Runs at 2 AM UTC to catch newly disclosed CVEs

### Manual Trigger

You can manually trigger scans from GitHub Actions UI:
```
Actions → Security Scanning → Run workflow
```

## Viewing Results

### GitHub Security Tab

Trivy results are automatically uploaded to the GitHub Security tab:

```
Repository → Security → Code scanning
```

You'll see:
- All detected vulnerabilities
- Severity levels
- Affected files/packages
- Remediation guidance

### Artifacts

All scan results are uploaded as artifacts:

```
Actions → [Your workflow run] → Artifacts
```

Download:
- `semgrep-results` - Semgrep SAST findings (JSON)
- `trivy-fs-results` - Filesystem scan results (JSON)
- `trivy-api-image` - API image scan results (JSON)
- `trivy-web-image` - Web image scan results (JSON)
- `sbom-api` - API SBOM (SPDX + CycloneDX)
- `sbom-web` - Web SBOM (SPDX + CycloneDX)

### Workflow Summary

Each workflow run generates a summary visible in the workflow page:

```
🎯 CI Pipeline Results

Security Scanning
| Job                 | Status  |
|---------------------|---------|
| Semgrep SAST        | ✅ success |
| Trivy Filesystem    | ✅ success |
| Build & Scan Images | ✅ success |

📦 SBOM Artifacts
- API component (SPDX + CycloneDX)
- Web component (SPDX + CycloneDX)
```

## Local Testing

Run security scans locally before pushing:

### Semgrep

```bash
# Install Semgrep
pip install semgrep

# Run scan
semgrep --config=auto \
  --config=p/ci \
  --config=p/typescript \
  --config=p/nodejs \
  --severity=ERROR \
  --severity=WARNING
```

### Trivy Filesystem

```bash
# Install Trivy (macOS)
brew install aquasecurity/trivy/trivy

# Scan dependencies
trivy fs . --severity CRITICAL,HIGH
```

### Trivy Docker Images

```bash
# Build images first
docker compose build

# Scan API image
trivy image ama-app-api:latest --severity CRITICAL,HIGH

# Scan Web image
trivy image ama-app-web:latest --severity CRITICAL,HIGH
```

### Generate SBOM Locally

```bash
# Install Syft (macOS)
brew install syft

# Build image
docker compose build api

# Generate SBOM
syft ama-app-api:latest -o spdx-json=sbom-api.spdx.json
syft ama-app-api:latest -o cyclonedx-json=sbom-api.cyclonedx.json
```

## Handling Vulnerabilities

### When a Scan Fails

1. **Review the findings** in the workflow logs
2. **Assess the risk** - Is it a real vulnerability in your context?
3. **Remediate**:
   - Update dependencies: `npm update`
   - Fix code issues identified by Semgrep
   - Update base Docker images

### False Positives

If a finding is a false positive:

**Semgrep**: Add inline comment
```typescript
// nosemgrep: rule-id-here
const example = dangerousOperation();
```

**Trivy**: Add to `.trivyignore`
```
CVE-2021-12345  # False positive - not applicable
```

### Accepted Risks

Document accepted risks in:
- `.trivyignore` with justification
- Security documentation
- Architecture Decision Records (ADRs)

## Best Practices

1. **Fix vulnerabilities promptly** - Don't let them accumulate
2. **Review dependencies regularly** - Run `npm audit` locally
3. **Keep base images updated** - Update Node.js base image quarterly
4. **Monitor security advisories** - Subscribe to security mailing lists
5. **Test locally before pushing** - Catch issues early

## Configuration Files

- `.semgrepignore` - Patterns to exclude from Semgrep scans
- `.trivyignore` - CVEs to ignore (with justification)
- `.github/workflows/ci.yaml` - CI workflow configuration

## Related Documentation

- [Security Overview](overview.md)
- [Security Headers](security-headers.md)
- [RBAC](rbac.md)
- [Audit Logging](audit-logging.md)

