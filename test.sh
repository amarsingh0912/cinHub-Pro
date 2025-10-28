#!/bin/bash

# CineHub Recommendations API Smoke Tests
# Tests that all three recommendation endpoints return valid JSON arrays

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server configuration
HOST="${API_HOST:-localhost:5000}"
BASE_URL="http://${HOST}/api/recs"

echo ""
echo "🧪 CineHub Recommendations API Smoke Tests"
echo "=========================================="
echo "Testing endpoint: ${BASE_URL}"
echo ""

# Function to test endpoint
test_endpoint() {
  local endpoint=$1
  local description=$2
  
  echo -n "Testing ${description}... "
  
  # Make request and capture response
  response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${endpoint}")
  
  # Extract HTTP status code (last line)
  http_code=$(echo "$response" | tail -n 1)
  
  # Extract JSON body (all but last line)
  body=$(echo "$response" | head -n -1)
  
  # Check HTTP status
  if [ "$http_code" != "200" ]; then
    echo -e "${RED}FAILED${NC}"
    echo "  HTTP Status: $http_code (expected 200)"
    echo "  Response: $body"
    return 1
  fi
  
  # Check if response is valid JSON array
  if ! echo "$body" | jq -e 'type == "array"' > /dev/null 2>&1; then
    echo -e "${RED}FAILED${NC}"
    echo "  Response is not a valid JSON array"
    echo "  Response: $body"
    return 1
  fi
  
  # Count items in array
  count=$(echo "$body" | jq 'length')
  
  echo -e "${GREEN}PASSED${NC}"
  echo "  HTTP Status: $http_code"
  echo "  Items returned: $count"
  
  # Show first item as sample (if any)
  if [ "$count" -gt 0 ]; then
    first_item=$(echo "$body" | jq '.[0] | {id, title, year, genres}')
    echo "  Sample item: $first_item"
  fi
  
  return 0
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}Warning: jq is not installed. Installing jq for JSON parsing...${NC}"
  echo ""
  # Try to install jq (works on most Linux systems)
  if command -v apt-get &> /dev/null; then
    sudo apt-get update && sudo apt-get install -y jq
  elif command -v yum &> /dev/null; then
    sudo yum install -y jq
  else
    echo -e "${RED}Error: Could not install jq. Please install it manually.${NC}"
    exit 1
  fi
fi

# Check if server is running
echo "Checking if server is running..."
if ! curl -s "${BASE_URL}/health" > /dev/null 2>&1; then
  echo -e "${RED}Error: Server is not responding at ${BASE_URL}${NC}"
  echo "Please start the server with: npm run dev"
  exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Run tests
FAILED=0

# Test 1: Trending endpoint
if ! test_endpoint "/trending" "GET /trending"; then
  FAILED=$((FAILED + 1))
fi
echo ""

# Test 2: Similar movies endpoint
if ! test_endpoint "/similar/1" "GET /similar/1"; then
  FAILED=$((FAILED + 1))
fi
echo ""

# Test 3: Personalized recommendations endpoint
if ! test_endpoint "/because/user_1" "GET /because/user_1"; then
  FAILED=$((FAILED + 1))
fi
echo ""

# Test 4: Health check
echo -n "Testing Health Check... "
health_response=$(curl -s "${BASE_URL}/health")
if echo "$health_response" | jq -e '.status == "ok"' > /dev/null 2>&1; then
  echo -e "${GREEN}PASSED${NC}"
  echo "  Response: $health_response"
else
  echo -e "${RED}FAILED${NC}"
  echo "  Response: $health_response"
  FAILED=$((FAILED + 1))
fi
echo ""

# Summary
echo "=========================================="
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}❌ $FAILED test(s) failed${NC}"
  echo ""
  echo "Troubleshooting tips:"
  echo "  1. Ensure the server is running: npm run dev"
  echo "  2. Seed the database: cd server && node seed.cjs"
  echo "  3. Check server logs for errors"
  echo ""
  exit 1
fi
