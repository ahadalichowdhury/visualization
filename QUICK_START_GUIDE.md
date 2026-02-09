# 🚀 Quick Start Guide - New Features

## Overview

This guide will help you set up and test the 2 newly implemented features:
1. **Public Architecture Gallery**
2. **Advanced Analytics & Historical Tracking**

---

## 📋 Prerequisites

- PostgreSQL database running
- Backend Go server
- Frontend React app
- User account created

---

## 🗄️ Step 1: Run Database Migrations

### Gallery Migration
```bash
# Connect to your database
psql -U postgres -d visualization_db

# Run the gallery migration
\i /Users/s.m.ahadalichowdhury/Downloads/project/visualization/backend/internal/database/migrations/005_gallery.up.sql

# Verify tables were created
\dt public_architectures
\dt gallery_likes
\dt gallery_comments

# Exit psql
\q
```

### Analytics Migration
```bash
# Connect to your database
psql -U postgres -d visualization_db

# Run the analytics migration
\i /Users/s.m.ahadalichowdhury/Downloads/project/visualization/backend/internal/database/migrations/006_analytics.up.sql

# Verify tables were created
\dt simulation_runs
\dt architecture_snapshots
\dt cost_history
\dt architecture_insights

# Exit psql
\q
```

---

## 🔧 Step 2: Restart Backend

```bash
cd /Users/s.m.ahadalichowdhury/Downloads/project/visualization/backend

# Ensure dependencies are up to date
go mod tidy

# Run the server
go run cmd/server/main.go
```

**Expected Output:**
```
Server starting on port 9090...
✓ Database connected
✓ Routes registered
✓ Gallery routes loaded
✓ Analytics routes loaded
```

---

## 💻 Step 3: Restart Frontend

```bash
cd /Users/s.m.ahadalichowdhury/Downloads/project/visualization/frontend

# Install any new dependencies (if needed)
npm install

# Start dev server
npm run dev
```

