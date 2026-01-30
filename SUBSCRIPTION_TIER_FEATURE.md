# Subscription Tier Feature Implementation

## Overview

This document describes the subscription tier feature that implements access control based on user subscription levels (Free, Premium, Admin).

## Feature Summary

### Free Tier
- **Standalone Canvases**: Maximum 2 canvases
- **Scenario Architectures**: Maximum 1 architecture per scenario
- **Collaboration**: 
  - ✅ Enabled on standalone canvases
  - ❌ Disabled on scenario architectures

### Premium Tier
- **Standalone Canvases**: Unlimited
- **Scenario Architectures**: Unlimited per scenario
- **Collaboration**: 
  - ✅ Enabled on standalone canvases
  - ✅ Enabled on scenario architectures

### Admin Tier
- All Premium features
- Full administrative access
- User management capabilities

## Architecture

### Backend Implementation

#### 1. Database Schema

**Migration**: `007_add_subscription_tier.up.sql`

```sql
ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free';
ALTER TABLE users ADD CONSTRAINT valid_subscription_tier 
  CHECK (subscription_tier IN ('free', 'premium', 'admin'));
```

#### 2. User Model Extensions

**File**: `backend/internal/database/models/user.go`

New fields and methods:
- `SubscriptionTier` field added to `User` struct
- Helper methods:
  - `IsFreeUser()` - Check if user is on free tier
  - `IsPremiumUser()` - Check if user is premium or admin
  - `IsAdminUser()` - Check if user is admin
  - `CanAccessCollaboration(isScenarioArchitecture bool)` - Check collaboration access
  - `MaxStandaloneCanvases()` - Get max standalone canvases (-1 for unlimited)
  - `MaxArchitecturesPerScenario()` - Get max architectures per scenario (-1 for unlimited)

#### 3. Middleware

**File**: `backend/internal/api/middleware/auth.go`

New middleware functions:
- `RequireSubscriptionTier(allowedTiers ...string)` - Require specific tier
- `RequireFeatureAccess(check FeatureCheck)` - Custom feature checks

#### 4. Architecture Handler

**File**: `backend/internal/api/handlers/architecture.go`

Updated `SaveArchitecture` method:
- Checks standalone canvas limit for free users
- Checks scenario architecture limit for free users
- Returns quota information in error responses

New endpoints:
- `GET /api/architectures/limits` - Get feature limits for current user
- `GET /api/architectures/:id/collaboration-access` - Check collaboration access

#### 5. Collaboration Handler

**File**: `backend/internal/api/handlers/collaboration.go`

Updated `HandleWebSocket` method:
- Validates architecture ID
- Checks user's subscription tier
- Blocks collaboration on scenario architectures for free users
- Returns descriptive error messages

#### 6. Database Repository

**File**: `backend/internal/database/architecture_repository.go`

New method:
- `CountArchitecturesByScenario(ctx, userID, scenarioID)` - Count architectures for a specific scenario

### Frontend Implementation

#### 1. Type Definitions

**File**: `frontend/src/types/auth.types.ts`

New interfaces:
```typescript
interface User {
  subscription_tier: 'free' | 'premium' | 'admin';
  // ... existing fields
}

interface FeatureLimits {
  subscription_tier: string;
  standalone_canvases: {
    limit: number;
    used: number;
    unlimited: boolean;
  };
  architectures_per_scenario: {
    limit: number;
    unlimited: boolean;
  };
  collaboration: {
    enabled_on_scenarios: boolean;
    enabled_on_canvases: boolean;
  };
}

interface CollaborationAccess {
  can_collaborate: boolean;
  is_scenario_architecture: boolean;
  subscription_tier: string;
  reason: string;
}
```

#### 2. Services

**File**: `frontend/src/services/architecture.service.ts`

New methods:
- `getFeatureLimits()` - Fetch user's feature limits
- `checkCollaborationAccess(architectureId)` - Check collaboration access for specific architecture

#### 3. Custom Hook

**File**: `frontend/src/hooks/useFeatureAccess.ts`

Provides convenient access to feature limits and tier checks:
- `isFreeUser`, `isPremiumUser`, `isAdminUser` - Tier checks
- `canCreateStandaloneCanvas()` - Check if can create more canvases
- `canAccessCollaboration(isScenarioArchitecture)` - Check collaboration access
- `getUpgradeMessage(feature)` - Get contextual upgrade message

#### 4. Upgrade Prompt Component

**File**: `frontend/src/components/common/UpgradePrompt.tsx`

