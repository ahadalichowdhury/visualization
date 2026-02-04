# Collaboration Not Working - Debugging Guide 🔍

## Current Status

### ✅ What's Working:
1. Both users successfully connect to WebSocket
2. WebSocket handshake completes
3. Users send initial state requests
4. Session IDs match correctly: `ml3kvnsx-9r50iamx`

### ❌ What's Not Working:
1. Users don't receive `full_state` message from server
2. Users don't see each other in the collaboration panel
3. No "📨 Received message" logs in browser console

## Root Cause Analysis

Based on the logs, the issue is that **the backend is not sending messages to the clients**. Both users connect successfully but never receive the `full_state` message.

## Possible Issues & Solutions

### Issue 1: Backend Not Running or Not Processing WebSocket Messages

**Check:**
1. Is the Go backend running?
2. Check backend logs for these messages:
   ```
   📦 Created new collaboration session: ml3kvnsx-9r50iamx
   ✅ Client ... joined session ml3kvnsx-9r50iamx
   📤 Sent full state to client ...
   ```

**If you don't see these logs:**
- The WebSocket handler might not be working
- The hub might not be running

**Solution:**
Check backend terminal for errors. You should see:
```bash
go run cmd/server/main.go
```

### Issue 2: WebSocket Route Not Properly Configured

**Check `backend/internal/api/routes/routes.go`:**

The WebSocket route should be registered BEFORE the API routes:
```go
// Initialize WebSocket hub
hub := ws.NewHub()
go hub.Run()  // ← This MUST be called!

// ... later ...

// WebSocket endpoint
app.Get("/ws/collaborate", websocket.New(collaborationHandler.HandleWebSocket))
```

**Verify:**
1. `hub.Run()` is called (starts the hub's message processing loop)
2. WebSocket route is registered correctly

### Issue 3: CORS or WebSocket Upgrade Issues

**Check if WebSocket upgrade is working:**
In the browser console, check the Network tab:
1. Look for the WebSocket connection to `/ws/collaborate`
2. Status should be `101 Switching Protocols`
3. Check for any error messages

### Issue 4: Message Handler Not Working

**The backend should:**
1. Register client with hub: `hub.RegisterClient(client)`
2. Hub calls `sendFullState(client, session)` immediately
3. Client receives the message

## Quick Fix: Check Backend

### Step 1: Verify Backend is Running

```bash
cd backend
go run cmd/server/main.go
```

You should see:
```
Server starting...
[some startup logs]
```

### Step 2: Check Backend Logs When Client Connects

When User A enables collaboration, backend should log:
```
📦 Created new collaboration session: ml3kvnsx-9r50iamx
🔌 WebSocket connection established: user=... session=ml3kvnsx-9r50iamx
✅ Client ... joined session ml3kvnsx-9r50iamx. Total clients: 1
📤 Sent full state to client ... (nodes: 0, edges: 0)
📡 Broadcast user_presence to 0 clients in session ml3kvnsx-9r50iamx
```

When User B joins, backend should log:
```
🔌 WebSocket connection established: user=... session=ml3kvnsx-9r50iamx
✅ Client ... joined session ml3kvnsx-9r50iamx. Total clients: 2
📤 Sent full state to client ... (nodes: 0, edges: 0)
📡 Broadcast user_presence to 1 clients in session ml3kvnsx-9r50iamx
```

### Step 3: Test Backend WebSocket Directly

You can test the WebSocket endpoint directly:

```javascript
// In browser console:
const ws = new WebSocket('ws://localhost:3000/ws/collaborate?sessionId=test123&userId=user1&userName=TestUser');

ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Received:', JSON.parse(e.data));
ws.onerror = (e) => console.error('Error:', e);

// Send a request
ws.send(JSON.stringify({
  type: 'request_state',
  userId: 'user1',
  userName: 'TestUser',
  data: {},
  timestamp: Date.now()
}));
```

**Expected response:**
You should receive a `full_state` message immediately after connecting.

## Most Likely Issue

Based on the symptoms, the most likely issue is:

**The `hub.Run()` goroutine is not started in `routes.go`**

### Fix:

Open `backend/internal/api/routes/routes.go` and verify these lines exist:

```go
func Setup(app *fiber.App, repo *database.Repository, jwtService *auth.JWTService, stripe *stripeService.Service, cfg *config.Config) {
    // Initialize WebSocket hub
    hub := ws.NewHub()
    go hub.Run()  // ← THIS IS CRITICAL!
    
    // ... rest of setup ...
    
    collaborationHandler := handlers.NewCollaborationHandler(hub, repo)
    
    // ... rest of setup ...
    
    // WebSocket route (must be before other routes to avoid conflicts)
    app.Get("/ws/collaborate", websocket.New(collaborationHandler.HandleWebSocket))
}
```

### Verify Hub is Running:

Add a log statement in `hub.go` in the `Run()` method:

```go
func (h *Hub) Run() {
    log.Println("🚀 WebSocket Hub started and listening for events...")
    ticker := time.NewTicker(5 * time.Minute)
    defer ticker.Stop()

    for {
        select {
        case client := <-h.register:
            h.handleRegister(client)
        // ... rest ...
        }
    }
}
```

Restart the backend and check if you see:
```
🚀 WebSocket Hub started and listening for events...
```

## Testing Steps

1. **Restart Backend**
   ```bash
   cd backend && go run cmd/server/main.go
   ```

2. **Check for Hub Start Log**
   Should see: `🚀 WebSocket Hub started and listening for events...`

3. **Open Frontend (User A)**
   - Enable collaboration
   - Check backend logs for session creation

4. **Open Frontend (User B)**
   - Open shared link
   - Check backend logs for client joining

5. **Both Users Should See**
   - CollaborationPanel showing 2 users
   - Each other's cursors
   - Real-time updates

## Expected Backend Logs (Complete Flow)

```
🚀 WebSocket Hub started and listening for events...

[User A enables collaboration]
🔌 WebSocket connection established: user=5baf7a99... session=ml3kvnsx-9r50iamx
📦 Created new collaboration session: ml3kvnsx-9r50iamx
✅ Client 5baf7a99... (S M Ahad Ali Chowdhury 23) joined session ml3kvnsx-9r50iamx. Total clients: 1
📤 Sent full state to client 5baf7a99... (nodes: 0, edges: 0)

[User B joins]
🔌 WebSocket connection established: user=e55caa0e... session=ml3kvnsx-9r50iamx
✅ Client e55caa0e... (Test User pabna 222) joined session ml3kvnsx-9r50iamx. Total clients: 2
📤 Sent full state to client e55caa0e... (nodes: 0, edges: 0)
📡 Broadcast user_presence to 1 clients in session ml3kvnsx-9r50iamx

[User A adds a node]
📨 Received node_update from user 5baf7a99... in session ml3kvnsx-9r50iamx
📦 Updated session ml3kvnsx-9r50iamx nodes: 1 items
📡 Broadcast node_update to 1 clients in session ml3kvnsx-9r50iamx
```

## If Still Not Working

Please share:
1. Complete backend logs from startup
2. Any error messages in backend
3. Network tab in browser (WebSocket connection details)
4. Backend code in `cmd/server/main.go` (to verify hub initialization)

The issue is almost certainly in the backend not processing or sending messages properly.