**Expected Output:**
```
VITE v4.x.x ready in XXX ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## 🧪 Step 4: Test Gallery Feature

### 4.1 Publish an Architecture

1. Open http://localhost:5173
2. **Sign in** to your account
3. Go to **Canvas/Builder**
4. Design a simple architecture (add 3-5 components)
5. Click **"Save"** button in header (give it a title)
6. Click **"Publish"** button in footer (blue button with upload icon)
7. Fill in the publish form:
   - Title: "My First Architecture"
   - Description: "A simple e-commerce platform"
   - Category: "e-commerce"
   - Complexity: "beginner"
   - Tags: "aws", "microservices"
8. Click **"Publish to Gallery"**
9. You should see success toast: "Architecture published to gallery!"

### 4.2 Browse Gallery

1. Click **"Gallery"** link in header
2. You should see your published architecture
3. Try **filters**:
   - Select category "e-commerce"
   - Select complexity "beginner"
   - Clear filters
4. Try **search**: Type your architecture title
5. Try **sorting**: Change to "Most Popular"

### 4.3 View Architecture Detail

1. Click on your architecture card
2. You should see:
   - ✅ Canvas preview (read-only)
   - ✅ Title, description, tags
   - ✅ View/like/clone counts
   - ✅ Author information
   - ✅ Comments section

### 4.4 Interact with Architecture

1. Click **"❤️ Like"** button (should fill red)
2. Click again to **unlike** (should become white)
3. Click **"📋 Clone to Workspace"**
   - Should see success: "Architecture cloned successfully!"
   - Should redirect to Builder with cloned architecture
4. Go back to Gallery → View your architecture
5. **Add a comment**: "Great architecture!"
6. Submit comment

---

## 📊 Step 5: Test Analytics Feature

### 5.1 Run Simulations

1. Go to **Canvas/Builder**
2. Load an architecture (or create a new one)
3. **Save it** (required for analytics)
4. Click **"Run Simulation"** button (green button in footer)
5. Configure workload:
   - RPS: 10,000
   - Duration: 30s
   - Mode: Constant
6. Click **"Run"**
7. Wait for simulation to complete
8. **Repeat 2-3 more times** with different RPS values (5k, 15k, 20k)

### 5.2 View Analytics

1. In Builder header, click **"Analytics"** button (blue button with chart icon)
2. You should be redirected to analytics dashboard
3. Verify you see:
   - ✅ **Summary cards**: Total simulations, Avg latency, Throughput, Cost
   - ✅ **Performance chart**: Line graph showing latency over time
   - ✅ **Recent simulations**: List of your simulation runs

### 5.3 Check Trends

1. Change **time range** to "Last 7 days"
2. Verify chart updates
3. Look for **trend indicators** on summary cards:
   - Performance Trend: "improving", "degrading", or "stable"
   - Cost Trend: "increasing", "decreasing", or "stable"

### 5.4 Test Historical Data

1. Click on a **simulation run** in the "Recent Simulations" section
2. Verify you see:
   - Timestamp
   - Duration
   - Metrics (avg latency, P95, throughput, error rate)

---

## ✅ Verification Checklist

### Gallery
- [ ] Published architecture appears in gallery
- [ ] Filters work (category, complexity)
- [ ] Search works
- [ ] Can view architecture detail
- [ ] Can like/unlike
- [ ] Can clone
- [ ] Can add comments
- [ ] View count increments

### Analytics
- [ ] Simulations are auto-saved to analytics
- [ ] Summary cards show correct data
- [ ] Performance chart renders
- [ ] Can change time range
- [ ] Recent simulations list shows runs
- [ ] Trend indicators appear
- [ ] Analytics button only shows when architecture is saved

---

## 🐛 Troubleshooting

### Database Connection Error
```
Error: Connection to database failed
```
**Solution**: Verify PostgreSQL is running and credentials in `.env` are correct

### Migration Failed
```
Error: relation "public_architectures" already exists
```
**Solution**: Migration was already run. Check tables with `\dt` in psql

### Analytics Button Missing
```
Analytics button doesn't appear in Builder header
```
**Solution**: Make sure you've **saved** the architecture first. Button only shows when `currentArchitectureId` exists.

### Simulation Not Saving to Analytics
```
Simulations run but don't appear in analytics
```
**Solution**: 
1. Check backend logs for errors
2. Verify `analytics` service is initialized in routes
3. Ensure user is authenticated when running simulation

### Gallery Empty
```
Gallery page shows "No architectures found"
```
**Solution**:
1. Verify you published an architecture
2. Check database: `SELECT * FROM public_architectures;`
3. Clear filters

---

## 📝 Sample Test Data

If you want to quickly populate the gallery, here's a script:

### Insert Sample Gallery Data (SQL)
```sql
-- Insert a sample public architecture (replace UUIDs with actual ones from your DB)
INSERT INTO public_architectures (
  id, 
  architecture_id, 
  user_id, 
  title, 
  description, 
  tags, 
  category, 
  complexity, 
  node_count, 
  edge_count
) VALUES (
  gen_random_uuid(),
  'YOUR_ARCHITECTURE_ID', -- Replace with actual architecture ID
  'YOUR_USER_ID',        -- Replace with actual user ID
  'High-Traffic E-Commerce Platform',
  'A scalable architecture for e-commerce with microservices',
  ARRAY['microservices', 'aws', 'redis', 'postgresql'],
  'e-commerce',
  'intermediate',
  15,
  22
);
```

---

## 🎉 Success!

If all tests pass, you're ready to use the new features!

**Next Steps:**
1. Share architectures with your team
2. Track performance over time
3. Discover community architectures
4. Optimize based on analytics insights

---

## 📞 Support

If you encounter issues:
1. Check backend logs: `tail -f backend/logs/server.log`
2. Check browser console for frontend errors
3. Verify database connections
4. Review migration logs

**Common Issues:**
- **CORS errors**: Check `VITE_API_URL` in frontend `.env`
- **401 Unauthorized**: Token expired, re-login
- **404 Not Found**: Backend routes not registered, restart server
- **500 Internal Server Error**: Check backend logs

---

**Estimated Setup Time**: 15-20 minutes
**Status**: ✅ Ready to test!
