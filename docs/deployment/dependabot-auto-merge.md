# Dependabot Auto-Merge Configuration

This document explains how Dependabot is configured to automatically merge dependency updates in the PulseStage repository.

## Overview

Dependabot is configured to:
- **Check for updates weekly** (every Monday)
- **Only propose minor and patch updates** (no major version bumps)
- **Automatically merge PRs** when all CI tests pass
- **Group updates** by dependency type (development vs production)

## Configuration Files

### 1. Dependabot Updates (`.github/dependabot.yml`)

Defines what dependencies to check and update:

```yaml
version: 2
updates:
  # API dependencies (NPM)
  - package-ecosystem: "npm"
    directory: "/api"
    schedule:
      interval: "weekly"
      day: "monday"
    update-types:
      - "minor"  # Includes patch updates
      - "patch"
    
  # Web dependencies (NPM)
  - package-ecosystem: "npm"
    directory: "/web"
    # Same configuration as API
    
  # Docker images
  - package-ecosystem: "docker"
    directory: "/api"
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
    
  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
```

**Key Points:**
- ✅ Only minor and patch updates are allowed
- ❌ Major version updates are ignored (require manual review)
- 📦 Updates are grouped by dependency type (dev vs prod)

### 2. Auto-Merge Workflow (`.github/workflows/dependabot-auto-merge.yml`)

Uses the [ahmadnassri/action-dependabot-auto-merge](https://github.com/marketplace/actions/dependabot-auto-merge) action:

```yaml
name: Dependabot Auto-Merge

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    
    steps:
      - uses: ahmadnassri/action-dependabot-auto-merge@v2
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          target: minor
          approve: false
          command: squash
```

**Key Points:**
- ✅ Only runs for Dependabot PRs
- ✅ Waits for **all CI checks to pass** before merging (handled by Dependabot automatically)
- ✅ Only merges minor/patch updates (as configured)
- ✅ Uses squash merge to keep git history clean
- ⚠️ Does not auto-approve (would require a Personal Access Token)

## How It Works

### Workflow

1. **Monday Morning**: Dependabot checks for updates
2. **PR Created**: Dependabot opens a PR for each dependency group (dev/prod)
3. **CI Runs**: All CI checks run automatically:
   - API linting
   - Web linting
   - API tests with coverage
   - Semgrep security scan
   - Trivy vulnerability scan
   - Docker image builds and scans
4. **Auto-Merge Triggered**: If all checks pass, the auto-merge workflow runs
5. **Version Check**: The action verifies it's a minor/patch update
6. **Merge**: The PR is automatically merged with squash

### Safety Checks

The auto-merge workflow will **NOT** merge if:
- ❌ Any CI check fails
- ❌ The update is a major version bump
- ❌ Security scans find critical vulnerabilities
- ❌ The PR is not from Dependabot

## CI Pipeline (Required Checks)

All these checks must pass before auto-merge:

### Code Quality
- **API Linting**: ESLint + Prettier
- **Web Linting**: ESLint + Prettier

### Testing
- **API Tests**: Unit tests with coverage reporting

### Security
- **Semgrep SAST**: Static analysis for security issues
- **Trivy Filesystem**: Dependency vulnerability scanning
- **Trivy Image**: Docker image vulnerability scanning

### Build
- **Docker Builds**: API and Web images must build successfully

## Monitoring

### Check PR Status

View all Dependabot PRs:
```bash
gh pr list --author "dependabot[bot]"
```

### View Auto-Merge Workflow Runs

```bash
gh run list --workflow="Dependabot Auto-Merge"
```

### Manual Override

If you need to manually merge a Dependabot PR:
```bash
gh pr merge <PR_NUMBER> --squash
```

## Troubleshooting

### PRs Not Auto-Merging

**Check CI Status:**
```bash
gh pr checks <PR_NUMBER>
```

**Common Issues:**
1. **CI checks failing**: Review the CI logs
2. **Major version update**: These are blocked by design
3. **Security vulnerabilities**: Fix or acknowledge before merging

### Disable Auto-Merge Temporarily

Comment on the PR:
```
@dependabot ignore this minor version
```

Or for all updates to a specific dependency:
```
@dependabot ignore this dependency
```

## Advanced Configuration

### Using a Personal Access Token (PAT)

To enable auto-approval of PRs, you need a PAT with `repo` scope:

1. **Create a PAT**: Settings → Developer settings → Personal access tokens
2. **Add to Secrets**: Repository settings → Secrets → Actions → New secret
   - Name: `DEPENDABOT_PAT`
   - Value: Your PAT
3. **Update workflow**:
   ```yaml
   github-token: ${{ secrets.DEPENDABOT_PAT }}
   approve: true
   ```

### Custom Configuration File

For more granular control, create `.github/auto-merge.yml`:

```yaml
# Example: Different rules for different dependencies
- match:
    dependency_name: aws-sdk
    update_type: semver:minor

- match:
    dependency_type: development
    update_type: semver:minor

- match:
    dependency_type: production
    update_type: security:minor
```

See the [action documentation](https://github.com/marketplace/actions/dependabot-auto-merge) for more options.

## References

- [Dependabot Auto-Merge Action](https://github.com/marketplace/actions/dependabot-auto-merge)
- [Dependabot Configuration Options](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
- [GitHub Actions Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token)

