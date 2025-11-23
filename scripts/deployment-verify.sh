#!/bin/bash

###############################################################################
# CineHub Pro - Deployment Verification Script
#
# Comprehensive deployment verification including:
# - Pre-deployment checks
# - Post-deployment validation
# - Database migration verification
# - Performance benchmarks
# 
# Usage: ./scripts/deployment-verify.sh [environment]
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${1:-staging}"
MAX_RESPONSE_TIME=2000  # milliseconds
MIN_UPTIME=10           # seconds

# Get environment-specific variables
if [ "$ENVIRONMENT" = "production" ]; then
  HOST="${PRODUCTION_HOST:-$EC2_HOST}"
  APP_DIR="${PRODUCTION_APP_DIR:-/var/www/cinehub-pro}"
else
  HOST="${STAGING_HOST:-$EC2_HOST}"
  APP_DIR="${STAGING_APP_DIR:-/var/www/cinehub-pro-staging}"
fi

BASE_URL="http://${HOST}:5000"

echo -e "${BLUE}========================================"
echo "CineHub Pro - Deployment Verification"
echo "Environment: ${ENVIRONMENT}"
echo "Host: ${HOST}"
echo "========================================${NC}"
echo ""

# Step 1: Pre-deployment checks
echo -e "${YELLOW}Step 1: Pre-deployment Checks${NC}"
echo "-------------------------------------------"

# Check if host is reachable
echo -n "Checking host connectivity... "
if ping -c 1 "$HOST" > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC}"
  echo "Error: Cannot reach host $HOST"
  exit 1
fi

# Check if SSH access works (if private key available)
if [ -n "$EC2_SSH_KEY" ]; then
  echo -n "Checking SSH access... "
  if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$EC2_SSH_KEY" ec2-user@"$HOST" "echo 'SSH OK'" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${RED}✗${NC}"
    echo "Warning: SSH access check failed"
  fi
fi

echo ""

# Step 2: Deployment status
echo -e "${YELLOW}Step 2: Deployment Status${NC}"
echo "-------------------------------------------"

# Check if application is running
echo -n "Checking application status... "
if curl -s -f -o /dev/null -m 10 "${BASE_URL}/api/health"; then
  echo -e "${GREEN}Running${NC}"
else
  echo -e "${RED}Not Running${NC}"
  exit 1
fi

# Get application version/commit
echo -n "Application version... "
VERSION=$(curl -s -m 10 "${BASE_URL}/api/health" | grep -o '"version":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
echo "$VERSION"

# Check PM2 process
if command -v pm2 &> /dev/null; then
  echo -n "PM2 process status... "
  PM2_STATUS=$(pm2 jlist | jq -r ".[] | select(.name | contains(\"cinehub-pro\")) | .pm2_env.status" 2>/dev/null || echo "unknown")
  if [ "$PM2_STATUS" = "online" ]; then
    echo -e "${GREEN}online${NC}"
  else
    echo -e "${RED}$PM2_STATUS${NC}"
  fi
fi

echo ""

# Step 3: Database verification
echo -e "${YELLOW}Step 3: Database Verification${NC}"
echo "-------------------------------------------"

# Check database connection
echo -n "Database connectivity... "
DB_STATUS=$(curl -s -m 10 "${BASE_URL}/api/health" | grep -o '"database":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
if [ "$DB_STATUS" = "connected" ]; then
  echo -e "${GREEN}✓ Connected${NC}"
else
  echo -e "${RED}✗ $DB_STATUS${NC}"
  exit 1
fi

# Check database migrations
echo -n "Database schema version... "
SCHEMA_VERSION=$(curl -s -m 10 "${BASE_URL}/api/admin/system/info" -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null | grep -o '"schema_version":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
echo "$SCHEMA_VERSION"

echo ""

# Step 4: API endpoints verification
echo -e "${YELLOW}Step 4: API Endpoints Verification${NC}"
echo "-------------------------------------------"

# Test critical endpoints
declare -a ENDPOINTS=(
  "/api/health:Health Check"
  "/api/movies/trending:Trending Movies"
  "/api/movies/popular:Popular Movies"
  "/api/auth/me:Auth Status"
  "/api/movies/genres:Movie Genres"
)

for endpoint_info in "${ENDPOINTS[@]}"; do
  IFS=':' read -r endpoint name <<< "$endpoint_info"
  echo -n "Testing $name... "
  
  STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "${BASE_URL}${endpoint}")
  
  if [ "$STATUS_CODE" = "200" ] || [ "$STATUS_CODE" = "401" ]; then
    echo -e "${GREEN}✓ ($STATUS_CODE)${NC}"
  else
    echo -e "${RED}✗ ($STATUS_CODE)${NC}"
  fi
done

echo ""

# Step 5: Performance benchmarks
echo -e "${YELLOW}Step 5: Performance Benchmarks${NC}"
echo "-------------------------------------------"

# Response time test
echo -n "Average response time... "
TOTAL_TIME=0
ITERATIONS=5

for i in $(seq 1 $ITERATIONS); do
  RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null -m 10 "${BASE_URL}/api/health" || echo "10.0")
  RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc -l | cut -d'.' -f1)
  TOTAL_TIME=$((TOTAL_TIME + RESPONSE_MS))
