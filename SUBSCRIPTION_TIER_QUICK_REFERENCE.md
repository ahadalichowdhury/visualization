# Subscription Tier Feature - Quick Reference

## Implementation Complete ✅

A comprehensive subscription tier system has been implemented with three tiers: **Free**, **Premium**, and **Admin**.

## Feature Matrix

| Feature | Free User | Premium User | Admin |
|---------|-----------|--------------|-------|
| **Standalone Canvases** | Max 2 | Unlimited ♾️ | Unlimited ♾️ |
| **Architectures per Scenario** | Max 1 | Unlimited ♾️ | Unlimited ♾️ |
| **Collaboration on Standalone Canvases** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Collaboration on Scenario Architectures** | ❌ No | ✅ Yes | ✅ Yes |
| **Premium Scenarios** | ❌ No | ✅ Yes | ✅ Yes |
| **Admin Features** | ❌ No | ❌ No | ✅ Yes |

## Key Files Modified/Created

### Backend
- ✅ `backend/internal/database/migrations/007_add_subscription_tier.up.sql` - Database migration
- ✅ `backend/internal/database/models/user.go` - User model with tier methods
- ✅ `backend/internal/api/middleware/auth.go` - Tier-based middleware
- ✅ `backend/internal/api/handlers/architecture.go` - Limit enforcement
- ✅ `backend/internal/api/handlers/collaboration.go` - WebSocket tier checks
- ✅ `backend/internal/database/architecture_repository.go` - Count methods
- ✅ `backend/internal/api/routes/routes.go` - New endpoints
- ✅ `backend/internal/auth/service.go` - Default tier assignment

### Frontend
- ✅ `frontend/src/types/auth.types.ts` - Type definitions
- ✅ `frontend/src/services/architecture.service.ts` - API methods
- ✅ `frontend/src/hooks/useFeatureAccess.ts` - Feature access hook
- ✅ `frontend/src/components/common/UpgradePrompt.tsx` - Upgrade modal
- ✅ `frontend/src/components/builder/ArchitectureManager.tsx` - Limit UI

### Documentation
- ✅ `SUBSCRIPTION_TIER_FEATURE.md` - Complete documentation
- ✅ `SUBSCRIPTION_TIER_QUICK_REFERENCE.md` - This file

## API Endpoints

### New Endpoints
```
GET /api/architectures/limits
GET /api/architectures/:id/collaboration-access
```

### Modified Endpoints
- `POST /api/architectures` - Now enforces limits
- `PUT /api/architectures/:id` - Validates tier access
- `ws://localhost:9090/ws/collaborate` - Requires architectureId param, checks tier

## How It Works

### For Free Users

**Creating Standalone Canvas:**
1. Click "New Architecture"
2. System checks count (0, 1, or 2)
3. If at limit → Show upgrade prompt ❌
4. If under limit → Allow creation ✅

**Creating Scenario Architecture:**
1. Click "New Architecture" in scenario
2. System checks count for that scenario
3. If already have 1 → Show upgrade prompt ❌
4. If have 0 → Allow creation ✅

**Attempting Collaboration:**
- On standalone canvas → Works normally ✅
- On scenario architecture → Blocked with upgrade prompt ❌

### For Premium/Admin Users
- All features unlocked
- No limits enforced
- Full collaboration access

## Testing the Feature

### Manual Testing Steps

1. **Test Free User Standalone Canvas Limit:**
   ```bash
   # Create user with free tier (default)
   # Create canvas 1 → Success ✅
   # Create canvas 2 → Success ✅
   # Create canvas 3 → Blocked with upgrade prompt ❌
   ```

2. **Test Free User Scenario Limit:**
   ```bash
   # Open scenario
   # Create architecture 1 → Success ✅
   # Create architecture 2 → Blocked with upgrade prompt ❌
   ```

3. **Test Collaboration Restriction:**
   ```bash
   # Free user joins standalone canvas collaboration → Works ✅
   # Free user joins scenario collaboration → Blocked ❌
   ```

### Database Setup

To manually set a user's tier:
```sql
-- Set user to premium
UPDATE users SET subscription_tier = 'premium' WHERE email = 'user@example.com';

-- Set user to admin
UPDATE users SET subscription_tier = 'admin' WHERE email = 'admin@example.com';

-- Set user to free
UPDATE users SET subscription_tier = 'free' WHERE email = 'user@example.com';
```

## User Upgrade Flow

When a free user hits a limit:
1. **Upgrade prompt appears** with:
   - Clear explanation of limitation
   - List of Premium benefits
   - "Maybe Later" button (dismisses)
   - "Upgrade Now" button (opens pricing page)

2. After upgrade (manual in database):
   - User logs out and back in
   - Token refreshes with new tier
   - All limits removed

## Error Messages

### Free User Messages
- **Standalone canvas limit:** "You have reached the maximum number of standalone canvases (2). Upgrade to Premium for unlimited canvases."
- **Scenario limit:** "You have reached the maximum number of architectures for this scenario (1). Upgrade to Premium for unlimited architectures per scenario."
- **Collaboration blocked:** "Collaboration not available. Free users cannot collaborate on scenario architectures. Upgrade to Premium."

### API Error Format
```json
{
  "error": "You have reached the maximum...",
  "premium": true,
  "tier": "free",
  "quota": {
    "used": 2,
    "limit": 2
  }
}
```

## Integration Checklist

To integrate this feature into your deployment:

- [x] Run database migration `007_add_subscription_tier.up.sql`
- [ ] Deploy backend with updated handlers
- [ ] Deploy frontend with new components
- [ ] Test all three user tiers
- [ ] Set up payment/upgrade system (optional, future enhancement)
- [ ] Update user documentation
- [ ] Train support team on tier differences

## Next Steps / Future Enhancements

1. **Payment Integration**
   - Stripe integration for upgrades
   - Automatic tier assignment after payment

2. **Analytics Dashboard**
   - Track usage by tier
   - Identify upgrade opportunities

3. **Soft Limits**
   - Warning at 80% of limit
   - Grace period before hard block

4. **Team Features**
   - Organization tiers
   - Shared canvases within teams

5. **Trial Periods**
   - 14-day Premium trial
   - Feature previews

## Support & Maintenance

**Common Admin Tasks:**

1. **Upgrade a user manually:**
   ```sql
   UPDATE users SET subscription_tier = 'premium' WHERE id = '<user-id>';
   ```

2. **Check user's current usage:**
   ```bash
   curl -H "Authorization: Bearer <token>" \
     http://localhost:9090/api/architectures/limits
   ```

3. **View all users by tier:**
   ```sql
   SELECT subscription_tier, COUNT(*) 
   FROM users 
   GROUP BY subscription_tier;
   ```

## Contact

For questions or issues with this feature:
- See full documentation: `SUBSCRIPTION_TIER_FEATURE.md`
- Check code comments in modified files
- Review API endpoint responses for detailed error messages

---

**Status**: ✅ Feature Complete & Ready for Testing
**Version**: 1.0
**Last Updated**: 2026-01-29
