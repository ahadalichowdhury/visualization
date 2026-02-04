# Collaboration Synchronization Fix Plan

## Problem Analysis

### Current Issues:
1. **User B Cannot See User A's Diagram**
   - When User A creates a room and works on a diagram
   - User B joins via share link
   - User B sees empty canvas, User A doesn't see User B's work
   - Neither can see each other's changes in real-time

### Root Causes:

1. **Backend Logic Flaw** (hub.go lines 323-384):
   ```go
   // WRONG: Only accepts canvas if session is empty (first user)
   sessionIsEmpty := len(session.CanvasState.Nodes) == 0
   if sessionIsEmpty && incomingHasData {
       session.CanvasState.Nodes = nodes // Only first user's data saved
   }
   ```
   - This prevents collaborative updates after the first user
   - Second user's changes are ignored

2. **Race Condition**:
   - User A's initial canvas might not be sent before User B joins
   - Backend sends empty state to User B

3. **No State Request**:
   - New users don't explicitly request current state
   - They rely on passive `full_state` message

## Solution Design

### Approach: Always-Update + Broadcast Pattern

1. **Backend Changes**:
   - **Remove "first user only" logic** - ALWAYS accept and update canvas state
   - **Always broadcast** changes to ALL connected users (except sender)
   - **Send complete state** to new joiners immediately

2. **Frontend Changes**:
   - **Eager state sending**: User A sends their canvas immediately on connection
   - **Accept all remote updates**: Don't ignore updates from backend
   - **Request state on join**: New users explicitly request current state

### Implementation Steps:

#### Step 1: Fix Backend Hub Logic
- Remove conditional acceptance of canvas updates
- Always update session state with latest changes
- Always broadcast to all users

#### Step 2: Fix Frontend Sync
- Send canvas state immediately after connecting
- Don't throttle initial state send
- Accept all incoming state updates

#### Step 3: Add State Request Message
- New message type: `request_state`
- Server responds with current canvas

#### Step 4: Testing
- User A creates room, adds 3 nodes
- User B joins, should see 3 nodes immediately
- User A adds 1 more node, User B should see it
- User B adds 1 node, User A should see it

## Implementation