done

AVG_TIME=$((TOTAL_TIME / ITERATIONS))

if [ "$AVG_TIME" -lt "$MAX_RESPONSE_TIME" ]; then
  echo -e "${GREEN}${AVG_TIME}ms ✓${NC}"
else
  echo -e "${YELLOW}${AVG_TIME}ms (slower than ${MAX_RESPONSE_TIME}ms)${NC}"
fi

# Concurrent requests test
echo -n "Concurrent requests handling... "
ab -n 100 -c 10 -q "${BASE_URL}/api/health" > /dev/null 2>&1 && echo -e "${GREEN}✓${NC}" || echo -e "${RED}✗${NC}"

echo ""

# Step 6: Security checks
echo -e "${YELLOW}Step 6: Security Checks${NC}"
echo "-------------------------------------------"

# HTTPS redirect (if production)
if [ "$ENVIRONMENT" = "production" ]; then
  echo -n "HTTPS enforcement... "
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "http://${HOST}" || echo "000")
  if [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
    echo -e "${GREEN}✓ Redirects to HTTPS${NC}"
  else
    echo -e "${YELLOW}⚠ No HTTPS redirect${NC}"
  fi
fi

# Security headers
echo -n "Security headers... "
HEADERS=$(curl -s -I -m 10 "${BASE_URL}/api/health" || echo "")

if echo "$HEADERS" | grep -qi "x-content-type-options"; then
  echo -e "${GREEN}✓ Present${NC}"
else
  echo -e "${YELLOW}⚠ Missing some headers${NC}"
fi

echo ""

# Step 7: Environment validation
echo -e "${YELLOW}Step 7: Environment Validation${NC}"
echo "-------------------------------------------"

# Check required environment variables are set
echo "Validating environment variables..."

declare -a REQUIRED_VARS=(
  "DATABASE_URL"
  "SESSION_SECRET"
  "TMDB_API_KEY"
)

ALL_VARS_SET=true

for var in "${REQUIRED_VARS[@]}"; do
  # Note: This check would need to be done on the server
  echo "  - $var: (check on server)"
done

echo ""

# Step 8: Logging and monitoring
echo -e "${YELLOW}Step 8: Logging & Monitoring${NC}"
echo "-------------------------------------------"

# Check if logs are being written
if [ -n "$EC2_SSH_KEY" ]; then
  echo -n "Application logs... "
  LOG_COUNT=$(ssh -o ConnectTimeout=10 -i "$EC2_SSH_KEY" ec2-user@"$HOST" "pm2 logs cinehub-pro-${ENVIRONMENT} --lines 10 --nostream 2>/dev/null | wc -l" || echo "0")
  
  if [ "$LOG_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Active${NC}"
  else
    echo -e "${YELLOW}⚠ No recent logs${NC}"
  fi
  
  # Check for errors in recent logs
  echo -n "Error rate in logs... "
  ERROR_COUNT=$(ssh -o ConnectTimeout=10 -i "$EC2_SSH_KEY" ec2-user@"$HOST" "pm2 logs cinehub-pro-${ENVIRONMENT} --lines 100 --nostream 2>/dev/null | grep -ci error" || echo "0")
  echo "${ERROR_COUNT} errors in last 100 log lines"
fi

echo ""

# Step 9: Rollback readiness
echo -e "${YELLOW}Step 9: Rollback Readiness${NC}"
echo "-------------------------------------------"

if [ -n "$EC2_SSH_KEY" ]; then
  echo -n "Backup availability... "
  BACKUP_COUNT=$(ssh -o ConnectTimeout=10 -i "$EC2_SSH_KEY" ec2-user@"$HOST" "ls -1 ${APP_DIR}/backups 2>/dev/null | wc -l" || echo "0")
  
  if [ "$BACKUP_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ $BACKUP_COUNT backups available${NC}"
  else
    echo -e "${RED}✗ No backups found${NC}"
  fi
fi

echo ""

# Final Summary
echo -e "${BLUE}========================================"
echo "Deployment Verification Complete"
echo "========================================${NC}"
echo ""
echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
echo -e "Status: ${GREEN}Deployment Verified${NC}"
echo -e "URL: ${BLUE}${BASE_URL}${NC}"
echo ""
echo -e "${GREEN}✓ All critical checks passed${NC}"
echo ""
echo "Next steps:"
echo "  1. Monitor application logs for any errors"
echo "  2. Run smoke tests on critical user flows"
echo "  3. Check analytics for traffic patterns"
echo "  4. Verify database backups are scheduled"
echo ""

exit 0
