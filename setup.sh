#!/bin/bash
# PulseStage Setup Script
# Initializes environment configuration for local development

set -e

echo " PulseStage Setup"
echo "===================="
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "[WARNING]  .env file already exists"
    read -p "Do you want to overwrite it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file"
        exit 0
    fi
fi

# Generate secure random secrets
echo " Generating secure secrets..."
SESSION_SECRET=$(openssl rand -base64 32)
ADMIN_SESSION_SECRET=$(openssl rand -base64 32)
CSRF_SECRET=$(openssl rand -base64 32)

# Create .env file
cat > .env <<EOF
# PulseStage Environment Configuration
# Generated on $(date)

# Database
DATABASE_URL="postgresql://app:app@localhost:5432/ama"

# Redis
REDIS_URL="redis://localhost:6379"

# API Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"

# Session Secrets (Generated - DO NOT SHARE)
SESSION_SECRET="${SESSION_SECRET}"
ADMIN_SESSION_SECRET="${ADMIN_SESSION_SECRET}"

# CSRF Protection (Generated)
CSRF_SECRET="${CSRF_SECRET}"

# Admin Authentication
ADMIN_KEY="dev-admin-key-change-me"

# SSO Configuration (for development)
MOCK_SSO=true
SSO_PROVIDER="mock"
EOF

echo "[OK] Created .env file with secure secrets"
echo ""
echo " Configuration Summary:"
echo "   - Database: postgresql://app:app@localhost:5432/ama"
echo "   - Redis: redis://localhost:6379"
echo "   - API Port: 3000"
echo "   - Web URL: http://localhost:5173"
echo "   - Admin Key: dev-admin-key-change-me ([WARNING]  Change in production!)"
echo ""
echo "⚙  Next Steps:"
echo "   1. Start services:        docker compose up -d"
echo "   2. Access app:            http://localhost:5173"
echo "   3. Follow Setup Wizard:   Choose 'Demo Data' or 'Create Organization'"
echo ""
echo "🎯 Setup Wizard will guide you through:"
echo "   - Loading demo data (teams, users, questions)"
echo "   - OR creating your own organization from scratch"
echo ""
echo "👨‍💻 For Development (with live code changes):"
echo "   - make install           # Install dependencies"
echo "   - make dev               # Start with local builds"
echo "   - make db-seed           # Load demo data (optional)"
echo ""
echo "📚 For more information, see:"
echo "   - Quick Start: docs/getting-started/quick-start.md"
echo "   - Installation: docs/getting-started/installation.md"
echo "   - Development: DEVELOPMENT.md"
echo ""
