# Working Documents Rule

## Purpose
Maintain organization by using `/working-docs/` for temporary analysis and reports.

## When to Create Working Docs

### MUST Create in `/working-docs/`
AI assistants MUST use `/working-docs/` for:

1. **Gap Analysis**
   - Documentation audits
   - Feature audits
   - Code coverage analysis
   - Rule consistency checks

2. **Planning Documents**
   - Refactoring plans
   - Migration plans
   - Feature specifications (before implementation)
   - Architecture proposals (before ADR)

3. **Investigation Reports**
   - Performance analysis
   - Security audits
   - Dependency audits
   - Database query optimization

4. **Temporary Analysis**
   - Code complexity reports
   - Test coverage analysis
   - Bundle size analysis
   - Any analysis that informs permanent docs

### MUST NOT Put in `/working-docs/`
- Permanent documentation → `docs/handbook/` or `/docs/`
- Code files → appropriate `src/` directory
- Tests → `*.test.ts` or `*.spec.ts`
- Configuration → root or appropriate config directory
- User-facing docs → `/docs/`

## Naming Convention

**Format:** `YYYY-MM-DD_topic_type.md`

**Examples:**
```
working-docs/2025-01-15_documentation_gaps_analysis.md
working-docs/2025-01-20_performance_audit.md
working-docs/2025-02-01_auth_refactor_plan.md
working-docs/2025-02-10_dependency_security_review.md
```

**Rationale:** Date prefix enables chronological sorting and prevents naming conflicts.

## Lifecycle

### 1. Create
```markdown
# [Topic] Analysis/Report

**Date:** YYYY-MM-DD
**Purpose:** Brief description
**Status:** Draft | In Progress | Complete

## Findings
...

## Recommendations
...
```

### 2. Use
- Reference during development
- Share with user for feedback
- Guide implementation work

### 3. Promote or Archive

**Option A: Promote to Permanent Docs**
```bash
# Extract insights
# Add to docs/handbook/TOPIC.md or /docs/topic.md

# Delete working doc
rm working-docs/YYYY-MM-DD_topic_analysis.md
```

**Option B: Archive for History**
```bash
# If useful for future reference
mv working-docs/YYYY-MM-DD_topic_analysis.md \
   working-docs/archive/YYYY-MM-DD_topic_analysis.md
```

**Option C: Delete**
```bash
# If no lasting value
rm working-docs/YYYY-MM-DD_topic_analysis.md
```

## Git Behavior

**Git Ignores:**
- `working-docs/*` (all files)

**Git Tracks:**
- `working-docs/README.md` (explains directory)
- `working-docs/archive/.gitkeep` (preserves archive directory)

**Rationale:**
- Working docs are local/ephemeral
- Prevents git history clutter
- Developers can maintain personal notes
- Important findings promoted to permanent docs

## Examples

### Example 1: Gap Analysis (This Task)
```
Created: working-docs/2025-01-15_documentation_gaps_analysis.md
Used: Guided creation of 5 new handbook docs
Promoted: Insights moved to docs/handbook/
Deleted: rm working-docs/2025-01-15_documentation_gaps_analysis.md
```

### Example 2: Refactoring Plan
```
Created: working-docs/2025-02-01_auth_refactor_plan.md
Used: Guided refactoring over 2 weeks
Promoted: Final design to docs/handbook/AUTHENTICATION.md
Archived: mv to archive/ (useful for future reference)
```

### Example 3: Performance Audit
```
Created: working-docs/2025-02-10_performance_audit.md
Used: Identified slow queries
Promoted: Optimization tips to docs/handbook/OPERATIONS.md
Deleted: rm (findings captured in permanent docs)
```

## AI Assistant Workflow

When creating temporary analysis/reports:

```markdown
1. Check if content is temporary or permanent
   - Temporary → working-docs/
   - Permanent → docs/handbook/ or /docs/

2. Use naming convention
   working-docs/YYYY-MM-DD_topic_type.md

3. Create document with clear structure
   - Date, purpose, status
   - Findings, recommendations

4. After task complete, suggest next step
   "This analysis is now in working-docs/. 
    Would you like me to:
    a) Promote insights to docs/handbook/
    b) Archive for future reference
    c) Delete (if findings already captured)"
```

## Cross-References

- **Main rules**: `/.cursorrules` (Working Documents section)
- **Directory README**: `/working-docs/README.md`
- **Handbook structure**: `docs/handbook/README.md`

## Enforcement

AI assistants violate this rule if they:
- Create analysis/reports in project root
- Create `*-ANALYSIS.md`, `*-AUDIT.md`, `*-GAPS.md` outside `/working-docs/`
- Put temporary planning docs in `docs/handbook/`
- Forget to date working documents

**Correction:** Move to `/working-docs/` with proper naming.

