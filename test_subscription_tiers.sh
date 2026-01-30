#!/bin/bash

# Subscription Tier Testing Script
# This script tests the subscription tier feature implementation

set -e

echo "=========================================="
echo "🧪 SUBSCRIPTION TIER VERIFICATION TESTS"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database connection
PSQL="docker exec -i visualization-postgres psql -U postgres -d visualization_db"

echo "📊 Test 1: Verify Database Schema"
echo "-----------------------------------"
echo "Checking if subscription_tier column exists..."
COLUMN_EXISTS=$($PSQL -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='subscription_tier';" | xargs)

if [ "$COLUMN_EXISTS" = "subscription_tier" ]; then
    echo -e "${GREEN}✅ PASS${NC}: subscription_tier column exists"
else
    echo -e "${RED}❌ FAIL${NC}: subscription_tier column does not exist"
    exit 1
fi

echo ""
echo "📊 Test 2: Verify Check Constraint"
echo "-----------------------------------"
CONSTRAINT_EXISTS=$($PSQL -t -c "SELECT conname FROM pg_constraint WHERE conname='valid_subscription_tier';" | xargs)

if [ "$CONSTRAINT_EXISTS" = "valid_subscription_tier" ]; then
    echo -e "${GREEN}✅ PASS${NC}: valid_subscription_tier constraint exists"
else
    echo -e "${RED}❌ FAIL${NC}: valid_subscription_tier constraint does not exist"
    exit 1
fi

echo ""
echo "📊 Test 3: Verify Index"
echo "-----------------------------------"
INDEX_EXISTS=$($PSQL -t -c "SELECT indexname FROM pg_indexes WHERE indexname='idx_users_subscription_tier';" | xargs)

if [ "$INDEX_EXISTS" = "idx_users_subscription_tier" ]; then
    echo -e "${GREEN}✅ PASS${NC}: idx_users_subscription_tier index exists"
else
    echo -e "${RED}❌ FAIL${NC}: idx_users_subscription_tier index does not exist"
    exit 1
fi

echo ""
echo "📊 Test 4: Check User Data"
echo "-----------------------------------"
echo "Current users and their subscription tiers:"
$PSQL -c "SELECT email, role, subscription_tier FROM users LIMIT 10;"

echo ""
echo "📊 Test 5: Verify Default Value"
echo "-----------------------------------"
DEFAULT_VALUE=$($PSQL -t -c "SELECT column_default FROM information_schema.columns WHERE table_name='users' AND column_name='subscription_tier';" | xargs)

if [[ "$DEFAULT_VALUE" == *"free"* ]]; then
    echo -e "${GREEN}✅ PASS${NC}: Default value is 'free'"
else
    echo -e "${YELLOW}⚠️  WARNING${NC}: Default value might not be 'free': $DEFAULT_VALUE"
fi

echo ""
echo "📊 Test 6: Backend Health Check"
echo "-----------------------------------"
HEALTH_STATUS=$(curl -s http://localhost:9090/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$HEALTH_STATUS" = "ok" ]; then
    echo -e "${GREEN}✅ PASS${NC}: Backend is healthy"
else
    echo -e "${RED}❌ FAIL${NC}: Backend health check failed"
    exit 1
fi

echo ""
echo "📊 Test 7: Count Users by Tier"
echo "-----------------------------------"
echo "Distribution of users by subscription tier:"
$PSQL -c "SELECT subscription_tier, COUNT(*) as count FROM users GROUP BY subscription_tier;"

echo ""
echo "=========================================="
echo "✅ All verification tests completed!"
echo "=========================================="
echo ""
echo "📝 Summary:"
echo "  • Database migration applied successfully"
echo "  • Schema constraints in place"
echo "  • Indexes created"
echo "  • Backend is running"
echo ""
echo "🚀 Next Steps:"
echo "  1. Login to the frontend (http://localhost:3000)"
echo "  2. Try creating 3 standalone canvases (should block at 3rd)"
echo "  3. Try creating 2 architectures for one scenario (should block at 2nd)"
echo "  4. Test collaboration on scenario architecture (should be blocked for free users)"
echo ""
echo "💡 To upgrade a user for testing:"
echo "  docker exec -i visualization-postgres psql -U postgres -d visualization_db -c \"UPDATE users SET subscription_tier = 'premium' WHERE email = 'YOUR_EMAIL';\""
echo ""
