#!/bin/sh

set -e

echo "🚀 Starting PulseStage API..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
until npx prisma db execute --stdin <<< "SELECT 1" 2>/dev/null; do
  echo "Database not ready, waiting..."
  sleep 2
done
echo "✅ Database is ready!"

# Push Prisma schema
echo "📦 Syncing database schema..."
npx prisma db push --skip-generate --accept-data-loss

# Apply custom migrations (full-text search)
echo "🔍 Applying full-text search migration..."
psql $DATABASE_URL -f /app/prisma/migrations/add_fulltext_search.sql || echo "Migration already applied"

# Start the server
echo "✅ Starting server..."
exec node dist/server.js

