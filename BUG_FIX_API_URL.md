# 🐛 Bug Fix: API URL Issue in Subscription Page

## Problem

The subscription page was trying to fetch from:

```
http://localhost:3000/undefined/api/subscription/plans
```

**Error:** `VITE_API_URL` environment variable was `undefined`, causing the URL to be malformed.

## Root Cause

The code was using `import.meta.env.VITE_API_URL` directly without a fallback:

```typescript
// ❌ BEFORE (Broken)
const response = await fetch(
  `${import.meta.env.VITE_API_URL}/api/subscription/plans`,
  { headers },
);
```

When `VITE_API_URL` is not set, it returns `undefined`, resulting in:

- `/undefined/api/subscription/plans` ❌
- Browser tries to fetch from current origin + undefined ❌
- Returns HTML page instead of JSON ❌

## Solution

Added a fallback to `http://localhost:9090` (same pattern used in other services):

```typescript
// ✅ AFTER (Fixed)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9090";

const response = await fetch(`${API_URL}/api/subscription/plans`, { headers });
```

## Changes Made

**File:** `frontend/src/pages/Subscription.tsx`

1. Added constant at top of file:

```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9090";
```

2. Updated fetch URL in `useEffect`:

```typescript
// Before: `${import.meta.env.VITE_API_URL}/api/subscription/plans`
// After:  `${API_URL}/api/subscription/plans`
```

3. Updated fetch URL in `handleUpgrade`:

```typescript
// Before: `${import.meta.env.VITE_API_URL}/api/user/subscription`
// After:  `${API_URL}/api/user/subscription`
```

## Testing

### Before Fix

```
Request URL: http://localhost:3000/undefined/api/subscription/plans
Status: 200 (but returns HTML instead of JSON)
Error: "Failed to load subscription plans"
```

### After Fix

```
Request URL: http://localhost:9090/api/subscription/plans
Status: 200
Response: JSON with subscription plans ✅
```

## Why This Pattern?

This is the **same pattern** used in other services:

**`services/api.ts`:**

```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9090";
```

**`services/catalogService.ts`:**

```typescript
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:9090";
```

**`utils/constants.ts`:**

```typescript
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:9090/api";
```

## Environment Variable

The `VITE_API_URL` is optional and can be set in:

**`.env` (development):**

```env
VITE_API_URL=http://localhost:9090
```

**`.env.production` (production):**

```env
VITE_API_URL=https://api.yourproduction.com
```

If not set, it defaults to `http://localhost:9090` for local development.

## Result

✅ **Fixed!** Subscription page now loads plans correctly from the API.

---

**Fixed Date:** January 30, 2026  
**File Modified:** `frontend/src/pages/Subscription.tsx`  
**Lines Changed:** 3 locations (added const + 2 URLs)  
**Status:** ✅ Resolved
