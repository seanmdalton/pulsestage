# AMA App

[![CI](https://github.com/seanmdalton/ama-app/actions/workflows/ci.yaml/badge.svg)](https://github.com/seanmdalton/ama-app/actions/workflows/ci.yaml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A comprehensive full-stack Ask Me Anything (AMA) application with **multi-team support**, built with Express, Prisma, PostgreSQL, Redis, React, and TypeScript.

**Perfect for organizations** - Features team-based question organization, admin management, session-based authentication, comprehensive search, and much more.

## ✨ Key Features

### 🏢 Multi-Team Organization
- **Team-based questions** - Organize questions by Engineering, Product, People, General teams
- **Team selector** - Easy switching between teams with question counts
- **Team management** - Admin panel for creating and managing teams
- **URL routing** - Shareable URLs like `/engineering/open` or `/product/answered`

### 💬 Question Management
- **Submit questions** - Anonymous question submission with team assignment
- **Real-time search** - Live search with fuzzy matching as you type
- **Upvote system** - Vote on questions you want answered (localStorage protection)
- **Question modals** - Full-screen viewing for long questions and answers
- **Status tracking** - Open and answered question states

### 👨‍💼 Admin Features
- **Session-based authentication** - Secure admin login with HTTP-only cookies
- **Admin panel** - Comprehensive dashboard for managing questions and teams
- **Response management** - Answer questions with rich text responses
- **Team administration** - Create, update, and manage teams

### 🎨 User Experience
- **Dark mode** - Toggle between light and dark themes (persistent)
- **Responsive design** - Works perfectly on desktop, tablet, and mobile
- **Weekly grouping** - Answered questions organized by week for better navigation
- **Loading states** - Smooth user experience with proper loading indicators

### 🔒 Security & Performance
- **Environment-aware rate limiting** - Disabled in development, enabled in production
- **Session management** - Redis-backed secure session storage
- **CORS protection** - Configurable cross-origin resource sharing
- **Input validation** - Comprehensive Zod schema validation

## 🛠 Tech Stack

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

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)

### 1. Clone and Setup
```bash
git clone https://github.com/seanmdalton/ama-app.git
cd ama-app
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

## 📋 Environment Configuration

```bash
# Database
DATABASE_URL=postgresql://app:app@db:5432/ama

# Admin Authentication
ADMIN_KEY=your-secure-random-string-here

# API Configuration
PORT=3000
NODE_ENV=development  # Disables rate limiting in development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Redis URL
REDIS_URL=redis://redis:6379
```

## 🏗 Project Structure

```
ama-app/
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

## 🗄 Database Schema

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

## 🔌 API Endpoints

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

### API Documentation
Interactive Swagger UI available at **http://localhost:3000/docs** with:
- Complete endpoint documentation
- Request/response schemas
- Try-it-out functionality
- Authentication examples

## 🧪 Testing

### API Tests (Vitest)
```bash
cd api
npm test                    # Run all tests
npm run test:coverage       # Run with coverage report
npm run test:watch          # Watch mode for development
```

**Coverage Requirements:**
- Lines: 45%
- Branches: 65%
- Functions: 75%
- Statements: 45%

**Test Coverage:**
- ✅ All API endpoints and middleware
- ✅ Session-based admin authentication
- ✅ Team management operations
- ✅ Question CRUD operations
- ✅ Search functionality
- ✅ Rate limiting behavior
- ✅ Input validation with Zod

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

## 🔒 Security Features

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

## 🚀 CI/CD Pipeline

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

## 📊 Test Data

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

## 🌐 Production Deployment

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
- `ghcr.io/seanmdalton/ama-app-api:latest`
- `ghcr.io/seanmdalton/ama-app-web:latest`

### Health Monitoring
- **Health endpoint**: `/health` for load balancer checks
- **API status indicator** in the frontend navbar
- **Comprehensive logging** for debugging

## 🤝 Contributing

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

## 📄 License

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

## 👨‍💻 Author

**Sean M. Dalton** - [seanmdalton@pm.me](mailto:seanmdalton@pm.me)

---

## 🎯 What Makes This Special

This AMA application goes beyond basic Q&A functionality:

- **🏢 Multi-team architecture** - Perfect for large organizations
- **🔍 Advanced search** - Real-time fuzzy search with debouncing
- **🎨 Modern UX** - Dark mode, responsive design, smooth interactions
- **🔒 Enterprise security** - Session-based auth, rate limiting, input validation
- **📊 Rich test data** - Comprehensive test scenarios for all features
- **🚀 Production ready** - Docker, CI/CD, security scanning, monitoring
- **📚 Complete documentation** - OpenAPI specs, interactive docs, comprehensive README

**Built for scale, designed for teams, ready for production.** 🚀