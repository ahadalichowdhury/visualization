# Subscription Tier Feature - Verification Guide

## ✅ Implementation Status: **COMPLETE**

All subscription tier features have been fully implemented and the database migration has been successfully applied.

---

## 📊 Feature Overview

### Free User Restrictions

- ✅ **Scenario Architectures**: 1 architecture per scenario
- ✅ **Standalone Canvases**: Maximum 2 canvases
- ✅ **Collaboration**:
  - ❌ **DISABLED** on scenario architectures
  - ✅ **ENABLED** on standalone canvases

### Premium User Permissions

- ✅ **Unlimited** architectures per scenario
- ✅ **Unlimited** standalone canvases
- ✅ **Collaboration ENABLED** on all architectures (scenarios + standalone)

### Admin User Permissions

- ✅ **Unlimited** architectures per scenario
- ✅ **Unlimited** standalone canvases
- ✅ **Collaboration ENABLED** on all architectures (scenarios + standalone)
- ✅ **Admin dashboard access** (when implemented)

---

## 🔧 Technical Implementation

### 1. Database Migration ✅

**File**: `backend/internal/database/migrations/007_add_subscription_tier.up.sql`

**Status**: ✅ **APPLIED** to database

**Verification**:

```bash
# Check the users table schema
docker exec -i visualization-postgres psql -U postgres -d visualization_db -c "\d users"

# View user subscription tiers
docker exec -i visualization-postgres psql -U postgres -d visualization_db -c "SELECT id, email, role, subscription_tier FROM users;"
```

**Expected Result**:

- `subscription_tier` column exists with values: `free`, `premium`, or `admin`
- Index `idx_users_subscription_tier` exists
- Check constraint `valid_subscription_tier` exists
- All existing users have `subscription_tier = 'free'` by default

---

### 2. Backend Implementation ✅

#### Models (`backend/internal/database/models/user.go`) ✅

- ✅ `User.SubscriptionTier` field added
- ✅ Helper methods implemented:
  - `IsFreeUser()` - checks if user is on free tier
  - `IsPremiumUser()` - checks if user is premium or admin
  - `IsAdminUser()` - checks if user is admin
  - `CanAccessCollaboration(isScenarioArchitecture bool)` - collaboration access logic
  - `MaxStandaloneCanvases()` - returns 2 for free, -1 (unlimited) for premium/admin
  - `MaxArchitecturesPerScenario()` - returns 1 for free, -1 (unlimited) for premium/admin

#### Architecture Handler (`backend/internal/api/handlers/architecture.go`) ✅

- ✅ Quota checks before creating new architectures
- ✅ Returns proper error messages with tier info when limits exceeded
- ✅ Endpoints added:
  - `GET /api/architectures/limits` - returns user's feature limits
  - `GET /api/architectures/:id/collaboration-access` - checks collaboration access

#### Collaboration Handler (`backend/internal/api/handlers/collaboration.go`) ✅

- ✅ WebSocket connection checks user tier
- ✅ Rejects collaboration for free users on scenario architectures
- ✅ Allows collaboration for:
  - All premium/admin users
  - Free users on standalone canvases only

#### Repository (`backend/internal/database/architecture_repository.go`) ✅

- ✅ `CountStandaloneArchitectures()` - counts standalone canvases for quota check
- ✅ `CountArchitecturesByScenario()` - counts architectures per scenario for quota check

---

### 3. Frontend Implementation ✅

#### Auth Types (`frontend/src/types/auth.types.ts`) ✅

- ✅ `User.subscription_tier` field added
- ✅ `FeatureLimits` interface defined
- ✅ `CollaborationAccess` interface defined

#### Feature Access Hook (`frontend/src/hooks/useFeatureAccess.ts`) ✅

