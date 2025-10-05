#!/bin/sh

set -e

echo "🚀 Starting PulseStage API..."

# Push Prisma schema
echo "📦 Syncing database schema..."
npx prisma db push --skip-generate --accept-data-loss

# Apply custom migrations (full-text search)
echo "🔍 Applying full-text search migration..."
psql $DATABASE_URL -f /app/prisma/migrations/add_fulltext_search.sql || echo "Migration already applied"

# Start the server
echo "✅ Starting server..."
exec node dist/server.js

