# AMA App

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
├── api/                      # Backend API
│   ├── src/
│   │   ├── app.ts           # Express app (testable)
│   │   ├── server.ts        # Server startup
│   │   ├── env.ts           # Environment validation
│   │   ├── middleware/      # Express middleware
│   │   │   ├── adminAuth.ts # Admin key authentication
│   │   │   └── rateLimit.ts # Redis rate limiting
│   │   ├── test/
│   │   │   └── setup.ts     # Test configuration
│   │   └── app.test.ts      # API integration tests
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── vitest.config.ts     # Test configuration
│   └── Dockerfile
├── web/                      # Frontend application
│   ├── src/
│   │   ├── pages/           # React pages
│   │   ├── components/      # React components
│   │   └── lib/             # API client and utilities
│   ├── e2e/
│   │   └── happy-path.spec.ts # E2E tests
│   ├── playwright.config.ts # Playwright configuration
│   └── Dockerfile
├── docker-compose.yaml
├── env.example
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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. **Run tests and ensure coverage meets thresholds**
5. Submit a pull request

## License

[Your License Here]