Beautiful modal that shows:
- Feature limitation message
- List of Premium benefits
- Upgrade and dismiss buttons

#### 5. Architecture Manager Updates

**File**: `frontend/src/components/builder/ArchitectureManager.tsx`

- Shows tier limits in header
- Validates limits before creating new architecture
- Shows upgrade prompt when limit reached

## API Endpoints

### Feature Limits
```
GET /api/architectures/limits
Authorization: Bearer <token>

Response:
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

### Collaboration Access Check
```
GET /api/architectures/:id/collaboration-access
Authorization: Bearer <token>

Response:
{
  "can_collaborate": false,
  "is_scenario_architecture": true,
  "subscription_tier": "free",
  "reason": "free_users_cannot_collaborate_on_scenario_architectures"
}
```

### Create Architecture (with limits)
```
POST /api/architectures
Authorization: Bearer <token>

Error Response (when limit reached):
{
  "error": "You have reached the maximum number of standalone canvases...",
  "premium": true,
  "tier": "free",
  "quota": {
    "used": 2,
    "limit": 2
  }
}
```

## WebSocket Collaboration

Free users connecting to WebSocket for scenario architecture collaboration will be rejected:

```javascript
// Connection parameters
ws://localhost:9090/ws/collaborate?
  sessionId=<session>&
  userId=<user>&
  userName=<name>&
  architectureId=<arch_id>

// Close message for free users on scenario architectures:
"Collaboration not available. Free users cannot collaborate on scenario architectures. Upgrade to Premium."
```

## User Experience Flow

### Scenario 1: Free User Creating Standalone Canvas

1. User clicks "New Architecture" in standalone mode
2. System checks: `canCreateStandaloneCanvas()`
3. If at limit (2):
   - Show upgrade prompt
   - Block creation
4. If under limit:
   - Allow creation
   - Show remaining quota in UI

### Scenario 2: Free User Creating Scenario Architecture

1. User clicks "New Architecture" in scenario mode
2. System checks existing architectures for scenario
3. If at limit (1):
   - Show upgrade prompt
   - Block creation
4. If under limit:
   - Allow creation

### Scenario 3: Free User Attempting Collaboration on Scenario

1. User attempts to join collaboration on scenario architecture
2. WebSocket checks user tier and architecture type
3. Connection rejected with upgrade message
4. Frontend shows upgrade prompt

## Testing

### Backend Tests

Test cases to implement:
- Free user can create up to 2 standalone canvases
- Free user blocked from creating 3rd standalone canvas
- Free user can create 1 architecture per scenario
- Free user blocked from creating 2nd architecture for same scenario
- Premium user has unlimited canvases and architectures
- Free user blocked from WebSocket collaboration on scenarios
- Free user allowed WebSocket collaboration on canvases
- Feature limits endpoint returns correct data

### Frontend Tests

Test cases to implement:
- `useFeatureAccess` hook returns correct tier info
- Upgrade prompt shows when limit reached
- Architecture Manager displays quota correctly
- Create button blocked when at limit
- Collaboration button disabled for free users on scenarios

## Migration Guide

### Existing Users

Run migration to add `subscription_tier` column:
```bash
# The migration automatically sets tier based on role:
# role='admin' -> tier='admin'
# role='pro' -> tier='premium'
# role='basic' -> tier='free'
```

### New Users

All new users default to `subscription_tier='free'`

## Configuration

No additional configuration required. Feature is controlled by:
- Database column: `users.subscription_tier`
- Hard-coded limits in `user.go` model methods

## Future Enhancements

Potential improvements:
1. Dynamic tier configuration (database-driven limits)
2. Stripe/payment integration for upgrades
3. Trial periods for Premium features
4. Team/organization tiers
5. Usage analytics dashboard
6. Soft limits with warnings before hard limits

## Troubleshooting

### Common Issues

**Issue**: User shows as free but should be premium
- Check `subscription_tier` column in database
- Verify JWT token includes latest user data
- Try logout/login to refresh token

**Issue**: Collaboration not working on standalone canvas
- Verify `architectureId` parameter in WebSocket URL
- Check that architecture has `scenario_id=NULL`
- Verify user tier is correctly set

**Issue**: Limits not enforcing
- Check backend logs for quota check errors
- Verify database repository methods are called
- Test API endpoints directly with curl/Postman

## Support

For issues or questions:
- Backend: Check `backend/internal/database/models/user.go`
- Frontend: Check `frontend/src/hooks/useFeatureAccess.ts`
- WebSocket: Check `backend/internal/api/handlers/collaboration.go`