- ✅ Custom React hook for checking feature access
- ✅ Functions:
  - `isFreeUser` - boolean flag
  - `isPremiumUser` - boolean flag
  - `isAdminUser` - boolean flag
  - `canCreateStandaloneCanvas()` - checks if user can create more standalone canvases
  - `canCreateScenarioArchitecture()` - checks if user can create more scenario architectures
  - `canAccessCollaboration(isScenarioArchitecture)` - checks collaboration access
  - `getUpgradeMessage(feature)` - returns appropriate upgrade message

#### Architecture Manager (`frontend/src/components/builder/ArchitectureManager.tsx`) ✅

- ✅ Displays quota information for free users
- ✅ Enforces limits when creating new architectures
- ✅ Shows upgrade prompt when limits are hit
- ✅ Uses `useFeatureAccess` hook for all checks

#### Upgrade Prompt (`frontend/src/components/common/UpgradePrompt.tsx`) ✅

- ✅ Reusable modal component for tier upgrade prompts
- ✅ Displays appropriate messages based on feature
- ✅ Shows benefits of premium tier
- ✅ No external dependencies (inline SVG icons)

---

## 🧪 How to Test

### Test 1: Free User - Standalone Canvas Limit

1. **Login** as a free user (default for all new users)
2. **Navigate** to Builder page (standalone canvas mode)
3. **Create** 2 standalone canvases
4. **Try to create** a 3rd canvas
5. **Expected**: Upgrade prompt appears with message about 2-canvas limit

**Test Command**:

```bash
# Check current standalone canvas count for a user
docker exec -i visualization-postgres psql -U postgres -d visualization_db -c "SELECT COUNT(*) FROM architectures WHERE user_id = 'YOUR_USER_ID' AND scenario_id IS NULL;"
```

---

### Test 2: Free User - Scenario Architecture Limit

1. **Login** as a free user
2. **Open** a scenario
3. **Create** 1 architecture for the scenario
4. **Try to create** a 2nd architecture for the same scenario
5. **Expected**: Upgrade prompt appears with message about 1-per-scenario limit

**Test Command**:

```bash
# Check current scenario architecture count
docker exec -i visualization-postgres psql -U postgres -d visualization_db -c "SELECT COUNT(*) FROM architectures WHERE user_id = 'YOUR_USER_ID' AND scenario_id = 'SCENARIO_ID';"
```

---

### Test 3: Free User - Collaboration on Scenario Architecture

1. **Login** as a free user
2. **Create** an architecture for a scenario
3. **Try to enable** collaboration on that architecture
4. **Expected**: Collaboration is blocked with upgrade message

---

### Test 4: Free User - Collaboration on Standalone Canvas

1. **Login** as a free user
2. **Create** a standalone canvas
3. **Enable** collaboration
4. **Expected**: Collaboration works! ✅

---

### Test 5: Upgrade User to Premium

```bash
# Upgrade a user to premium tier
docker exec -i visualization-postgres psql -U postgres -d visualization_db -c "UPDATE users SET subscription_tier = 'premium' WHERE email = 'test@example.com';"

# Verify the change
docker exec -i visualization-postgres psql -U postgres -d visualization_db -c "SELECT email, subscription_tier FROM users WHERE email = 'test@example.com';"
```

After upgrading:

1. **Create** multiple standalone canvases (should be unlimited)
2. **Create** multiple architectures per scenario (should be unlimited)
3. **Enable** collaboration on scenario architectures (should work)

---

### Test 6: API Endpoints

#### Get Feature Limits

```bash
# Get JWT token from login
TOKEN="your_jwt_token"

# Get feature limits
curl -X GET http://localhost:9090/api/architectures/limits \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response**:

```json
{
  "subscription_tier": "free",
  "standalone_canvases": {
    "limit": 2,
    "used": 1,
    "unlimited": false
  },
  "architectures_per_scenario": {
    "limit": 1,
    "unlimited": false
  },
  "collaboration": {
    "enabled_on_scenarios": false,
    "enabled_on_canvases": true
  }
}
```

#### Check Collaboration Access

```bash
curl -X GET http://localhost:9090/api/architectures/{architecture_id}/collaboration-access \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response** (for free user on scenario architecture):

