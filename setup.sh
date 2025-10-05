#!/bin/bash
# PulseStage Setup Script
# Initializes environment configuration for local development

set -e

echo "🚀 PulseStage Setup"
echo "===================="
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists"
    read -p "Do you want to overwrite it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file"
        exit 0
    fi
fi

# Generate secure random secrets
echo "📝 Generating secure secrets..."
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

echo "✅ Created .env file with secure secrets"
echo ""
echo "📋 Configuration Summary:"
echo "   - Database: postgresql://app:app@localhost:5432/ama"
echo "   - Redis: redis://localhost:6379"
echo "   - API Port: 3000"
echo "   - Web URL: http://localhost:5173"
echo "   - Admin Key: dev-admin-key-change-me (⚠️  Change in production!)"
echo ""
echo "⚙️  Next Steps:"
echo "   1. Start services:        docker compose up -d"
echo "   2. Wait for startup:      docker compose logs -f api"
echo "                             (Wait for 'Auto-bootstrap: Default tenant created')"
echo "   3. Load demo data:        docker compose exec api npm run db:seed:full"
echo "   4. Access app:            http://localhost:5173"
echo ""
echo "📚 For more information, see:"
echo "   - Quick Start: docs/getting-started/quick-start.md"
echo "   - Installation: docs/getting-started/installation.md"
echo ""
