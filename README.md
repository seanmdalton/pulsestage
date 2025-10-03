# PulseStage

[![CI](https://github.com/seanmdalton/pulsestage/actions/workflows/ci.yaml/badge.svg)](https://github.com/seanmdalton/pulsestage/actions/workflows/ci.yaml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Coverage](https://img.shields.io/badge/Coverage-22%25-orange.svg)](https://github.com/seanmdalton/pulsestage/actions/workflows/ci.yaml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://docs.docker.com/compose/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io/)

**PulseStage** is an open-source platform designed to engage across your organization, providing all the functionality you need to capture, respond, and present questions. Built as a comprehensive full-stack Ask Me Anything (AMA) application with **multi-team support**, it promotes engagement, transparency, and trust among your teams.

**Perfect for organizations** - Features team-based question organization, admin management, role-based authentication, comprehensive search, and much more. PulseStage empowers teams to have meaningful conversations and build stronger connections through structured Q&A sessions.

## Key Features

### Multi-Team Organization
- **Team-based questions** - Organize questions by Engineering, Product, People, General teams
- **Team selector** - Easy switching between teams with question counts
- **Team management** - Admin panel for creating and managing teams
- **URL routing** - Shareable URLs like `/engineering/open` or `/product/answered`

### Question Management
- **Submit questions** - Anonymous question submission with team assignment
- **Real-time search** - Live search with fuzzy matching as you type
- **Upvote system** - Vote on questions you want answered (localStorage protection)
- **Question modals** - Full-screen viewing for long questions and answers
- **Status tracking** - Open and answered question states

### Admin Features
- **Session-based authentication** - Secure admin login with HTTP-only cookies
- **Admin panel** - Comprehensive dashboard for managing questions and teams
- **Response management** - Answer questions with rich text responses
- **Team administration** - Create, update, and manage teams
- **Tag system** - Create and manage tags for question organization
- **Presentation mode** - Full-screen presentation view for live AMAs
- **Data export** - Export questions with full metadata in CSV or JSON format

### Tags & Presentation System
- **Question tagging** - Add custom tags to questions for organization
- **Currently Presenting** - Special tag for live presentation tracking
- **Reviewed questions** - Mark questions as reviewed during presentations
- **Presentation mode** - Full-screen dark mode for live AMAs
- **Keyboard shortcuts** - Space/Enter to advance, H for highest, Esc to exit
- **Auto-filtering** - Hide reviewed questions from presentation queue

### SSO-Ready User Management
- **User profiles** - Complete user profile system with preferences and question history
- **Team memberships** - Role-based access control (member, admin, owner)
- **User preferences** - Favorite teams and default team selection
- **Mock SSO testing** - Local development SSO simulation for testing
- **Role-based admin access** - Admin privileges based on user roles, not separate login
- **My Questions** - Track and view all questions submitted by the user
- **User context** - Global user state management across the application

### User Experience
- **Dark mode** - Toggle between light and dark themes (persistent)
- **Responsive design** - Works perfectly on desktop, tablet, and mobile
- **Weekly grouping** - Answered questions organized by week for better navigation
- **Loading states** - Smooth user experience with proper loading indicators
- **Dynamic page titles** - Browser tab titles show current team and page context
- **Smart modals** - Different modal types for open vs answered questions

### Security & Performance
- **Environment-aware rate limiting** - Disabled in development, enabled in production
- **Session management** - Redis-backed secure session storage
- **CORS protection** - Configurable cross-origin resource sharing
- **Input validation** - Comprehensive Zod schema validation

## Tech Stack

### Backend
- **Node.js 20** with TypeScript
- **Express** - Web framework with middleware
- **Prisma** - Type-safe ORM for database access
- **PostgreSQL** - Primary database with migrations
- **Redis** - Session storage and rate limiting
- **Zod** - Runtime validation and type safety
- **Vitest** - API testing framework

### Frontend
- **Vite** - Lightning-fast build tool
- **React 19** - Modern UI framework with hooks
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Context API** - State management for teams, admin, and themes

### DevOps & Quality
- **Docker & Docker Compose** - Containerized development
- **GitHub Actions** - CI/CD pipeline
- **Semgrep** - Static Application Security Testing (SAST)
- **Trivy** - Vulnerability scanning
- **Playwright** - End-to-end testing (disabled in CI)
- **ESLint & Prettier** - Code quality and formatting

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)

### 1. Clone and Setup
```bash
git clone https://github.com/seanmdalton/pulsestage.git
cd pulsestage
cp env.example .env
# Edit .env to set your ADMIN_KEY
```

### 2. Start Services
```bash
docker compose up -d
```

### 3. Access the Application
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health

### 4. Load Test Data
```bash
cd api
DATABASE_URL="postgresql://app:app@localhost:5432/ama" node load-comprehensive-test-data.js
```

This loads 88 realistic questions across all teams with answers, upvotes, and historical dates.

### 5. Test SSO Features (Optional)
For testing user management and role-based features locally:

1. **Access Mock SSO Page**: Navigate to http://localhost:5173/sso-test.html
2. **Select Test User**: Choose from John Doe (admin), Jane Smith (member), or Bob Wilson (owner)
3. **Test User Features**: 
   - User profile with question history
   - Team favorites and default team selection
   - Role-based admin access (no separate admin login needed)
   - Team membership and preferences

**Mock Users Available:**
- **John Doe** (john.doe@company.com) - Admin role in Test Team
- **Jane Smith** (jane.smith@company.com) - Member role in Test Team  
- **Bob Wilson** (bob.wilson@company.com) - Owner role in Test Team

## Environment Configuration

```bash
# Database
DATABASE_URL=postgresql://app:app@db:5432/ama

# Admin Authentication
ADMIN_KEY=your-secure-random-string-here

# API Configuration
PORT=3000
NODE_ENV=development  # Disables rate limiting in development, exposes swagger UI

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Redis URL
REDIS_URL=redis://redis:6379

# Website Configuration
# This title appears in the browser tab and page titles
WEBSITE_TITLE=PulseStage

# Mock SSO Configuration (Development Only)
# Set to 'development' to enable mock SSO authentication
NODE_ENV=development
```

## Project Structure

```
pulsestage/
├── api/                          # Backend API
│   ├── src/
│   │   ├── app.ts               # Express app with all routes
│   │   ├── server.ts            # Server startup
│   │   ├── middleware/          # Authentication, rate limiting, sessions
│   │   │   ├── adminAuth.ts     # Admin authentication
│   │   │   ├── adminSession.ts  # Session-based admin auth
│   │   │   ├── rateLimit.ts     # Redis rate limiting
│   │   │   └── session.ts       # Session middleware
│   │   ├── test/               # API tests
│   │   └── seed-teams.ts       # Team seeding
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema with Teams
│   │   └── migrations/         # Database migrations
│   ├── load-comprehensive-test-data.js  # Test data loader
│   ├── openapi.yaml           # API documentation
│   └── Dockerfile
├── web/                        # Frontend React app
│   ├── src/
│   │   ├── pages/             # Route components
│   │   │   ├── SubmitPage.tsx
│   │   │   ├── OpenQuestionsPage.tsx
│   │   │   ├── AnsweredQuestionsPage.tsx
│   │   │   ├── AdminPage.tsx
│   │   │   └── AdminLoginPage.tsx
│   │   ├── components/        # Reusable components
│   │   │   ├── Navbar.tsx
│   │   │   ├── TeamSelector.tsx
│   │   │   ├── TeamManagement.tsx
│   │   │   ├── QuestionModal.tsx
│   │   │   ├── AnswerModal.tsx
│   │   │   ├── ResponseModal.tsx
│   │   │   ├── SearchResults.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── contexts/          # React Context providers
│   │   │   ├── AdminContext.tsx
│   │   │   ├── TeamContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/             # Custom hooks
│   │   │   ├── useDebounce.ts
│   │   │   └── useTeamFromUrl.ts
│   │   ├── lib/
│   │   │   ├── api.ts         # API client with Zod validation
│   │   │   └── api-types.ts   # Generated TypeScript types
│   │   └── utils/
│   │       └── dateUtils.ts   # Date utilities for weekly grouping
│   └── Dockerfile
├── docker-compose.yaml        # Multi-service orchestration
├── env.example               # Environment template
├── LICENSE                   # Apache 2.0 license
├── NOTICE                    # Third-party attribution
└── README.md
```

## Database Schema

```prisma
model Team {
  id          String     @id @default(uuid())
  name        String
  slug        String     @unique
  description String?
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  questions   Question[]
}

model Question {
  id           String         @id @default(uuid())
  body         String
  upvotes      Int            @default(0)
  status       QuestionStatus @default(OPEN)
  responseText String?
  respondedAt  DateTime?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  teamId       String?
  team         Team?          @relation(fields: [teamId], references: [id], onDelete: SetNull)
}

enum QuestionStatus {
  OPEN
  ANSWERED
}
```

## API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `GET /teams` - List all active teams
- `GET /teams/:slug` - Get team by slug
- `GET /questions?status=open|answered&teamId=uuid` - List questions (optionally filtered by team)
- `GET /questions/search?q=query&teamId=uuid` - Search questions
- `POST /questions` - Submit a question
- `POST /questions/:id/upvote` - Upvote a question

### Admin Endpoints (Session Authentication Required)
- `POST /admin/login` - Admin login
- `POST /admin/logout` - Admin logout
- `GET /admin/status` - Check admin session status
- `POST /teams` - Create a new team
- `PUT /teams/:id` - Update a team
- `DELETE /teams/:id` - Deactivate a team (soft delete)
- `POST /questions/:id/respond` - Answer a question
- `GET /tags` - List all tags
- `POST /tags` - Create a new tag
- `POST /questions/:id/tags` - Add tag to question
- `DELETE /questions/:id/tags/:tagId` - Remove tag from question
- `GET /admin/export/preview` - Preview export data with filters
- `GET /admin/export/download` - Download export data (CSV/JSON)
- `GET /users/me` - Get current user profile
- `GET /users/me/questions` - Get user's submitted questions
- `GET /users/me/teams` - Get user's team memberships
- `PUT /users/me/preferences` - Update user preferences
- `POST /users/me/teams/:teamId/favorite` - Toggle team favorite status

### API Documentation
Interactive Swagger UI available at **http://localhost:3000/docs** with:
- Complete endpoint documentation
- Request/response schemas
- Try-it-out functionality
- Authentication examples
- **New User Management endpoints** - `/users/me/*` for profile, questions, teams, and preferences
- **Mock SSO authentication** - Development-only SSO simulation for testing

## Testing

### API Tests (Vitest)
```bash
cd api
npm test                    # Run all tests
npm run test:coverage       # Run with coverage report
npm run test:watch          # Watch mode for development
```

**Coverage Requirements:**
- Lines: 20%
- Branches: 60%
- Functions: 50%
- Statements: 20%

**Test Coverage:**
- ✅ All API endpoints and middleware
- ✅ Session-based admin authentication
- ✅ Team management operations
- ✅ Question CRUD operations
- ✅ Search functionality
- ✅ Rate limiting behavior
- ✅ Input validation with Zod
- ✅ Tag management operations
- ✅ Presentation mode functionality

### End-to-End Tests (Playwright)
```bash
cd web
npm run test:e2e           # Run tests headless
npm run test:e2e:headed    # Run with visible browser
npm run test:e2e:ui        # Run with Playwright UI
```

**E2E Test Scenarios:**
- ✅ Complete user journey across all pages
- ✅ Team switching and URL routing
- ✅ Question submission and upvoting
- ✅ Admin authentication and question answering
- ✅ Search functionality
- ✅ Dark mode toggle
- ✅ Responsive design validation

## Security Features

### Authentication & Sessions
- **Session-based admin auth** - HTTP-only cookies with secure session storage
- **Session expiration** - Configurable session timeout
- **CSRF protection** - SameSite cookie attributes
- **Environment-aware** - Different security levels for dev/prod

### Rate Limiting
- **Environment-aware** - Disabled in development (`NODE_ENV=development`)
- **Redis-backed** - Distributed rate limiting
- **IP-based** - Per-IP request limits
- **Configurable** - Customizable limits per endpoint

### Input Validation
- **Zod schemas** - Runtime validation for all inputs
- **Type safety** - Full TypeScript coverage
- **SQL injection protection** - Prisma ORM with parameterized queries
- **XSS protection** - Input sanitization and CSP headers

## CI/CD Pipeline

### GitHub Actions Workflow (`.github/workflows/ci.yaml`)

**Triggers:** Push to main, pull requests

**Jobs:**
1. **API Tests** ✅ - Vitest with coverage reporting
2. **Security Scanning** ✅ - Semgrep SAST analysis
3. **Dependency Scanning** ✅ - Trivy vulnerability scanning
4. **Container Scanning** ✅ - Trivy image vulnerability scanning
5. **Build & Push** ✅ - Docker image builds to GHCR
6. **CI Summary** ✅ - PR status summary

**Artifacts Generated:**
- API test coverage reports
- Security scan results (SARIF)
- Vulnerability scan reports
- Container scan results

### Dependabot Configuration
- **Automated dependency updates** for npm packages
- **Docker base image updates**
- **GitHub Actions updates**
- **Grouped updates** to reduce PR noise

## Test Data

The application includes a comprehensive test data script that loads:
- **4 teams**: Engineering, Product, People, General
- **88 questions** with realistic content
- **47 answered questions** with detailed responses
- **41 open questions** awaiting answers
- **Varied upvote counts** (3-25) showing engagement
- **Historical dates** spanning 35 days for weekly grouping

**Load test data:**
```bash
cd api
DATABASE_URL="postgresql://app:app@localhost:5432/ama" node load-comprehensive-test-data.js
```

## Presentation Mode

The application includes a full-screen presentation mode for live Q&A sessions:

### Features
- **Full-screen dark mode** optimized for projectors and large displays
- **Large fonts** for visibility from a distance
- **Keyboard shortcuts** for easy navigation:
  - `Space` or `Enter` - Advance to next question
  - `H` - Jump to highest upvoted unreviewed question
  - `Esc` - Exit presentation mode
- **Tag management** - Automatic tagging of "Currently Presenting" and "Reviewed" questions
- **Auto-filtering** - Reviewed questions are hidden from future presentations

### Usage
1. **Access**: Available from any open questions page when logged in as admin
2. **Navigation**: Use keyboard shortcuts or on-screen buttons
3. **Question tracking**: Questions are automatically tagged as "Currently Presenting" and "Reviewed"
4. **Exit**: Press `Esc` or click the exit button to return to normal view

### URL Structure
- Team-specific: `/{teamSlug}/open/present`
- All teams: `/all/open/present`

## Data Export

The application provides comprehensive data export capabilities for admins:

### Export Features
- **Multiple formats** - CSV for spreadsheet analysis, JSON for programmatic use
- **Advanced filtering** - Filter by team, status, date range, upvotes, tags, and response status
- **Full metadata** - Export includes all question data, team information, tags, and timestamps
- **Preview functionality** - Preview export data before downloading
- **Large export handling** - Warning system for exports with 1000+ questions

### Export Data Includes
- Question ID, body, upvotes, status
- Response text and timestamps
- Team information (ID, name, slug)
- All associated tags with metadata
- Creation and update timestamps
- All internal IDs for potential re-importing

### Usage
1. **Access**: Admin Panel → Export Tab
2. **Filter**: Use the filter panel to select your data
3. **Preview**: See sample data and total count
4. **Download**: Click CSV or JSON to download

### Export Formats

**CSV Format:**
```csv
id,body,upvotes,status,responseText,respondedAt,createdAt,updatedAt,teamId,teamName,teamSlug,tags
```

**JSON Format:**
```json
{
  "exportedAt": "2025-10-02T23:01:52.897Z",
  "filters": {...},
  "totalCount": 88,
  "questions": [...]
}
```

## Production Deployment

### Environment Variables for Production
```bash
NODE_ENV=production          # Enables rate limiting
ADMIN_KEY=secure-random-key  # Strong admin authentication key
CORS_ORIGIN=https://yourdomain.com  # Production frontend URL
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://redis-host:6379
```

### Docker Images
Images are automatically built and pushed to GitHub Container Registry:
- `ghcr.io/seanmdalton/pulsestage-api:latest`
- `ghcr.io/seanmdalton/pulsestage-web:latest`

### Health Monitoring
- **Health endpoint**: `/health` for load balancer checks
- **API status indicator** in the frontend navbar
- **Comprehensive logging** for debugging

## Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper TypeScript types
4. **Run tests**: Ensure all tests pass and coverage meets thresholds
5. **Commit changes**: Use conventional commit messages
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Submit pull request**: CI will automatically run all checks

### Development Guidelines
- **TypeScript**: Full type safety required
- **Testing**: New features must include tests
- **Documentation**: Update README for new features
- **Code style**: ESLint and Prettier configured
- **Security**: Follow security best practices

## License

Copyright 2025 Sean M. Dalton

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

---

## Branding & Design

PulseStage features a modern, professional brand identity designed for enterprise use:

### Brand Colors
- **Dark Background**: `#0B1221` - Deep blue-black for professional appearance
- **Accent (Pulse)**: `#00B3A4` - Teal/cyan for highlights and interactive elements
- **Light Text**: `#F9FAFB` - Near white for readability on dark backgrounds
- **Dark Text**: `#0B1221` - Matching dark background for light mode

### Brand Assets
- **Logo**: Available in light/dark variants (SVG format)
- **Icons**: Multiple sizes (16px to 512px) for various use cases
- **Favicon**: Custom PulseStage favicon for browser tabs
- **Wordmark**: Full PulseStage wordmark for headers and branding

### Usage Guidelines
- Use **dark icon** on light backgrounds and vice versa
- Prefer **SVG format** for web and print applications
- Use **PNG format** for favicons and app icons
- Maintain **consistent spacing** around brand elements

## What Makes This Special

PulseStage goes beyond basic Q&A functionality:

- **Multi-team architecture** - Perfect for large organizations
- **Advanced search** - Real-time fuzzy search with debouncing
- **Modern UX** - Dark mode, responsive design, smooth interactions
- **Enterprise security** - Session-based auth, rate limiting, input validation
- **Rich test data** - Comprehensive test scenarios for all features
- **Production ready** - Docker, CI/CD, security scanning, monitoring
- **Complete documentation** - OpenAPI specs, interactive docs, comprehensive README

**Built for scale, designed for teams, ready for production.**