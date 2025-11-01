#!/bin/bash
# Local Verification Script for Explain My Game
# Checks core services and endpoints
#
# Usage: ./scripts/verify_local.sh
# Exit codes: 0 = all checks passed, 1 = one or more checks failed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="${API_URL:-http://localhost:8000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
DEV_TOKEN="dev_user_seed_001"

PASSED=0
FAILED=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo ""
echo "=========================================="
echo "  Explain My Game - Local Verification"
echo "=========================================="
echo ""

# 1. API Health Check
echo "Checking API health..."
if curl -sf "${API_URL}/health" | grep -q "healthy"; then
    check_pass "API is healthy"
else
    check_fail "API health check failed (is the API running?)"
fi

# 2. Frontend Reachable
echo "Checking frontend..."
if curl -sf "${WEB_URL}" -o /dev/null; then
    check_pass "Frontend is reachable"
else
    check_fail "Frontend not reachable (is the web server running?)"
fi

# 3. Database Check (via API)
echo "Checking database connection..."
HEALTH_RESPONSE=$(curl -sf "${API_URL}/health" 2>/dev/null || echo "")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    check_pass "Database connection OK"
else
    check_fail "Database connection failed"
fi

# 4. API Documentation
echo "Checking API documentation..."
if curl -sf "${API_URL}/docs" -o /dev/null; then
    check_pass "API docs accessible"
else
    check_warn "API docs not accessible (may be disabled in production)"
fi

# 5. CSV Template Download
echo "Checking CSV template endpoint..."
CSV_RESPONSE=$(curl -sf "${API_URL}/stats/csv-template" 2>/dev/null || echo "")
if echo "$CSV_RESPONSE" | grep -q "points_for"; then
    check_pass "CSV template download works"
else
    check_fail "CSV template download failed"
fi

# 6. Auth Endpoint (with dev token)
echo "Checking authentication..."
AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${DEV_TOKEN}" "${API_URL}/users/me" 2>/dev/null || echo "000")
AUTH_RESPONSE=$(curl -sf -H "Authorization: Bearer ${DEV_TOKEN}" "${API_URL}/users/me" 2>/dev/null || echo "")
if echo "$AUTH_RESPONSE" | grep -q "email"; then
    check_pass "Dev token authentication works"
elif [ "$AUTH_CODE" = "401" ]; then
    # 401 is expected if user not seeded - dev token format is correct
    check_warn "Dev token authentication requires seeded user (expected in fresh install)"
else
    check_fail "Authentication check failed (HTTP $AUTH_CODE)"
fi

# 7. Teams Endpoint
echo "Checking teams endpoint..."
TEAMS_RESPONSE=$(curl -sf -H "Authorization: Bearer ${DEV_TOKEN}" "${API_URL}/teams" 2>/dev/null || echo "error")
if echo "$TEAMS_RESPONSE" | grep -qE '^\['; then
    check_pass "Teams endpoint works"
else
    check_fail "Teams endpoint failed"
fi

# 8. Invalid Token Rejection
echo "Checking token validation..."
INVALID_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer invalid_token" "${API_URL}/users/me" 2>/dev/null || echo "000")
if [ "$INVALID_RESPONSE" = "401" ]; then
    check_pass "Invalid tokens properly rejected"
else
    check_fail "Invalid token not rejected (got HTTP $INVALID_RESPONSE)"
fi

# Summary
echo ""
echo "=========================================="
echo "  Summary"
echo "=========================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Some checks failed!${NC}"
    echo "Run 'docker compose logs' to see service logs."
    exit 1
else
    echo -e "${GREEN}All checks passed!${NC}"
    exit 0
fi

