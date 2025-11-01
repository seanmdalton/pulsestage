#!/bin/bash

# Security Testing Script
# Run this before pushing to ensure all security scans pass locally

set -e

echo "[SECURITY] PulseStage Security Testing"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Trivy is available (via Docker)
echo " Checking prerequisites..."
if ! docker --version > /dev/null 2>&1; then
  echo -e "${RED}[ERROR] Docker not available${NC}"
  exit 1
fi
echo -e "${GREEN}[OK] Docker available${NC}"
echo ""

# Build images using make build (uses override file for local builds)
echo "[BUILD]  Building Docker images..."
make build > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo -e "${RED}[ERROR] Failed to build images${NC}"
  exit 1
fi
echo -e "${GREEN}[OK] Images built${NC}"
echo ""

# Run Trivy scans
echo "[SCAN] Running Trivy security scans..."
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
  pulsestage-api:latest 2>/dev/null)

API_VULN_COUNT=$(echo "$API_RESULT" | jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL" or .Severity == "HIGH")] | length' 2>/dev/null || echo "0")

if [ "$API_VULN_COUNT" -eq 0 ]; then
  echo -e "${GREEN}[OK] API image: 0 HIGH/CRITICAL vulnerabilities${NC}"
else
  echo -e "${RED}[ERROR] API image: $API_VULN_COUNT HIGH/CRITICAL vulnerabilities${NC}"
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
  ghcr.io/seanmdalton/pulsestage-web:latest 2>/dev/null)

WEB_VULN_COUNT=$(echo "$WEB_RESULT" | jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL" or .Severity == "HIGH")] | length' 2>/dev/null || echo "0")

if [ "$WEB_VULN_COUNT" -eq 0 ]; then
  echo -e "${GREEN}[OK] Web image: 0 HIGH/CRITICAL vulnerabilities${NC}"
else
  echo -e "${RED}[ERROR] Web image: $WEB_VULN_COUNT HIGH/CRITICAL vulnerabilities${NC}"
  echo "$WEB_RESULT" | jq -r '.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL" or .Severity == "HIGH") | "  - \(.PkgName)@\(.InstalledVersion): \(.Title) (Severity: \(.Severity))"' | head -10
  exit 1
fi

echo ""

# Test services
echo "[TEST] Testing services..."
docker compose up -d > /dev/null 2>&1

# Wait for services with retry logic
echo "Waiting for services to start..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}[OK] API responds correctly${NC}"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}[ERROR] API not responding after ${MAX_RETRIES} retries${NC}"
    docker compose logs api --tail 30
    docker compose down > /dev/null 2>&1
    exit 1
  fi
  sleep 2
done

# Test Web
if curl -sf http://localhost:5173 > /dev/null; then
  echo -e "${GREEN}[OK] Web responds correctly${NC}"
else
  echo -e "${RED}[ERROR] Web not responding${NC}"
  docker compose logs web --tail 20
  docker compose down > /dev/null 2>&1
  exit 1
fi

# Clean up services
echo ""
echo "Stopping test services..."
docker compose down > /dev/null 2>&1

echo ""
echo "═══════════════════════════════════════"
echo -e "${GREEN}[OK] ALL SECURITY CHECKS PASSED!${NC}"
echo "═══════════════════════════════════════"
echo ""
echo "Images scanned: 0 HIGH/CRITICAL vulnerabilities"
echo "Services tested: API and Web responding correctly"
echo ""
echo "Safe to push to GitHub! "
echo ""

