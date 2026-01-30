# 🚀 Quick Start Guide: Auto-Scaling Simulation

## ⚡ 5-Minute Tutorial

### Step 1: Start the Application

```bash
# Terminal 1: Start Backend
cd backend
go run cmd/server/main.go

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

Open browser: `http://localhost:3000`

### Step 2: Create Your Architecture

1. **Login** (or create account)
2. Click **"Scenarios"** → Select any scenario (e.g., "E-Commerce Platform")
3. Click **"Start Building"**

### Step 3: Add Components

Drag and drop from the left palette:

```
1. Add "Load Balancer" (blue icon)
2. Add "API Server" (green icon)
3. Add "Database - PostgreSQL" (purple icon)
4. Add "Cache - Redis" (orange icon)
```

### Step 4: Connect Components

Draw connections (edges) by dragging from one node to another:

```
Client → Load Balancer → API Server → Cache → Database
```

### Step 5: Configure Hardware

Click on **API Server** node:
- **Instance Type**: `c5.2xlarge` (8 vCPU, 16GB RAM)
- **Replicas**: `1` (we'll let auto-scaling add more)

Click on **Database**:
- **Instance Type**: `db.m5.large`
- **Storage**: `100 GB`

### Step 6: Enable Auto-Scaling

1. Click **"Show Simulation"** button (bottom-left, green button)
2. Click **"▶ Advanced Options"**
3. ✅ Check **"🔼 Enable Auto-Scaling"**
4. Configure:
   - **Scale Up Threshold**: `75%` (add replica when CPU > 75%)
   - **Scale Down Threshold**: `20%` (remove replica when CPU < 20%)
   - **Min Replicas**: `1`
   - **Max Replicas**: `10`
   - **Cooldown**: `10 seconds`

### Step 7: Set Traffic Load

In the simulation panel:
- **Traffic Load (RPS)**: `15000` (15,000 requests/second)
- **Traffic Pattern**: `Burst` (random spikes)
- **Duration**: `30 seconds`
- **Read/Write Ratio**: `80% read / 20% write`

### Step 8: Run Simulation

1. Click **"▶️ Run Simulation"** (big green button)
2. Wait 5-10 seconds for simulation to complete
3. Watch the results appear!

### Step 9: Playback & Watch Auto-Scaling

1. In the results panel, click **"▶️ Play"**
2. Watch the canvas:
   - **Tick 5**: API Server CPU hits 85% → **New replica appears!**
   - **Tick 12**: Still high load → **Another replica appears!**
   - **Tick 25**: Load decreases → **Replica removed**

3. Observe:
   - Nodes turn **red** when overloaded (CPU > 80%)
   - Nodes turn **yellow** when warning (CPU 60-80%)
   - Nodes turn **green** when healthy (CPU < 60%)
   - **New replicas** appear with glowing borders
   - **Edges** automatically connect to new replicas

### Step 10: Analyze Results

Check the metrics:
- **Latency**: P50, P95, P99 (should improve after scaling)
- **Throughput**: Total successful requests/second
- **Error Rate**: Should be low (< 1%)
- **Auto-Scaling Events**: See when replicas were added/removed
- **Bottlenecks**: System will suggest improvements
- **Cost**: Estimated AWS cost

## 🎯 Example Scenarios to Try

### Scenario 1: Simple API Scaling
**Setup:**
```
Load Balancer → API Server → Database
```
**Traffic:** 20,000 RPS, Burst pattern
**Expected:** API Server scales from 1 → 3 replicas

### Scenario 2: Database Read Scaling
**Setup:**
```
Load Balancer → API Server → Database (Primary)
```
**Traffic:** 15,000 RPS, 90% reads
**Expected:** Database adds read replicas

### Scenario 3: Cache Benefits
**Setup:**
```
Load Balancer → API Server → Cache → Database
```
**Traffic:** 10,000 RPS, 80% reads
**Expected:** Cache hit rate ~70%, Database load reduced

### Scenario 4: Full Stack Scaling
**Setup:**
```
CDN → Load Balancer → API Server → Cache → Database
                    ↘ Message Queue → Worker
```
**Traffic:** 50,000 RPS, Spike pattern
**Expected:** Multiple components scale, queue builds up then drains

## 🔧 Advanced Features

### Failure Injection

Test resilience by injecting failures:

```javascript
// In Advanced Options, add failure:
{
  "type": "nodeFail",
  "nodeId": "node-1",
  "startTick": 10,
  "endTick": 20
}
```

Types of failures:
- `nodeFail`: Node crashes
- `regionFail`: Entire region goes down
- `cacheFail`: Cache hit rate drops to 0%
- `dbFail`: Database becomes unavailable
- `networkDelay`: Add latency (e.g., 200ms)

### Multi-Region Testing

Add multiple regions:
1. In simulation panel, add regions:
   - `us-east` (N. Virginia)
   - `eu-central` (Frankfurt)
   - `ap-southeast` (Singapore)

2. Observe:
   - Cross-region latency
   - Traffic distribution
   - Regional failures

### Custom Traffic Patterns

**Constant:**
```
RPS: ████████████████ (steady 10,000 RPS)
```

**Burst:**
```
RPS: ██▄▄██▄▄▄███▄▄██ (random spikes 5K-15K)
```

**Spike:**
```
RPS: ████▄▄▄▄▄▄▄▄████ (sudden 3x peak at midpoint)
```

## 📊 Understanding Metrics

### Latency Percentiles
- **P50 (Median)**: 50% of requests faster than this
- **P95**: 95% of requests faster than this (SLA target)
- **P99**: 99% of requests faster than this (tail latency)

**Example:**
```
P50: 45ms   ← Most users experience this
P95: 120ms  ← 5% of users wait longer
P99: 250ms  ← 1% of users wait this long (outliers)
```

### CPU Usage Colors
- 🟢 **Green** (0-60%): Healthy, room to grow
- 🟡 **Yellow** (60-80%): Warning, approaching limit
- 🔴 **Red** (80-100%): Critical, needs scaling

### Auto-Scaling Events
```
Tick 5: 1 → 2 replicas - High load - scaling up
  ↑     ↑   ↑            ↑
  Time  Old New          Reason
```

## 🐛 Troubleshooting

### Auto-Scaling Not Working?

**Check:**
1. ✅ "Enable Auto-Scaling" checkbox is checked
2. Traffic is high enough (try 20,000+ RPS)
3. Nodes have hardware config (CPU/memory)
4. Cooldown hasn't blocked scaling (wait 10+ seconds)

**Debug:**
- Open browser console (F12)
- Look for: `"🔼 SCALED UP"` or `"🔽 SCALED DOWN"` logs
- Check simulation results → "Auto-Scaling Events" section

### No Replicas Appearing on Canvas?

**Fix:**
1. Click **"⏹️ Reset"** in playback controls
2. Click **"▶️ Play"** again
3. Ensure you're watching during the right ticks (5-15)

### Simulation Fails?

**Common Issues:**
- **No nodes**: Add at least one component
- **No connections**: Connect nodes with edges
- **Invalid connections**: Can't connect incompatible types
- **Backend down**: Check `http://localhost:9090/health`

## 💡 Pro Tips

1. **Start Simple**: Begin with 3 nodes, then add complexity
2. **Watch CPU**: Red nodes = scaling opportunity
3. **Use Presets**: Try "High Traffic" or "Black Friday" presets
4. **Compare Costs**: Run with/without auto-scaling to see savings
5. **Save Architectures**: Login to save your designs
6. **Export Results**: Download CSV/JSON for analysis

## 🎓 Learning Objectives

By using this feature, you'll understand:
- ✅ When to scale horizontally vs vertically
- ✅ How load balancers distribute traffic
- ✅ Impact of caching on database load
- ✅ Cost vs performance tradeoffs
- ✅ Bottleneck identification
- ✅ Real-world system design patterns

## 📚 Next Steps

1. **Try All Scenarios**: Test different architectures
2. **Break Things**: Inject failures, see what happens
3. **Optimize Costs**: Find the sweet spot for replicas
4. **Share Results**: Export and discuss with team
5. **Build Complex Systems**: Add queues, workers, CDNs

## 🎉 You're Ready!

Now go build some amazing architectures and watch them scale automatically! 🚀

---

**Need Help?**
- Check console logs (F12)
- Review `AUTO_SCALING_FEATURE_SUMMARY.md`
- Look at example scenarios in `/scenarios`
