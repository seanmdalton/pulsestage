# Contributing to PulseStage

Thank you for your interest in contributing to PulseStage! This document provides guidelines and instructions for contributing to our open-source Q&A platform.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Documentation](#documentation)
- [Reporting Issues](#reporting-issues)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [seanmdalton@pm.me](mailto:seanmdalton@pm.me).

## Getting Started

### Prerequisites

- **Node.js**: Version 24 LTS or higher
- **Docker & Docker Compose**: For running the full stack locally
- **Git**: For version control
- **npm**: Comes with Node.js

### Repository Structure

```
pulsestage/
├── api/                 # Backend API (Node.js/Express/TypeScript)
├── web/                 # Frontend (React/TypeScript)
├── docs/                # Documentation (MkDocs)
├── docker-compose.yaml  # Main Docker configuration
├── setup.sh            # Setup script
└── README.md           # Project overview
```

## Development Setup

### 1. Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/pulsestage.git
   cd pulsestage
   ```

### 2. Initial Setup

Run the setup script to install dependencies and prepare the environment:

```bash
./setup.sh
```

This script will:
- Install dependencies for both API and web applications
- Set up environment files
- Build Docker images
- Start the database and Redis services

### 3. Start Development Environment

```bash
# Start the full stack with Docker
docker compose up -d

# Or start services individually for development
docker compose up -d db redis
cd api && npm run dev &
cd web && npm run dev
```

### 4. Load Demo Data (Optional)

```bash
# Load demo data with Acme Corp tenant
docker compose exec api npm run db:seed:full
docker compose restart api
```

Visit [http://localhost:5173](http://localhost:5173) to see the application.

## Making Changes

### Branch Strategy

1. **Create a feature branch** from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Branch naming conventions**:
   - `feature/description` - New features
   - `fix/description` - Bug fixes
   - `docs/description` - Documentation updates
   - `refactor/description` - Code refactoring
   - `test/description` - Test improvements

### Development Workflow

1. **Make your changes** following our [coding standards](#coding-standards)
2. **Write tests** for new functionality
3. **Update documentation** if needed
4. **Run tests** to ensure everything works
5. **Commit your changes** with clear commit messages

### Environment Variables

Copy the example environment file and customize as needed:

```bash
cp env.example .env
```

Key environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SESSION_SECRET` - Session encryption key
- `CORS_ORIGIN` - Frontend URL for CORS

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run API tests only
cd api && npm test

# Run web tests only
cd web && npm test

# Run E2E tests
cd web && npx playwright test

# Run tests with coverage
cd api && npm run test:coverage
```

### Test Coverage

We aim for comprehensive test coverage:
- **API**: Currently at 47.31% coverage (214 tests passing)
- **Frontend**: Component and integration tests
- **E2E**: Critical user journeys with Playwright

### Writing Tests

- **Unit tests**: Test individual functions and components
- **Integration tests**: Test API endpoints and database interactions
- **E2E tests**: Test complete user workflows
- **Follow the AAA pattern**: Arrange, Act, Assert

## Pull Request Process

### Before Submitting

1. **Ensure tests pass**:
   ```bash
   npm test
   cd web && npx playwright test
   ```

2. **Check code quality**:
   ```bash
   cd api && npm run lint
   cd web && npm run lint
   ```

3. **Update documentation** if your changes affect:
   - API endpoints
   - User interface
   - Configuration
   - Installation process

### PR Guidelines

1. **Create a clear title** describing the change
2. **Write a detailed description**:
   - What changes were made
   - Why the changes were necessary
   - How to test the changes
   - Any breaking changes or migration steps

3. **Link related issues** using `Fixes #123` or `Closes #123`

4. **Include screenshots** for UI changes

5. **Keep PRs focused** - one feature or bug fix per PR

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by maintainers
3. **Approval** from at least one maintainer
4. **Merge** after approval

## Coding Standards

### TypeScript

- **Strict mode enabled** - No `any` types without justification
- **Explicit return types** for functions
- **Interface over type** for object shapes
- **Use enums** for constants with multiple values

### Code Style

- **ESLint configuration** enforced
- **Prettier formatting** for consistent style
- **Meaningful variable names** - avoid abbreviations
- **Small functions** - single responsibility principle
- **DRY principle** - Don't Repeat Yourself

### API Development

- **RESTful endpoints** following REST conventions
- **Input validation** using middleware
- **Error handling** with proper HTTP status codes
- **Rate limiting** on all public endpoints
- **Authentication** required for protected routes

### React Development

- **Functional components** with hooks
- **TypeScript interfaces** for props
- **Custom hooks** for reusable logic
- **Error boundaries** for error handling
- **Accessibility** (a11y) considerations

### Database

- **Prisma ORM** for database operations
- **Migrations** for schema changes
- **Indexes** for performance optimization
- **Constraints** for data integrity

## Documentation

### Code Documentation

- **JSDoc comments** for public APIs
- **Inline comments** for complex logic
- **README updates** for significant changes
- **API documentation** in OpenAPI format

### User Documentation

- **MkDocs** for comprehensive guides
- **Clear examples** and code snippets
- **Screenshots** for UI changes
- **Troubleshooting** sections

## Reporting Issues

### Bug Reports

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:

- **Clear title** describing the issue
- **Steps to reproduce** the problem
- **Expected vs actual behavior**
- **Environment details** (OS, browser, Node.js version)
- **Screenshots** or error messages
- **Logs** from browser console or server

### Feature Requests

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) and include:

- **Clear title** describing the feature
- **Problem description** and use case
- **Proposed solution** with examples
- **Alternatives considered**
- **Additional context** (screenshots, mockups)

### Security Issues

**Do not** report security vulnerabilities through public issues. Instead:

1. Email [seanmdalton@pm.me](mailto:seanmdalton@pm.me)
2. Include detailed reproduction steps
3. Allow time for response before public disclosure

## Community

### Getting Help

- **Documentation**: [https://seanmdalton.github.io/pulsestage/](https://seanmdalton.github.io/pulsestage/)
- **Issues**: [GitHub Issues](https://github.com/seanmdalton/pulsestage/issues)
- **Discussions**: [GitHub Discussions](https://github.com/seanmdalton/pulsestage/discussions)

### Contributing Areas

We welcome contributions in many areas:

- **Bug fixes** and performance improvements
- **New features** and enhancements
- **Documentation** improvements
- **Test coverage** expansion
- **UI/UX** improvements
- **Security** enhancements
- **Accessibility** improvements

### Recognition

Contributors are recognized in:
- **GitHub contributors** list
- **Release notes** for significant contributions
- **Community highlights** in discussions

## License

By contributing to PulseStage, you agree that your contributions will be licensed under the Apache License 2.0.

---

Thank you for contributing to PulseStage! 🚀

For questions about contributing, please open a [discussion](https://github.com/seanmdalton/pulsestage/discussions) or email [seanmdalton@pm.me](mailto:seanmdalton@pm.me).