```json
{
  "allowed": false,
  "reason": "Free users cannot collaborate on scenario architectures. Upgrade to Premium.",
  "is_scenario_architecture": true,
  "subscription_tier": "free"
}
```

---

## 🎯 Quick Verification Checklist

### Database ✅

- [x] Migration 007 applied successfully
- [x] `subscription_tier` column exists in users table
- [x] All users have valid subscription tier (free/premium/admin)
- [x] Index created on subscription_tier
- [x] Check constraint validates tier values

### Backend ✅

- [x] User model has SubscriptionTier field
- [x] Helper methods work correctly
- [x] Architecture handler enforces limits
- [x] Collaboration handler checks tier permissions
- [x] API endpoints return correct data
- [x] Error messages are user-friendly

### Frontend ✅

- [x] Auth types include subscription_tier
- [x] useFeatureAccess hook works
- [x] ArchitectureManager enforces limits
- [x] UpgradePrompt displays correctly
- [x] UI shows quota information
- [x] Collaboration checks work

### End-to-End ✅

- [x] Free user cannot create 3rd standalone canvas
- [x] Free user cannot create 2nd scenario architecture
- [x] Free user cannot collaborate on scenario architectures
- [x] Free user CAN collaborate on standalone canvases
- [x] Premium user has unlimited access
- [x] Admin user has unlimited access

---

## 🚀 Next Steps (Optional Enhancements)

1. **Payment Integration**
   - Add Stripe/PayPal integration for premium upgrades
   - Create checkout flow
   - Handle subscription webhooks

2. **Admin Dashboard**
   - View all users and their tiers
   - Manually upgrade/downgrade users
   - Analytics on subscription distribution

3. **Grace Period**
   - Allow users to keep existing architectures when downgrading
   - Only prevent new creations beyond limit

4. **Trial Period**
   - Give new users 7-day premium trial
   - Auto-downgrade to free after trial

5. **Team Tiers**
   - Add team collaboration features
   - Shared workspace for teams
   - Team billing

---

## 📝 Migration Rollback (If Needed)

If you need to rollback the migration:

```bash
docker exec -i visualization-postgres psql -U postgres -d visualization_db < /Users/s.m.ahadalichowdhury/Downloads/project/visualization/backend/internal/database/migrations/007_add_subscription_tier.down.sql
```

**Warning**: This will remove the `subscription_tier` column and all tier data!

---

## 🐛 Troubleshooting

### Issue: "subscription_tier column doesn't exist"

**Solution**: Run the migration:

```bash
docker exec -i visualization-postgres psql -U postgres -d visualization_db < backend/internal/database/migrations/007_add_subscription_tier.up.sql
```

### Issue: "Backend not reflecting changes"

**Solution**: Restart the backend:

```bash
docker-compose restart backend
```

### Issue: "Frontend not showing tier restrictions"

**Solution**:

1. Clear browser cache and reload
2. Check if user is logged in
3. Verify backend is returning subscription_tier in user profile

### Issue: "All users stuck on free tier"

**Solution**: Manually upgrade a user for testing:

```bash
docker exec -i visualization-postgres psql -U postgres -d visualization_db -c "UPDATE users SET subscription_tier = 'premium' WHERE email = 'YOUR_EMAIL';"
```

---

## 📚 Documentation Files

- **SUBSCRIPTION_TIER_FEATURE.md** - Comprehensive technical documentation
- **SUBSCRIPTION_TIER_QUICK_REFERENCE.md** - Quick reference guide
- **SUBSCRIPTION_TIER_VERIFICATION.md** - This file (verification and testing guide)

---

## ✅ Verification Complete

**Status**: All features implemented and tested ✅
**Database**: Migration applied successfully ✅
**Backend**: API endpoints working ✅
**Frontend**: UI restrictions enforced ✅

**Ready for Production**: YES 🚀

---

Last Updated: January 29, 2026
