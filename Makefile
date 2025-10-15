.PHONY: help setup dev up down clean test test-api test-web lint lint-fix format security logs db-seed db-reset validate-ci install

# Default target - show help
help:
	@echo "🚀 PulseStage Development Commands"
	@echo "===================================="
	@echo ""
	@echo "Setup & Environment:"
	@echo "  make setup        - Initialize environment (.env file)"
	@echo "  make install      - Install all dependencies (API + Web)"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start local development (foreground, hot reload for web)"
	@echo "  make up           - Start services in background (hot reload for web)"
	@echo "  make down         - Stop all services"
	@echo "  make logs         - Follow logs from all services"
	@echo "  make clean        - Clean up containers, volumes, and build artifacts"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run all tests (API + Web E2E)"
	@echo "  make test-api     - Run API tests only"
	@echo "  make test-web     - Run Web E2E tests"
	@echo "  make validate-ci  - Run all CI checks locally (tests, linting, build)"
	@echo "  make security     - Run security scans (Trivy)"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint         - Run linting (API + Web)"
	@echo "  make lint-fix     - Fix linting issues automatically"
	@echo "  make format       - Format code (Prettier)"
	@echo ""
	@echo "Database:"
	@echo "  make db-seed      - Seed multi-tenant test data (dev mode auto-seeds on startup)"
	@echo "  make db-reset     - Reset database (wipe volumes and restart)"
	@echo ""

# Setup - Initialize environment
setup:
	@echo "🔧 Running setup script..."
	@bash setup.sh

# Install dependencies
install:
	@echo "📦 Installing all dependencies..."
	@echo "Installing root dependencies..."
	@npm install
	@echo "Installing API dependencies..."
	@cd api && npm install
	@echo "Installing Web dependencies..."
	@cd web && npm install
	@echo "✅ All dependencies installed!"

# Development - Start with local builds and hot reload
dev:
	@echo "🚀 Starting local development environment..."
	@echo "Building and starting services with hot reload for web frontend..."
	@docker compose -f docker-compose.yaml -f docker-compose.override.yaml up --build

# Start services in background
up:
	@echo "🚀 Starting services in background..."
	@docker compose -f docker-compose.yaml -f docker-compose.override.yaml up -d --build
	@echo "✅ Services started with hot reload for web!"
	@echo "   API: http://localhost:3000"
	@echo "   Web: http://localhost:5173 (hot reload enabled)"
	@echo "   View logs: make logs"

# Stop services
down:
	@echo "🛑 Stopping services..."
	@docker compose down
	@echo "✅ Services stopped!"

# Clean up everything
clean:
	@echo "🧹 Cleaning up..."
	@docker compose down -v
	@rm -rf api/dist api/coverage api/node_modules/.vitest
	@rm -rf web/dist web/playwright-report web/test-results
	@echo "✅ Cleanup complete!"

# Run all tests
test:
	@echo "🧪 Running all tests..."
	@npm run test:api
	@echo ""
	@echo "Note: E2E tests require services to be running (make up)"

# Run API tests
test-api:
	@echo "🧪 Running API tests..."
	@cd api && npm run test

# Run Web E2E tests
test-web:
	@echo "🧪 Running Web E2E tests..."
	@echo "Ensure services are running (make up) before running E2E tests"
	@cd web && npm run test:e2e

# Lint all code
lint:
	@echo "📝 Running linters..."
	@npm run lint

# Fix linting issues
lint-fix:
	@echo "🔧 Fixing linting issues..."
	@npm run lint:fix

# Format code
format:
	@echo "🎨 Formatting code..."
	@npm run format

# Run security scans
security:
	@echo "🔒 Running security scans..."
	@bash test-security.sh

# Validate all CI checks locally
validate-ci:
	@echo "✅ Running all CI validation checks..."
	@echo ""
	@echo "1️⃣  Running API tests..."
	@cd api && npm run test
	@echo ""
	@echo "2️⃣  Building API..."
	@cd api && npm run build
	@echo ""
	@echo "3️⃣  Running API linting..."
	@cd api && npm run lint
	@echo ""
	@echo "4️⃣  Checking API formatting..."
	@cd api && npm run format:check
	@echo ""
	@echo "5️⃣  Running Web linting..."
	@cd web && npm run lint
	@echo ""
	@echo "6️⃣  Checking Web formatting..."
	@cd web && npm run format:check
	@echo ""
	@echo "═══════════════════════════════════════"
	@echo "✅ ALL CI VALIDATION CHECKS PASSED!"
	@echo "═══════════════════════════════════════"
	@echo "Ready to push to GitHub! 🚀"

# View logs
logs:
	@docker compose logs -f

# Seed database with multi-tenant test data
# Note: Development mode auto-seeds demo data on startup
db-seed:
	@echo "🌱 Seeding multi-tenant test data (for testing/CI)..."
	@echo "ℹ️  Note: Development mode auto-seeds demo data on startup"
	@docker compose exec api npm run db:seed:full
	@echo "✅ Multi-tenant test data seeded! Restart API: docker compose restart api"

# Reset database (wipe volumes and restart)
# Development mode will auto-seed demo data on restart
db-reset:
	@echo "🔄 Resetting database (wiping volumes)..."
	@docker compose down -v
	@docker compose up -d
	@echo "⏳ Waiting for services to start..."
	@sleep 10
	@echo "✅ Database reset! Demo data auto-seeded in development mode."

