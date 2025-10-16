#!/bin/bash

###############################################################################
# CineHub Pro - Health Check Script
# 
# Performs comprehensive health checks on the deployed application
# Usage: ./scripts/health-check.sh [HOST] [PORT]
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
HOST="${1:-localhost}"
PORT="${2:-5000}"
BASE_URL="http://${HOST}:${PORT}"

# Test results
PASSED=0
FAILED=0

# Helper function for test results
check_test() {
  local test_name="$1"
  local test_result="$2"
  
  if [ "$test_result" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $test_name"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $test_name"
    ((FAILED++))
  fi
}

echo "========================================"
echo "CineHub Pro - Health Check"
echo "Target: ${BASE_URL}"
echo "========================================"
echo ""

# Test 1: Server is running and responsive
echo "Testing server connectivity..."
if curl -s -f -o /dev/null -m 10 "${BASE_URL}/api/health"; then
  check_test "Server is running" 0
else
  check_test "Server is running" 1
fi

# Test 2: Health endpoint returns correct status
echo ""
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -m 10 "${BASE_URL}/api/health" || echo "{}")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
  check_test "Health endpoint returns OK" 0
else
  check_test "Health endpoint returns OK" 1
fi

# Test 3: Database connectivity
echo ""
echo "Testing database connectivity..."
DB_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"database":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
if [ "$DB_STATUS" = "connected" ]; then
  check_test "Database is connected" 0
else
  check_test "Database is connected" 1
  echo "  Database status: $DB_STATUS"
fi

# Test 4: API routes are accessible
echo ""
echo "Testing API routes..."

# Test trending movies endpoint
if curl -s -f -o /dev/null -m 10 "${BASE_URL}/api/movies/trending"; then
  check_test "Trending movies endpoint accessible" 0
else
  check_test "Trending movies endpoint accessible" 1
fi

# Test popular movies endpoint
if curl -s -f -o /dev/null -m 10 "${BASE_URL}/api/movies/popular"; then
  check_test "Popular movies endpoint accessible" 0
else
  check_test "Popular movies endpoint accessible" 1
fi

# Test 5: Static assets are served (if production)
if [ "$NODE_ENV" = "production" ]; then
  echo ""
  echo "Testing static assets..."
  if curl -s -f -o /dev/null -m 10 "${BASE_URL}/"; then
    check_test "Frontend is accessible" 0
  else
    check_test "Frontend is accessible" 1
  fi
fi

# Test 6: Authentication endpoints
echo ""
echo "Testing authentication..."
if curl -s -f -o /dev/null -m 10 "${BASE_URL}/api/auth/me"; then
  check_test "Auth endpoints accessible" 0
else
  check_test "Auth endpoints accessible" 1
fi

# Test 7: CORS headers (if applicable)
echo ""
echo "Testing CORS configuration..."
CORS_HEADER=$(curl -s -I -m 10 "${BASE_URL}/api/health" | grep -i "access-control-allow" || echo "")
if [ -n "$CORS_HEADER" ] || [ "$NODE_ENV" = "production" ]; then
  check_test "CORS headers configured" 0
else
  check_test "CORS headers configured" 1
fi

# Test 8: Response time check
echo ""
echo "Testing response time..."
RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null -m 10 "${BASE_URL}/api/health" || echo "10.0")
RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc -l | cut -d'.' -f1)

if [ "$RESPONSE_MS" -lt 1000 ]; then
  check_test "Response time < 1s (${RESPONSE_MS}ms)" 0
else
  check_test "Response time < 1s (${RESPONSE_MS}ms)" 1
fi

# Test 9: Memory and process check (if on server)
if command -v pm2 &> /dev/null; then
  echo ""
  echo "Testing PM2 process..."
  if pm2 describe cinehub-pro-production > /dev/null 2>&1 || pm2 describe cinehub-pro-staging > /dev/null 2>&1; then
    check_test "PM2 process is running" 0
  else
    check_test "PM2 process is running" 1
  fi
fi

# Test 10: Error rate check
echo ""
echo "Testing error handling..."
# Test 404 handling
STATUS_404=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "${BASE_URL}/api/nonexistent" || echo "000")
if [ "$STATUS_404" = "404" ]; then
  check_test "404 errors handled correctly" 0
else
  check_test "404 errors handled correctly" 1
fi

# Summary
echo ""
echo "========================================"
echo "Health Check Summary"
echo "========================================"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo "========================================"

# Exit with appropriate code
if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}All health checks passed!${NC}"
  exit 0
else
  echo -e "${RED}Some health checks failed!${NC}"
  exit 1
fi
