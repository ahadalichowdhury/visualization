# 🔍 Debugging 401 Authentication Issue

## Issue Description
After changing backend port to 9090 and restarting Docker containers, the Stripe checkout API returns:
```
401 Unauthorized - {"error":"Invalid or expired token"}
```

## Symptoms
- User can login successfully (200 OK)
- Subscription plans API works (200 OK) 
- Stripe checkout API fails with 401
- Token is being sent in Authorization header

## Most Likely Causes

### 1. Token Not Refreshed After Login (MOST LIKELY)
**Problem**: Frontend might be using an old cached token instead of the new one from login response.

**Solution**: Clear browser cache and login again
```bash
# In browser console (F12)
localStorage.clear();
# Then logout and login again
```

### 2. Token Not Being Sent Correctly
**Problem**: Authorization header might be malformed or missing

**Test**:
```javascript
// In browser console after login
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));

// Test the API manually
fetch('http://localhost:9090/api/stripe/create-checkout-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({
    price_id: 'price_1Sv0Z8E7CJNVLFNHUCFCU78A',
    plan_id: 'premium'
  })
}).then(r => r.json()).then(console.log);
```

### 3. JWT Secret Mismatch
**Problem**: Backend JWT secret changed, old tokens invalid

**Verify**:
```bash
# Check JWT secret in backend
docker exec visualization-backend env | grep JWT_SECRET
# Should show: JWT_SECRET=your-secret-key-change-this
```

### 4. CORS Preflight Issue
**Problem**: Authorization header stripped during CORS preflight

**Check**: Backend logs show OPTIONS request before POST
```
[19:13:49] 204 - OPTIONS /api/stripe/create-checkout-session
[19:13:49] 401 - POST /api/stripe/create-checkout-session
```
✅ This is normal - OPTIONS succeeds, POST fails with 401

## Quick Fix Steps

### Step 1: Clear Browser State and Re-login
```bash
# In browser (F12 Console)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Then:
1. Login again at http://localhost:3000/login
2. Go to Subscription page
3. Try to upgrade

### Step 2: Verify Token After Login
```javascript
// In browser console after successful login
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
console.log('Token length:', token?.length);

// Decode JWT to check expiry (without verification)
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token expires:', new Date(payload.exp * 1000));
  console.log('Token issued:', new Date(payload.iat * 1000));
  console.log('User ID:', payload.user_id);
  console.log('Email:', payload.email);
  console.log('Role:', payload.role);
}
```

### Step 3: Test API Directly
```bash
# 1. Login and get token
curl -X POST http://localhost:9090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' \
  | jq -r '.token'

# 2. Copy the token and test Stripe API
TOKEN="paste_token_here"
curl -X POST http://localhost:9090/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"price_id":"price_1Sv0Z8E7CJNVLFNHUCFCU78A","plan_id":"premium"}' \
  | jq
```

### Step 4: Check Frontend Auth Store
The issue might be in Zustand store not updating the token properly.

Check: `frontend/src/store/authStore.ts`

```typescript
// Make sure login action updates token AND saves to localStorage
login: (userData, token) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userData));
  set({ user: userData, isAuthenticated: true });
},
```

## Expected Behavior

### Successful Flow:
```
1. User clicks "Upgrade Now"
2. Frontend reads token from localStorage
3. Frontend sends POST to /api/stripe/create-checkout-session
   Headers: {
     Content-Type: application/json
     Authorization: Bearer eyJhbGc...
   }
4. Backend validates token ✅
5. Backend creates Stripe session
6. Backend returns checkout URL
7. User redirected to Stripe
```

### Current Flow (Failing):
```
1. User clicks "Upgrade Now"
2. Frontend reads token from localStorage
3. Frontend sends POST to /api/stripe/create-checkout-session
4. Backend validates token ❌ Invalid or expired
5. Returns 401
```

## Debug Backend Token Validation

Add temporary logging to see what's happening:

```go
// In backend/internal/api/middleware/auth.go:32
// Before: claims, err := jwtService.ValidateToken(token)
// Add logging:
log.Printf("DEBUG: Validating token: %s...", token[:20])
claims, err := jwtService.ValidateToken(token)
if err != nil {
    log.Printf("DEBUG: Token validation failed: %v", err)
    return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
        "error": "Invalid or expired token",
    })
}
log.Printf("DEBUG: Token valid for user: %s", claims.UserID)
```

## Solution Summary

**Most likely fix**: Just clear localStorage and login again!

```bash
# Browser console
localStorage.clear();
location.href = '/login';
```

Then login and try again. This will ensure you have a fresh token that matches the current backend configuration.

---

**Date**: January 30, 2026  
**Issue**: 401 on Stripe checkout after port change  
**Status**: Investigating
