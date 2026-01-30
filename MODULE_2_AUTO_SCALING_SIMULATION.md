# Module 2: Auto-Scaling Simulation System

## Overview

This module implements an intelligent auto-scaling simulation system that:
1. Simulates traffic load on system components
2. Monitors component metrics (CPU, memory, latency, throughput)
3. Automatically scales infrastructure based on system design best practices
4. Visualizes changes in real-time on the React Flow canvas

## Features

### 1. Traffic Simulation
- Configurable traffic intensity (requests/second)
- Realistic load distribution across components
- Gradual traffic ramp-up
- Peak traffic scenarios

### 2. Component Monitoring
- Real-time metrics tracking:
  - CPU usage (%)
  - Memory usage (%)
  - Request rate (req/s)
  - Response latency (ms)
  - Queue depth
  - Error rate (%)

### 3. Auto-Scaling Rules

#### API Server Scaling
- **Trigger**: CPU > 80% OR Memory > 85%
- **Action**: Add horizontal replica + update load balancer
- **Pattern**: Horizontal scaling

#### Database Scaling
- **Trigger**: Query latency > 500ms OR Connections > 80%
- **Action**: Add read replica OR suggest sharding
- **Pattern**: Read/Write splitting

#### Caching Layer
- **Trigger**: Database read ratio > 70% OR Latency > 300ms
- **Action**: Add Redis cache between API and DB
- **Pattern**: Cache-aside pattern

#### Message Queue
- **Trigger**: Queue depth > 1000 OR Processing lag > 5s
- **Action**: Add consumer workers
- **Pattern**: Worker pool scaling

#### Load Balancer
- **Trigger**: Backend servers > 1
- **Action**: Auto-add if not present
- **Pattern**: Reverse proxy

#### CDN/Edge Cache
- **Trigger**: Static content ratio > 50% OR Geographic latency
- **Action**: Add CDN layer
- **Pattern**: Edge caching

### 4. Canvas Auto-Update
- Real-time node insertion
- Automatic edge routing
- Smooth animations
- Auto-layout algorithm
- Component positioning logic

## Architecture

### Backend Components

```
backend/internal/
├── simulation/
│   ├── engine.go           # Core simulation engine
│   ├── metrics.go          # Metrics collection
│   ├── autoscaler.go       # Auto-scaling decision logic
│   ├── rules.go            # Scaling rules engine
│   ├── traffic.go          # Traffic generator
│   └── types.go            # Simulation types
├── api/handlers/
│   └── simulation.go       # HTTP handlers
└── websocket/
    └── simulation_hub.go   # Real-time updates
```

### Frontend Components

```
frontend/src/
├── components/simulation/
│   ├── SimulationControls.tsx    # Control panel
│   ├── MetricsDashboard.tsx      # Real-time metrics
│   ├── TrafficSlider.tsx         # Traffic intensity control
│   └── AutoScaleToggle.tsx       # Enable/disable auto-scaling
├── hooks/
│   └── useSimulation.ts          # Simulation state hook
└── services/
    └── simulation.service.ts     # API calls
```

## Implementation Steps

### Phase 1: Backend Simulation Engine
1. Create simulation engine with traffic generator
2. Implement metrics collection system
3. Build auto-scaling rules engine
4. Add WebSocket broadcasting

### Phase 2: Frontend Canvas Integration
1. Create simulation control panel
2. Implement real-time metrics dashboard
3. Build auto-node insertion logic
4. Add canvas auto-layout

### Phase 3: Integration & Testing
1. Connect WebSocket events
2. Test scaling scenarios
3. Polish animations
4. Add error handling

## API Endpoints

### Start Simulation
```
POST /api/simulation/start
{
  "canvasId": "uuid",
  "trafficIntensity": 1000,  // req/s
  "autoScalingEnabled": true,
  "duration": 300  // seconds
}
```

### Stop Simulation
```
POST /api/simulation/stop
{
  "simulationId": "uuid"
}
```

### Get Metrics
```
GET /api/simulation/:id/metrics
```

## WebSocket Events

### Server → Client

#### Metrics Update
```json
{
  "type": "metrics_update",
  "componentId": "api-server-1",
  "metrics": {
    "cpu": 85.5,
    "memory": 72.3,
    "requestRate": 1250,
    "latency": 145
  }
}
```

#### Auto-Scale Event
```json
{
  "type": "auto_scale",
  "action": "add_component",
  "component": {
    "type": "api-server",
    "id": "api-server-2",
    "position": { "x": 400, "y": 250 }
  },
  "connections": [
    { "from": "load-balancer", "to": "api-server-2" },
    { "from": "api-server-2", "to": "database" }
  ],
  "reason": "CPU overload (85.5%)"
}
```

#### Alert
```json
{
  "type": "alert",
  "severity": "warning",
  "message": "API Server CPU at 85%",
  "componentId": "api-server-1"
}
```

## Database Schema

```sql
CREATE TABLE simulations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    canvas_id UUID,
    traffic_intensity INT,
    auto_scaling_enabled BOOLEAN,
    status VARCHAR(20),
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE simulation_events (
    id UUID PRIMARY KEY,
    simulation_id UUID REFERENCES simulations(id),
    event_type VARCHAR(50),
    component_id VARCHAR(100),
    data JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE component_metrics (
    id UUID PRIMARY KEY,
    simulation_id UUID REFERENCES simulations(id),
    component_id VARCHAR(100),
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    request_rate INT,
    latency INT,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

## Example Scaling Scenarios

### Scenario 1: Simple API Scaling
```
Initial: [LB] → [API] → [DB]
Traffic: 100 → 1000 req/s
Result:  [LB] → [API-1] → [DB]
              ↘ [API-2] ↗
```

### Scenario 2: Database Read Scaling
```
Initial: [LB] → [API] → [DB-Primary]
Traffic: High read ratio
Result:  [LB] → [API] → [DB-Primary]
                      ↘ [DB-Replica]
```

### Scenario 3: Full Stack Scaling
```
Initial: [API] → [DB]
Traffic: 10,000 req/s
Result:  [CDN] → [LB] → [API-1] → [Cache] → [DB-Primary]
                      ↘ [API-2] ↗         ↘ [DB-Replica]
                      ↘ [API-3] ↗
```

## Next Steps

1. Implement backend simulation engine
2. Create frontend controls
3. Build WebSocket integration
4. Add canvas auto-layout
5. Test and refine
