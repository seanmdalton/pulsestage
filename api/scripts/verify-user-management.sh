#!/bin/bash
# Verification script for admin user management functionality

set -e

echo "🧪 Testing Admin User Management Endpoints"
echo "============================================"
echo ""

# Get a session cookie
echo "1. Logging in as admin..."
curl -s 'http://localhost:3000/auth/demo?user=admin&tenant=default' -c /tmp/test-cookies.txt > /dev/null
echo "✅ Logged in"
echo ""

# Get user list
echo "2. Fetching user list..."
RESPONSE=$(curl -s 'http://localhost:3000/admin/users' -b /tmp/test-cookies.txt -H 'X-Tenant: default')
USER_COUNT=$(echo "$RESPONSE" | jq '.users | length')
echo "✅ Found $USER_COUNT users"
echo ""

# Check if isActive field exists
echo "3. Checking if isActive field exists in response..."
FIRST_USER=$(echo "$RESPONSE" | jq '.users[0]')
if echo "$FIRST_USER" | jq 'has("isActive")' | grep -q "true"; then
  IS_ACTIVE=$(echo "$FIRST_USER" | jq -r '.isActive')
  USER_EMAIL=$(echo "$FIRST_USER" | jq -r '.email')
  echo "✅ isActive field found: $USER_EMAIL is $([[ "$IS_ACTIVE" == "true" ]] && echo "ACTIVE" || echo "INACTIVE")"
else
  echo "❌ isActive field NOT FOUND in response"
  echo "First user response:"
  echo "$FIRST_USER" | jq '.'
  exit 1
fi
echo ""

# Get test user ID
echo "4. Finding test user (sean123@pulsestage.app)..."
USER_ID=$(echo "$RESPONSE" | jq -r '.users[] | select(.email=="sean123@pulsestage.app") | .id')
if [ -z "$USER_ID" ] || [ "$USER_ID" == "null" ]; then
  echo "❌ Test user not found"
  exit 1
fi
echo "✅ Found user: $USER_ID"
echo ""

# Test deactivate
echo "5. Testing deactivate endpoint..."
DEACTIVATE_RESPONSE=$(curl -s "http://localhost:3000/admin/users/$USER_ID/deactivate" \
  -X PATCH \
  -b /tmp/test-cookies.txt \
  -H 'X-Tenant: default' \
  -H 'Content-Type: application/json')

if echo "$DEACTIVATE_RESPONSE" | jq -e '.success' > /dev/null; then
  IS_ACTIVE_AFTER=$(echo "$DEACTIVATE_RESPONSE" | jq -r '.user.isActive')
  if [ "$IS_ACTIVE_AFTER" == "false" ]; then
    echo "✅ User successfully deactivated"
  else
    echo "❌ User deactivate failed - isActive is still true"
    exit 1
  fi
else
  echo "❌ Deactivate request failed"
  echo "$DEACTIVATE_RESPONSE"
  exit 1
fi
echo ""

# Verify in list
echo "6. Verifying user shows as inactive in list..."
LIST_RESPONSE=$(curl -s 'http://localhost:3000/admin/users' -b /tmp/test-cookies.txt -H 'X-Tenant: default')
USER_STATUS=$(echo "$LIST_RESPONSE" | jq -r ".users[] | select(.id==\"$USER_ID\") | .isActive")
if [ "$USER_STATUS" == "false" ]; then
  echo "✅ User list correctly shows inactive"
else
  echo "❌ User list shows isActive=$USER_STATUS (expected false)"
  exit 1
fi
echo ""

# Test reactivate
echo "7. Testing reactivate endpoint..."
ACTIVATE_RESPONSE=$(curl -s "http://localhost:3000/admin/users/$USER_ID/activate" \
  -X PATCH \
  -b /tmp/test-cookies.txt \
  -H 'X-Tenant: default' \
  -H 'Content-Type: application/json')

if echo "$ACTIVATE_RESPONSE" | jq -e '.success' > /dev/null; then
  IS_ACTIVE_AFTER=$(echo "$ACTIVATE_RESPONSE" | jq -r '.user.isActive')
  if [ "$IS_ACTIVE_AFTER" == "true" ]; then
    echo "✅ User successfully reactivated"
  else
    echo "❌ User reactivate failed - isActive is still false"
    exit 1
  fi
else
  echo "❌ Reactivate request failed"
  echo "$ACTIVATE_RESPONSE"
  exit 1
fi
echo ""

# Final verification
echo "8. Final verification in user list..."
FINAL_RESPONSE=$(curl -s 'http://localhost:3000/admin/users' -b /tmp/test-cookies.txt -H 'X-Tenant: default')
FINAL_STATUS=$(echo "$FINAL_RESPONSE" | jq -r ".users[] | select(.id==\"$USER_ID\") | .isActive")
if [ "$FINAL_STATUS" == "true" ]; then
  echo "✅ User list correctly shows active"
else
  echo "❌ User list shows isActive=$FINAL_STATUS (expected true)"
  exit 1
fi
echo ""

# Cleanup
rm /tmp/test-cookies.txt

echo "============================================"
echo "✅ ALL TESTS PASSED!"
echo ""
echo "Backend is working correctly:"
echo "  ✓ /admin/users returns isActive field"
echo "  ✓ PATCH /admin/users/:id/deactivate works"
echo "  ✓ PATCH /admin/users/:id/activate works"
echo "  ✓ User list reflects status changes"
echo ""
echo "If the UI still doesn't work, the issue is in the frontend."

