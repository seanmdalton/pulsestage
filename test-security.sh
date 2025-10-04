#!/bin/bash

# Security Testing Script
# Run this before pushing to ensure all security scans pass locally

set -e

echo "🔒 PulseStage Security Testing"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Trivy is available (via Docker)
echo "📋 Checking prerequisites..."
if ! docker --version > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker not available${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Docker available${NC}"
echo ""

# Build images
echo "🏗️  Building Docker images..."
echo "Building API..."
docker compose build --no-cache api > /dev/null 2>&1
echo -e "${GREEN}✅ API built${NC}"

echo "Building Web..."
docker compose build --no-cache web > /dev/null 2>&1
echo -e "${GREEN}✅ Web built${NC}"
echo ""

# Run Trivy scans
echo "🔍 Running Trivy security scans..."
echo ""

# Scan API image
echo "Scanning API image..."
API_RESULT=$(docker run --rm \
  -v "$(pwd)/.trivyignore:/.trivyignore" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image \
  --severity HIGH,CRITICAL \
  --ignorefile /.trivyignore \
  --format json \
  --quiet \
  ama-app-api:latest 2>/dev/null)

API_VULN_COUNT=$(echo "$API_RESULT" | jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL" or .Severity == "HIGH")] | length' 2>/dev/null || echo "0")

if [ "$API_VULN_COUNT" -eq 0 ]; then
  echo -e "${GREEN}✅ API image: 0 HIGH/CRITICAL vulnerabilities${NC}"
else
  echo -e "${RED}❌ API image: $API_VULN_COUNT HIGH/CRITICAL vulnerabilities${NC}"
  echo "$API_RESULT" | jq -r '.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL" or .Severity == "HIGH") | "  - \(.PkgName)@\(.InstalledVersion): \(.Title) (Severity: \(.Severity))"' | head -10
  exit 1
fi

# Scan Web image
echo "Scanning Web image..."
WEB_RESULT=$(docker run --rm \
  -v "$(pwd)/.trivyignore:/.trivyignore" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image \
  --severity HIGH,CRITICAL \
  --ignorefile /.trivyignore \
  --format json \
  --quiet \
  ama-app-web:latest 2>/dev/null)

WEB_VULN_COUNT=$(echo "$WEB_RESULT" | jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL" or .Severity == "HIGH")] | length' 2>/dev/null || echo "0")

if [ "$WEB_VULN_COUNT" -eq 0 ]; then
  echo -e "${GREEN}✅ Web image: 0 HIGH/CRITICAL vulnerabilities${NC}"
else
  echo -e "${RED}❌ Web image: $WEB_VULN_COUNT HIGH/CRITICAL vulnerabilities${NC}"
  echo "$WEB_RESULT" | jq -r '.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL" or .Severity == "HIGH") | "  - \(.PkgName)@\(.InstalledVersion): \(.Title) (Severity: \(.Severity))"' | head -10
  exit 1
fi

echo ""

# Test services
echo "🧪 Testing services..."
docker compose up -d > /dev/null 2>&1
sleep 10

# Test API
if curl -sf http://localhost:3000/health > /dev/null; then
  echo -e "${GREEN}✅ API responds correctly${NC}"
else
  echo -e "${RED}❌ API not responding${NC}"
  docker compose logs api --tail 20
  exit 1
fi

# Test Web
if curl -sf http://localhost:5173 > /dev/null; then
  echo -e "${GREEN}✅ Web responds correctly${NC}"
else
  echo -e "${RED}❌ Web not responding${NC}"
  docker compose logs web --tail 20
  exit 1
fi

echo ""
echo "═══════════════════════════════════════"
echo -e "${GREEN}✅ ALL SECURITY CHECKS PASSED!${NC}"
echo "═══════════════════════════════════════"
echo ""
echo "Safe to push to GitHub! 🚀"
echo ""

