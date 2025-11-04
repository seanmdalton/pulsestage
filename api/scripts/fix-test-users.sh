#!/bin/bash
# Quick script to add imports to test files that need createTestUser

cd "$(dirname "$0")/.."

# Add import to files that need it
files=(
  "src/middleware/prismaMiddleware.test.ts"
  "src/moderation.test.ts"
  "src/pulse/responseService.test.ts"
  "src/rbac.test.ts"
  "src/search.test.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Check if import already exists
    if ! grep -q "createTestUser" "$file"; then
      # Find the last import line and add our import after it
      sed -i '/^import.*from.*\.js.*;$/a import { createTestUser } from '"'"'../test/testHelpers.js'"'"';' "$file" 2>/dev/null || \
      sed -i '' '/^import.*from.*\.js.*;$/a\'$'\n''import { createTestUser } from '"'"'../test/testHelpers.js'"'"';' "$file"
      echo "Added import to $file"
    fi
  fi
done

echo "Imports added. Now you need to replace user.create calls manually."


