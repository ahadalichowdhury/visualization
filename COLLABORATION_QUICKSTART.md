# Quick Start Guide - Real-time Collaboration

## 🚀 Getting Started

### 1. Start the Backend

```bash
cd backend
go run cmd/server/main.go
```

The backend will start on port **9090** with WebSocket support at `ws://localhost:9090/ws/collaborate`

### 2. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on port **5173** (or 3000 depending on your setup)

### 3. Test Collaboration

#### Option A: Two Browser Windows

1. Open `http://localhost:5173/builder` in one browser window
2. Log in with a test account
3. Click "Collaboration Off" button in the header → turns green "Collaboration On"
4. Open the same URL in another browser window (or incognito)
5. Log in with a different test account
6. Enable collaboration in the second window
7. You should now see each other in the CollaborationPanel (top-left)

#### Option B: Two Different Browsers

1. Open Chrome at `http://localhost:5173/builder`
2. Open Firefox at `http://localhost:5173/builder`
3. Log in with different accounts in each
4. Enable collaboration in both
5. Start editing - you'll see real-time updates!

---

## ✨ What You Should See

### When Collaboration is Enabled:

- ✅ Green "Collaboration On" button with pulse animation in header
- ✅ CollaborationPanel appears in top-left corner
- ✅ Your user listed in the panel
- ✅ Other users appear when they join
- ✅ Each user has a unique color

### When Another User Joins:

- ✅ Their name appears in the CollaborationPanel
- ✅ You see their cursor moving on the canvas (if they move their mouse)
- ✅ You see their nodes and edges in real-time
- ✅ Collaborator count increases in header button

### When You Edit a Node:

- ✅ Click a node → it locks automatically
- ✅ Other users see a warning if they try to edit it
- ✅ Lock releases when you close the config panel

---

## 🧪 Testing Checklist

### Basic Tests

- [ ] Enable collaboration (button turns green)
- [ ] See yourself in the CollaborationPanel
- [ ] Open second browser/window
- [ ] See second user appear in first window
- [ ] Move mouse → see cursor in other window
- [ ] Add a node → see it appear in other window
- [ ] Delete a node → see it disappear in other window
- [ ] Connect two nodes → see edge in other window

### Lock Tests

- [ ] User A clicks a node
- [ ] User B tries to click same node → sees warning
- [ ] User A closes config panel
- [ ] User B can now click the node

### Connection Tests

- [ ] Disable collaboration → CollaborationPanel disappears
- [ ] Re-enable → reconnects successfully
- [ ] Close one browser → user disappears from other

---

## 🐛 Troubleshooting

### "Collaboration Off" button doesn't work

- **Issue**: Not logged in
- **Solution**: Click "Login" button in header first

### WebSocket connection fails

- **Issue**: Backend not running or wrong port
- **Solution**: Check backend is running on port 9090
- **Check**: Look for `Server starting on port 9090` in backend logs

### Can't see other users

- **Issue**: Both users in different sessions
- **Solution**: Make sure both users open the **same architecture**
  - Save architecture with "Save" button
  - Share the architecture ID or load same architecture from "My Architectures"

### Cursors not showing

- **Issue**: Mouse not moving over canvas area
- **Solution**: Move mouse over the white canvas area (not sidebars)

### Backend WebSocket errors

- **Issue**: CORS or connection refused
- **Solution**: Check `backend/.env` has:
  ```
  ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
  ```

---

## 🔧 Configuration

### Backend Environment Variables

File: `backend/.env`

```env
PORT=9090
DB_HOST=localhost
DB_PORT=5432
DB_NAME=visualization_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend Environment Variables

File: `frontend/.env`

```env
VITE_API_URL=http://localhost:9090
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Note**: WebSocket URL is auto-detected based on `window.location.hostname:9090`

---

## 📊 Monitoring

### Backend Logs

Watch for these messages:

```
Created new session: <session-id>
User <name> (<id>) joined session <session-id>
User <id> left session <session-id>
Cleaned up empty session: <session-id>
```

### Frontend Console

Watch for these messages:

```
🔗 Connected to collaboration session: <session-id>
🔌 Disconnected from collaboration session
Reconnecting... (attempt X/5)
```

### Browser DevTools

1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Look for `ws://localhost:9090/ws/collaborate`
4. Click on it to see messages being sent/received

---

## 🎯 Demo Scenario

Perfect way to demo the feature:

1. **User A** (Chrome):
   - Log in as `demo@example.com`
   - Create a new architecture
   - Add an API Server node
   - Enable collaboration

2. **User B** (Firefox):
   - Log in as `demo2@example.com`
   - Load the same architecture from "My Architectures"
   - Enable collaboration
   - See User A's API Server node
   - Add a Database node

3. **Both Users**:
   - User A adds a Load Balancer
   - User B sees it appear instantly
   - User B connects API Server to Database
   - User A sees the connection
   - User A clicks API Server (locks it)
   - User B tries to click it → sees warning
   - User A closes config → unlock
   - User B can now edit it

---

## 🎉 Success Criteria

You'll know it's working when:

- ✅ Two users see each other's changes instantly
- ✅ Cursors appear and move smoothly
- ✅ Lock warnings prevent conflicts
- ✅ Connection status shows "Connected" with pulse
- ✅ Collaborator count is accurate

---

## 📞 Support

If you encounter issues:

1. Check backend logs for errors
2. Check frontend console for WebSocket errors
3. Verify both users are in the same session
4. Ensure backend is running on port 9090
5. Try disabling/re-enabling collaboration

---

**Status**: ✅ Ready to test!
**Time to test**: ~5 minutes
**Minimum requirements**: 2 browser windows or 2 users
