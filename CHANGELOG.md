# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2025-11-04

### Added
- **CSV Bulk User Import** - Import multiple users at once with preview and validation
  - New API endpoint: `POST /admin/users/import` with dry-run mode
  - CSV parser with comprehensive validation (email, name, homeTeam, role)
  - Preview mode shows which users will be created/updated before committing
  - Detailed error reporting per row with line numbers
  - Automatic team membership creation for homeTeam + General team
  - Audit logging for all imports
  - Frontend upload UI with file picker, preview table, and error display
  - Summary statistics: total, valid, errors, to create, to update
- **Admin User Management UI Overhaul** - Complete redesign for scalability
  - New table view replacing inefficient card-based layout
  - Pagination (20 users per page) for large user bases
  - Search/filter across email, name, and team
  - Displays all team memberships with roles inline
  - Shows user activity (questions, upvotes) at a glance
  - Sortable columns for efficient management
  - "Import CSV" button integrated into user management header
- **Welcome Email** - Automatic welcome email on first user creation
  - New `WelcomeEmail` React Email template
  - Sent automatically when new demo users are created
  - Includes home team info, getting started guide, and dashboard link
  - Non-blocking (doesn't fail authentication if email fails)
  - Beautiful HTML email with feature overview and call-to-action

### Changed
- **User Management Scalability** - Can now handle 100+ users efficiently
  - Moved from card-based to table-based layout
  - Added pagination to prevent performance issues
  - Improved search to filter across all relevant fields
  - Removed complex inline role editing (deferred to v0.5.0)

### Technical
- Added `csv-parse` package for reliable CSV parsing
- New email template system using `renderWelcomeEmail()` helper
- Email sending integrated into demo auth strategy
- Frontend API client method `importUsers(csvData, dryRun)`
- Comprehensive Zod validation for import responses
- CSV format: `email,name,homeTeam,role` (header row required)

### Documentation
- Created `working-docs/2025-11-03_competitive-analysis-user-management.md`
  - Analyzed Culture Amp, Lattice, Officevibe, 15Five, TINYpulse, Slido
  - Validated admin-only team management approach
  - Confirmed CSV import as table stakes feature
  - Identified anonymous Q&A + pulse + org structure as unique differentiator

### Deferred to v0.5.0
- **Admin Team Management UI improvements** (bulk member operations, advanced search)
  - Focus on user management first; team management already functional
  - Will add bulk operations and improved member UI in next release
- **HRIS Integration** (BambooHR, Workday, etc.)
  - Not needed until customers have 100+ employees
  - CSV import satisfies current demand
- **SCIM Provisioning** (Okta, Azure AD)
  - Enterprise-tier feature for future
  - Will add when closing large enterprise deals

### Notes
- This is a **MINOR version bump** (new features, no breaking changes)
- All 336+ tests passing
- CSV import supports upsert (create new users or update existing)
- Welcome emails only sent once (on user creation)
- Frontend validates CSV before sending to backend
- Backend validates CSV twice (dry-run preview, then commit)

---

## [0.3.0] - 2025-11-03

### Changed
- **BREAKING: Team membership model** - Realistic team assignments (users no longer auto-added to all teams)
  - Seed data now assigns users to 1-3 relevant teams based on role
  - Admin users: All teams with admin role
  - Moderator users: Multiple teams with moderator role
  - Regular users: Primary team + General team
  - Alice (Engineering) also member of Product for cross-functional example
- **Simplified profile UX** - Removed duplicate "Favorite Teams" tab
  - All team management now in single "Overview" tab
  - Favorites shown inline with star indicators on team cards
  - Home team indicator (🏠) replaces verbose badge display
- **Team selector improvements** - Shows only user's team memberships (not all tenant teams)
  - Cleaner dropdown with relevant teams only
  - Sorting priority: Home team → Favorites → Alphabetical
  - Removed "Set as default team" button (deprecated)
- **Removed `defaultTeamId` concept** - Fully unified with "Home Team"
  - `SmartRedirect` now uses only `primaryTeam` → fallback
  - Removed default team indicators from UI
  - Removed set-default actions from team selector
- **Favorite constraints** - Can only favorite teams you're a member of
  - Frontend validation prevents favoriting non-member teams
  - Aligns with "teams as organizational units" principle

### Added
- **Team membership analysis** - Documented overlapping preference systems
  - Created `working-docs/2025-11-03_team-membership-model-analysis.md`
  - Analyzed Home Team vs Team Memberships vs Favorites
  - Recommended "Option A: Simplified Model" (implemented)

### Technical Notes
- This is a **MINOR version bump** because the changes affect demo data structure, not core functionality
- All 336 tests passing with new membership logic
- Complete backward compatibility for production deployments (no database migration needed)
- Users keep their existing memberships; seed data changes only affect fresh installations

---

## [0.2.0] - 2025-11-03

### Added
- **Team-First Architecture Enforcement**: All users now MUST have a `primaryTeamId`
- New "General" team automatically created for all tenants as default primary team
- New API endpoint: `PATCH /users/me/primary-team` - Update user's primary team
- New API endpoint: `GET /users/me/available-teams` - Get teams available for selection
- New OnboardingPage component (`/onboarding`) for users to select their primary team
- Utility function `getOrCreateGeneralTeam()` for consistent team creation across codebase
- Helper function `createTestUser()` for simplified test user creation with primary team
- Migration script `migrate-require-primary-team.ts` for existing deployments
- **Home Team UI** (Phase 1 of "Option C" simplification):
  - "🏠 Home" badge in TeamSelector dropdown showing user's home team
  - Home team display in ProfilePage header with "Change home team" link
  - "Change Home Team" option in user profile dropdown menu
  - Home teams sort first in team selector (priority: home > favorites > default > alphabetical)
  - OnboardingPage rebranded as "Choose Your Home Team" with improved UX messaging
  - `/users/me` API endpoint now includes `primaryTeam` object in response

### Changed
- **BREAKING (Internal)**: `primaryTeamId` is now a required field in the database schema
  - All user creation must provide a primary team
  - Migration script automatically assigns General team to existing users without primary team
- Updated all user creation flows (OAuth, demo mode, mock SSO, seeding) to assign primary team
- Updated all test files to use new `createTestUser` helper ensuring primary team assignment
- Fixed test cleanup order: users deleted before teams to respect foreign key constraints
- Seed data now includes "General" team alongside Engineering and Product teams
- **Navigation Priority**: `SmartRedirect` now uses home team (primaryTeam) first, then defaultTeam, then fallback
  - Prepares for future deprecation of `defaultTeamId` in favor of unified "Home Team" concept

### Fixed
- Tenant isolation violation in `/users/me/questions` endpoint (missing `tenantId` filter)
- Foreign key constraint violations in test cleanup when deleting teams before users
- Dashboard "Your Activity" panel now updates correctly after submitting/upvoting questions

### Documentation
- Created `working-docs/2025-11-03_team-preferences-analysis.md`:
  - Analysis of three overlapping team preference systems (primaryTeam, defaultTeam, favoriteTeams)
  - Recommended "Option C": Merge primaryTeam + defaultTeam as unified "Home Team"
  - Phase 1 (this release): Make primaryTeam visible and functional as "Home Team"
  - Phase 2 (planned v0.3.0): Deprecate `defaultTeamId` in favor of "Home Team"

### Technical Notes
- This is a **MINOR version bump** because while the database schema changed, it's not breaking for end users
- All 336 tests passing with new schema enforcement
- Complete backward compatibility through automatic General team assignment
- Migration path provided for existing deployments

---

## [0.1.1] - 2025-11-03

### Added
- **Dashboard Metrics Implementation**: Complete "Your Activity" card functionality
  - New API endpoint: `GET /users/me/upvotes/count` - Returns count of questions user has upvoted
  - New frontend API method: `getMyUpvoteCount()` with Zod schema validation
  - Dashboard now fetches both "Questions Asked" and "Questions Upvoted" metrics in parallel
  - Added `location.pathname` dependency to dashboard `useEffect` for navigation-based refresh

### Fixed
- Tenant isolation violation in `/users/me/questions` endpoint (missing `tenantId` filter)
- Dashboard not refreshing "Your Activity" stats after submitting/upvoting questions
- API Docker container not picking up new endpoint changes (now rebuilds with `--build` flag)

### Documentation
- Updated `working-docs/2025-11-02_dashboard_metrics_analysis.md` with implementation summary

### Technical Notes
- Dashboard metrics now fully functional across all login scenarios
- All 336 API tests passing
- Docker rebuild workflow validated for picking up TypeScript changes

---

## [0.1.0] - 2025-11-02

### Added
- Pre-flight validation system (`make preflight`) enforced before user testing
  - Validates Docker services, database, API health, frontend accessibility
  - E2E authentication flow testing with demo users
  - Seed data integrity validation (user count, question distribution, pulse responses)
  - Core API endpoint testing (`/users/me`, `/questions`, `/pulse/summary`, etc.)
  - Exit code 0 = ready to test, exit code 1 = critical failures
- Three new files for development workflow:
  - `api/scripts/preflight-check.ts` - Comprehensive validation script
  - `DEVELOPMENT_WORKFLOW.md` - Full development guide with troubleshooting
  - `QUICK_START.md` - Quick reference for common commands
- `.cursorrules` file created to enforce pre-flight workflow
- Memory system entry for mandatory pre-flight checks (ID: 10556978)

### Changed
- All user testing requests now require successful `make preflight` run
- Development workflow formalized with clear validation gates

### Technical Notes
- This establishes the foundation for preventing "site not running" and "can't login" issues
- Pre-flight checks are non-negotiable before user testing requests

---

## [0.0.1] - 2025-11-01

### Added
- Initial project setup
- Core Q&A system with team-scoped questions
- Pulse survey system with anonymity guarantees
- Multi-tenant architecture with subdomain-based routing
- Demo authentication mode for development
- Basic dashboard and analytics views
- Admin panel for tenant management
- Docker Compose development environment
- Comprehensive seed data for testing

### Technical Notes
- PostgreSQL database with Prisma ORM
- Express.js API server
- React frontend with Vite
- TypeScript throughout
- 336 API integration tests passing

---

## Version Format

PulseStage follows [Semantic Versioning](https://semver.org/):

- **MAJOR (X.0.0)**: Breaking changes (API, schema, config)
- **MINOR (0.X.0)**: New features, new endpoints, new config options
- **PATCH (0.0.X)**: Bug fixes, documentation, security patches

**Current Status**: Pre-1.0 (unstable API)
