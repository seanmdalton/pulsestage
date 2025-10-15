# Contributing to PulseStage

Thank you for your interest in contributing! PulseStage is an open-source project, and we welcome contributions of all kinds.

## Quick Start

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/pulsestage.git
cd pulsestage
make setup
make dev
```

Visit [http://localhost:5173](http://localhost:5173) and log in as a demo user to start testing.

## How to Contribute

### 🐛 Report Bugs
Found a bug? **[Open an issue](https://github.com/seanmdalton/pulsestage/issues/new)** with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)

### 💡 Suggest Features
Have an idea? **[Start a discussion](https://github.com/seanmdalton/pulsestage/discussions/new)** or open a feature request issue.

### 🔧 Submit Code
1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/your-feature`
3. **Make changes** with tests
4. **Run checks**: `make test && make lint`
5. **Commit**: Use clear, descriptive messages
6. **Push**: `git push origin feature/your-feature`
7. **Open a pull request** with description of changes

## Development Guidelines

### Code Style
- **TypeScript** for all new code
- **ESLint** and **Prettier** for formatting (`make lint-fix`)
- Follow existing patterns in the codebase

### Testing
- Write tests for new features
- Ensure existing tests pass: `make test`
- 310+ tests must remain passing

### Commits
Use conventional commit format:
```
feat: add email notification preferences
fix: resolve session timeout issue
docs: update deployment guide
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Requests
- **One feature per PR** - keep changes focused
- **Update documentation** if needed
- **Add tests** for new functionality
- **Describe changes** clearly in PR description
- **Link related issues** using `Closes #123`

## Code of Conduct

This project follows our **[Code of Conduct](CODE_OF_CONDUCT.md)**. Be respectful, inclusive, and professional.

## Getting Help

- 📖 **[Documentation](https://seanmdalton.github.io/pulsestage/)** - Comprehensive guides
- 🏗️ **[Architecture Docs](https://seanmdalton.github.io/pulsestage/architecture/system-design/)** - System design
- 🛠️ **[Development Guide](https://seanmdalton.github.io/pulsestage/development/setup/)** - Detailed setup
- 💬 **[Discussions](https://github.com/seanmdalton/pulsestage/discussions)** - Ask questions
- 🐛 **[Issues](https://github.com/seanmdalton/pulsestage/issues)** - Bug reports

## Development Workflow

### Initial Setup
```bash
make setup      # Initialize environment & dependencies
make dev        # Start with hot reload
```

### Daily Development
```bash
make dev        # Start dev environment
# Edit files in web/src/ → changes apply instantly
# Edit files in api/src/ → run: docker compose restart api
```

### Before Committing
```bash
make test       # Run all tests
make lint       # Check code style
make lint-fix   # Auto-fix style issues
```

### Helpful Commands
```bash
make logs       # View logs
make clean      # Clean build artifacts
make reset      # Reset database (dev mode)
```

## Project Structure

```
pulsestage/
├── api/                  # Backend API (Node.js + Express)
│   ├── src/
│   ├── prisma/          # Database schema & migrations
│   └── tests/
├── web/                  # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── contexts/
│   └── e2e/
├── docs/                 # Documentation (MkDocs)
└── docker-compose.yaml   # Docker setup
```

## Documentation

All documentation lives in `docs/`:
- **Getting Started**: Installation, quick start, configuration
- **User Guide**: How to use PulseStage
- **Moderator Guide**: Moderation tools
- **Admin Guide**: Administration tasks
- **Development**: Contributing, testing, code style
- **Architecture**: System design, database schema
- **API Reference**: REST API documentation
- **Deployment**: Production setup, monitoring

When adding features, update relevant documentation.

## License

By contributing, you agree that your contributions will be licensed under the **Apache License 2.0**.

## Questions?

- 💬 Ask in **[Discussions](https://github.com/seanmdalton/pulsestage/discussions)**
- 📧 Email: **[seanmdalton@pm.me](mailto:seanmdalton@pm.me)**

---

**Thank you for contributing to PulseStage!** 🎉
