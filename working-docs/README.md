# Working Documents Directory

This directory contains **temporary analysis files, reports, and working documents** created during development.

## Purpose

- **Gap analysis reports** (like `DOCUMENTATION_GAPS.md`)
- **Audit reports** (code audits, security scans, etc.)
- **Planning documents** (feature specs, refactoring plans)
- **Temporary analysis** (performance reports, query analysis)
- **Meeting notes** (ephemeral notes that don't belong in handbook)

## Guidelines

### What Belongs Here

✅ **DO put here:**
- Analysis reports (gap analysis, code audits)
- Temporary planning documents
- Work-in-progress specs
- Investigation findings
- Refactoring plans
- Migration planning documents

❌ **DO NOT put here:**
- Permanent documentation (use `/handbook/` or `/docs/`)
- Code files
- Configuration files
- Test data
- Build artifacts

### Document Naming

Use descriptive, dated names:
```
YYYY-MM-DD_topic_type.md
```

**Examples:**
- `2025-01-15_documentation_gaps_analysis.md`
- `2025-01-20_performance_audit.md`
- `2025-02-01_migration_plan.md`
- `2025-02-10_security_review.md`

### Lifecycle

1. **Create**: AI or developer creates working doc during task
2. **Use**: Reference during development/discussion
3. **Archive or Delete**: 
   - Move insights to permanent docs (`/handbook/`, `/docs/`)
   - Delete after task complete (if no lasting value)
   - Keep for reference (if historical context useful)

### Git Policy

**This directory is git-ignored** (except this README).

**Rationale:**
- Working docs are ephemeral and specific to local development
- Prevents clutter in git history
- Allows developers to maintain their own working notes
- Important findings should be promoted to permanent docs

### Promoting to Permanent Documentation

When a working doc contains important information:

1. Extract the permanent insights
2. Add to appropriate handbook document:
   - `/handbook/` for product/architecture
   - `/docs/` for user-facing documentation
   - `.cursor/rules/` for development patterns
3. Delete or archive the working doc

## Example Workflow

### AI Creates Gap Analysis
```bash
# AI detects documentation gaps
working-docs/2025-01-15_documentation_gaps_analysis.md

# User reviews, approves fixes
# AI creates permanent docs in /handbook/

# Working doc served its purpose
rm working-docs/2025-01-15_documentation_gaps_analysis.md
```

### Developer Plans Refactor
```bash
# Developer creates plan
working-docs/2025-02-01_auth_refactor_plan.md

# Implements refactor
# Updates /handbook/AUTHENTICATION.md with final design

# Archives plan for future reference
mv working-docs/2025-02-01_auth_refactor_plan.md \
   working-docs/archive/2025-02-01_auth_refactor_plan.md
```

---

**This directory helps keep temporary work organized without polluting permanent documentation.**

