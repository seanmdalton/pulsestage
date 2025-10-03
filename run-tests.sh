#!/bin/bash

# Run tests in Docker with proper permissions
echo "🧪 Running tests in Docker container..."

# Copy the API source code to a temporary directory
TEMP_DIR=$(mktemp -d)
cp -r api/* "$TEMP_DIR/"

# Run tests in Docker with the temporary directory mounted
docker run --rm \
  --network host \
  -v "$TEMP_DIR:/app" \
  -w /app \
  -e DATABASE_URL="postgresql://app:app@host.docker.internal:5432/ama" \
  -e NODE_ENV=test \
  node:20-alpine \
  sh -c "npm ci && npm test -- --run"

# Clean up
rm -rf "$TEMP_DIR"

echo "✅ Tests completed!"
