# Collaboration Fix - Quick Test Guide

## Quick Start Testing (5 minutes)

### Test 1: Basic Two-User Collaboration ✅

**Step 1: User A (Room Creator)**
```
1. Open browser: http://localhost:3000/canvas
2. Add 2-3 nodes (drag from left sidebar)
3. Click "Collaboration Off" button (top-right)
4. Button changes to "Collaboration On" (green)
5. Click "Share Link" button
6. Copy the room URL (e.g., http://localhost:3000/canvas/room/collab-xyz123)
```

**Step 2: User B (Joiner) - New Browser/Incognito Window**
```
1. Open incognito window (or different browser)
2. Paste the room URL from User A
3. **EXPECTED**: You should immediately see User A's 2-3 nodes
4. **EXPECTED**: Green "Collaboration On" button visible
```

**Step 3: Test Real-time Updates**
```
User A: Add 1 more node
  ✅ User B should see it appear instantly

User B: Add 1 more node  
  ✅ User A should see it appear instantly

User A: Move a node
  ✅ User B should see it move in real-time

User B: Delete a node
  ✅ User A should see it disappear
```

### Test 2: Three Users 🎯

**User A**: Create room with 3 nodes
**User B**: Join (should see 3 nodes)
**User C**: Join (should see 3 nodes)

Then:
- User A adds node → Both B & C see it
- User B adds node → Both A & C see it
- User C adds node → Both A & B see it

### Test 3: Late Joiner 🕐

**User A**: 
1. Create room
2. Add 10 nodes
3. Connect them with edges
4. Work for 2-3 minutes

**User B**: 
1. Join after User A has been working
2. **EXPECTED**: Should see all 10 nodes and edges immediately

## Console Verification

### What to Look For (User A - Room Creator):
```javascript
✅ Correct Logs:
🚀 Connecting to collaboration session: collab-xyz123
✅ Connected to collaboration session: collab-xyz123
📤 Sending my current canvas to backend: 3 nodes, 2 edges
✅ Initial canvas state sent
📤 Sending complete nodes array: 4
📥 Received nodes from backend: 4
```

### What to Look For (User B - Joiner):
```javascript
✅ Correct Logs:
🚀 Connecting to collaboration session: collab-xyz123
✅ Connected to collaboration session: collab-xyz123
📥 Requested current canvas state from server
📦 Received FULL canvas state: {nodes: 3, edges: 2}
🔄 Setting nodes from server: 3
🔄 Setting edges from server: 2
```

### Backend Logs (Terminal running backend):
```
✅ Correct Logs:
✨ Created new session: collab-xyz123
👤 User Alice (user-123) joined session collab-xyz123 (Total users: 1)
📤 Sent full canvas state to user user-123: 3 nodes, 2 edges
📦 Updated nodes from Alice: 3 nodes (broadcasting to others)
👤 User Bob (user-456) joined session collab-xyz123 (Total users: 2)
📤 Sent full canvas state to user user-456: 3 nodes, 2 edges
```

## Common Issues & Fixes

### Issue: User B sees empty canvas
❌ **Problem**: Backend not running or WebSocket connection failed

✅ **Fix**: 
```bash
# Check backend is running
cd backend
go run cmd/server/main.go

# Check terminal for "WebSocket endpoint registered"
```

### Issue: Changes not appearing in real-time
❌ **Problem**: Collaboration not enabled

✅ **Fix**: 
- Both users must click "Collaboration Off" → "Collaboration On"
- Check for green indicator dot next to button
- Check console for "Connected to collaboration session"

### Issue: "Please log in" message
❌ **Problem**: Users not authenticated

✅ **Fix**: 
- Click "Sign In" (top-right)
- Use test credentials or create account
- Collaboration requires authentication

## Expected Behavior Summary

### ✅ What Should Work:
1. **Instant Sync**: User B sees User A's canvas within 1 second of joining
2. **Real-time Updates**: All changes appear within 500ms
3. **Bidirectional**: Both users can see each other's changes
4. **Multiple Users**: 2+ users can collaborate simultaneously
5. **Cursor Tracking**: See other users' cursors moving (colored dots)
6. **User List**: See list of connected users in collaboration panel

### ❌ What Won't Work (Known Limitations):
1. Undo/Redo across users (local only)
2. Selection sync (each user has independent selection)
3. Zoom/Pan sync (each user has independent viewport)
4. Chat (not implemented yet)

## Performance Expectations

- **Latency**: < 100ms for updates over local network
- **Smoothness**: 10 updates/second max (throttled)
- **Large Canvas**: Up to 100 nodes without issues
- **Concurrent Users**: Tested with 2-5 users

## Troubleshooting Commands

### Check WebSocket Connection:
```javascript
// In browser console (while on canvas page)
window.location.reload(); // Reload to see connection logs
```

### Check Backend Session State:
```bash
# Backend terminal should show:
👤 User joined session collab-xyz123 (Total users: 2)
📦 Updated nodes from Alice: 5 nodes (broadcasting to others)
```

### Force Reconnect:
```javascript
// In browser console
location.href = location.href; // Hard refresh
```

## Success Criteria ✅

Test is successful if:
1. ✅ User B sees User A's nodes immediately on join
2. ✅ User A sees User B's new nodes in real-time
3. ✅ Both users see each other in user list
4. ✅ Changes sync within 1 second
5. ✅ No console errors (ignore warnings)
6. ✅ Backend shows "broadcasting to others" logs

## Quick Video Test

Record a 30-second video:
1. User A: Create room, add 3 nodes (0-10s)
2. User B: Join, see 3 nodes instantly (10-15s)
3. User A: Add 1 node → User B sees it (15-20s)
4. User B: Add 1 node → User A sees it (20-25s)
5. Both users move nodes around simultaneously (25-30s)

If all 5 steps work smoothly, collaboration is fixed! 🎉

## Need Help?

Check these files for implementation:
- Backend: `backend/internal/websocket/hub.go`
- Frontend Hook: `frontend/src/hooks/useCollaboration.ts`
- Frontend Service: `frontend/src/services/collaboration.service.ts`
- Main Component: `frontend/src/pages/Builder.tsx`

Detailed explanation: See `COLLABORATION_SYNC_FIXED.md`
