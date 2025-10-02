# AMA App

[![CI](https://github.com/seanmdalton/ama-app/actions/workflows/ci.yaml/badge.svg)](https://github.com/seanmdalton/ama-app/actions/workflows/ci.yaml)

A full-stack Ask Me Anything (AMA) application built with Express, Prisma, PostgreSQL, Redis, React, and TypeScript.

## Features

- **Submit Questions**: Users can submit anonymous questions
- **Upvote Questions**: Vote on questions you want answered (with localStorage protection against duplicate votes)
- **Admin Panel**: Protected admin interface to respond to questions
- **Rate Limiting**: Redis-based rate limiting to prevent abuse
- **Admin Authentication**: Secure admin key protection for sensitive operations

## Tech Stack

### Backend
- **Node.js 20** with TypeScript
- **Express** - Web framework
- **Prisma** - ORM for database access
- **PostgreSQL** - Primary database
- **Redis** - Rate limiting and caching
- **Zod** - Runtime validation

### Frontend
- **Vite** - Build tool
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)

### Environment Variables

Copy `env.example` to `.env` and configure the following variables:

```bash
# Database
DATABASE_URL=postgresql://app:app@db:5432/ama

# Admin Authentication (IMPORTANT: Change in production!)
ADMIN_KEY=your-secure-random-string-here

# API Configuration
PORT=3000

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Redis URL
REDIS_URL=redis://redis:6379
```

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ama-app
   ```

2. **Set up environment variables** (optional, defaults work for development)
   ```bash
   cp env.example .env
   # Edit .env and set your ADMIN_KEY
   ```

3. **Start all services**
   ```bash
   docker compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - API: http://localhost:3000
   - Health check: http://localhost:3000/health

### Local Development

#### API Development
```bash
cd api
npm install
npm run dev
```

#### Frontend Development
```bash
cd web
npm install
npm run dev
```

## API Documentation

### Interactive Documentation (Swagger UI)

The API includes a fully interactive OpenAPI documentation available at:

**http://localhost:3000/docs** (when running in development mode)

The Swagger UI provides:
- ✅ Complete API endpoint documentation
- ✅ Request/response schemas with examples
- ✅ Try-it-out functionality for testing endpoints
- ✅ Authentication information for protected endpoints

### Generating TypeScript Types

The frontend uses automatically generated TypeScript types from the OpenAPI specification:

```bash
# From the root directory
npm run openapi:gen

# Or from the web directory
cd web && npm run openapi:gen
```

This generates `web/src/lib/api-types.ts` with fully typed API interfaces.

## API Endpoints

### Public Endpoints

- `GET /health` - Health check
- `GET /questions?status=open|answered` - List questions
- `POST /questions` - Submit a question (rate limited: 10/min per IP)
  ```json
  {
    "body": "Your question here"
  }
  ```
- `POST /questions/:id/upvote` - Upvote a question (rate limited: 10/min per IP)

### Protected Endpoints (Require `x-admin-key` header)

- `POST /questions/:id/respond` - Respond to a question
  ```json
  {
    "response": "Your answer here"
  }
  ```
  Headers: `x-admin-key: your-admin-key`

## Security Features

### Rate Limiting
- **POST /questions**: Maximum 10 requests per minute per IP
- **POST /questions/:id/upvote**: Maximum 10 requests per minute per IP
- Implemented using Redis for distributed rate limiting

### Admin Authentication
- All admin operations require a valid `x-admin-key` header
- Admin key is configured via the `ADMIN_KEY` environment variable
- Returns 401 Unauthorized for invalid or missing keys

### CORS
- Configurable origin via `CORS_ORIGIN` environment variable
- Default: `http://localhost:5173` for development
- Set to your production domain in production

## Project Structure

```
ama-app/
├── api/                        # Backend API
│   ├── src/
│   │   ├── app.ts             # Express app (testable)
│   │   ├── server.ts          # Server startup
│   │   ├── env.ts             # Environment validation
│   │   ├── middleware/        # Express middleware
│   │   │   ├── adminAuth.ts   # Admin key authentication
│   │   │   └── rateLimit.ts   # Redis rate limiting
│   │   ├── test/
│   │   │   └── setup.ts       # Test configuration
│   │   └── app.test.ts        # API integration tests
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── openapi.yaml           # OpenAPI 3.0 specification
│   ├── vitest.config.ts       # Test configuration
│   └── Dockerfile
├── web/                        # Frontend application
│   ├── src/
│   │   ├── pages/             # React pages
│   │   ├── components/        # React components
│   │   └── lib/               # API client and utilities
│   │       ├── api.ts         # API client with Zod validation
│   │       └── api-types.ts   # Generated TypeScript types
│   ├── e2e/
│   │   └── happy-path.spec.ts # E2E tests
│   ├── playwright.config.ts   # Playwright configuration
│   └── Dockerfile
├── docker-compose.yaml
├── env.example
├── package.json               # Root scripts (openapi:gen)
└── README.md
```

## Database Schema

```prisma
model Question {
  id           String         @id @default(uuid())
  body         String
  upvotes      Int            @default(0)
  status       QuestionStatus @default(OPEN)
  responseText String?
  respondedAt  DateTime?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
}

enum QuestionStatus {
  OPEN
  ANSWERED
}
```

## Testing

### API Tests (Vitest)

The API has comprehensive unit and integration tests using Vitest and Supertest.

**Run tests:**
```bash
cd api
npm test                    # Run all tests
npm run test:coverage       # Run with coverage report
npm run test:watch          # Watch mode for development
```

**Coverage Requirements:**
- Lines: 80%
- Branches: 80%
- Functions: 80%
- Statements: 80%

**What's Tested:**
- ✅ All API endpoints (GET, POST)
- ✅ Request validation (Zod schemas)
- ✅ Admin authentication
- ✅ Error handling (404, 401, 400)
- ✅ Rate limiting behavior
- ✅ Question status filtering
- ✅ Upvote functionality

**Test Database:**
Tests use an ephemeral PostgreSQL database (`ama_test`) that is automatically set up and cleaned between tests.

### E2E Tests (Playwright)

End-to-end tests verify the complete user journey using Playwright.

**Run E2E tests:**
```bash
cd web
npm run test:e2e           # Run tests headless
npm run test:e2e:headed    # Run with visible browser
npm run test:e2e:ui        # Run with Playwright UI
```

**Test Scenarios:**
- ✅ Complete happy path: submit → open → upvote → admin respond → answered
- ✅ Upvote button localStorage guard (prevents duplicate votes)
- ✅ Admin key authentication
- ✅ Health check indicator

**Prerequisites:**
- Docker services must be running (`docker compose up`)
- API must be accessible at `http://localhost:3000`
- Frontend must be accessible at `http://localhost:5173`

### Running All Tests

```bash
# Start services
docker compose up -d

# Run API tests
cd api && npm test

# Run E2E tests
cd web && npm run test:e2e
```

## CI/CD Pipeline

### GitHub Actions Workflows

The project includes comprehensive CI/CD automation:

#### **CI Pipeline** (`.github/workflows/ci.yaml`)

**Runs on**: Every push to `main` and all pull requests

**Jobs:**
1. **API Tests**
   - Runs Vitest tests with PostgreSQL service
   - Generates coverage report (80% threshold)
   - Uploads coverage artifacts

2. **E2E Tests**
   - Starts full stack with Docker Compose
   - Runs Playwright tests
   - Uploads test reports

3. **Semgrep SAST**
   - Security scanning with `p/ci`, `p/typescript`, `p/nodejs` rulesets
   - Uploads results as artifacts
   - Non-blocking (reports only)

4. **Trivy Filesystem Scan**
   - Scans dependencies for vulnerabilities
   - Reports CRITICAL and HIGH severity issues
   - Uploads to GitHub Security tab

5. **Build & Scan Images**
   - Builds Docker images for `api` and `web`
   - Scans images with Trivy
   - Pushes to GHCR on main branch
   - Uploads scan results

6. **CI Summary**
   - Aggregates all job statuses
   - Generates markdown summary in PR

#### **Dependabot** (`.github/dependabot.yml`)

Automated dependency updates:
- **npm packages**: Weekly updates for `api/` and `web/`
- **Docker images**: Weekly base image updates
- **GitHub Actions**: Weekly action version updates
- Grouped minor/patch updates to reduce PR noise

### Security Features

**SAST (Static Analysis)**:
- Semgrep scans for security issues, bugs, and anti-patterns
- Results uploaded as artifacts

**Dependency Scanning**:
- Trivy scans for known CVEs in dependencies
- Results uploaded to GitHub Security tab (SARIF format)

**Container Scanning**:
- Trivy scans built images before pushing
- Blocks CRITICAL vulnerabilities (configurable)

### Artifacts

Each CI run generates:
- `api-coverage` - Test coverage HTML report
- `playwright-report` - E2E test results
- `semgrep-results` - SAST findings (JSON)
- `trivy-fs-results` - Filesystem vulnerability scan
- `trivy-api-image` - API image scan results
- `trivy-web-image` - Web image scan results

Artifacts retained for 30 days.

### Container Registry

Images are automatically pushed to GitHub Container Registry:
- `ghcr.io/YOUR_USERNAME/ama-app-api:latest`
- `ghcr.io/YOUR_USERNAME/ama-app-web:latest`
- Also tagged with branch name and commit SHA

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. **Run tests and ensure coverage meets thresholds**
5. Submit a pull request
6. **CI will automatically run** - ensure all checks pass

## License

[Your License Here]
