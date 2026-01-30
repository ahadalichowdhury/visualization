# Architecture Visualization & Simulation Platform - Project Overview

## 🎯 What This Project Does

This is a **full-stack cloud architecture design and simulation platform** that enables users to:

1. **Design Cloud Architectures Visually** - Drag-and-drop canvas with 40+ cloud components
2. **Simulate Real-World Performance** - Go-based engine that models traffic, resource usage, and costs
3. **Analyze Bottlenecks** - Identify performance issues before deployment
4. **Estimate Costs** - Calculate infrastructure costs based on AWS pricing
5. **Test Scenarios** - Save and share architecture templates and scenarios

---

## 🏗️ Architecture Overview

### Frontend (React + TypeScript)
- **Canvas**: React Flow for visual architecture design
- **Visualization**: Recharts for real-time metrics graphs
- **State Management**: Zustand for global state
- **Styling**: TailwindCSS with dark mode support
- **Components**: 40+ cloud service nodes (compute, storage, network, messaging)

### Backend (Go)
- **Framework**: Fiber (high-performance HTTP)
- **Database**: PostgreSQL (scenarios, architectures, users)
- **Cache**: Redis (sessions, real-time data)
- **Simulation Engine**: Custom Go engine for performance modeling
- **Auth**: JWT-based authentication with bcrypt

---

## 📦 Key Features

### 1. **Visual Architecture Builder**
- **Node Palette**: 40+ components organized by category
  - Compute: API Server, Web Server, Microservices, Workers
  - Storage: SQL/NoSQL databases, Redis, Object Storage
  - Network: Load Balancers, CDN, API Gateway
  - Messaging: Queues, Message Brokers, Event Buses
  - SRE: Monitoring, Logging, Secret Manager, WAF

- **Smart Connections**: Validates connections based on industry best practices
- **Hardware Configuration**: Configure instance types, storage, regions
- **Real-time Updates**: Live preview of architecture changes

### 2. **Performance Simulation Engine**
The Go-based simulation engine models:
- **Traffic Routing**: Request flow through the architecture
- **Resource Usage**: CPU, memory, disk I/O, network utilization
- **Latency Modeling**: Request processing times based on hardware
- **Queue Behavior**: Message queuing and processing delays
- **Failure Injection**: Test resilience with component failures
- **Autoscaling**: Dynamic scaling based on load (disabled by default)
- **Cross-Region**: Multi-region latency modeling

### 3. **Real-time Metrics Dashboard**
- **Time Series Graphs**: RPS, latency, CPU, memory over time
- **Node Activity**: Live visualization of traffic flow
- **Regional Metrics**: Performance breakdown by region
- **Alerts Panel**: Real-time warnings and errors
- **Cost Tracking**: Running cost estimation

### 4. **User Authentication System**
- **Signup/Login**: Email + password with JWT tokens
- **User Profiles**: Avatar, progress tracking
- **Role-Based Access**: Basic, Pro, Admin tiers
- **Password Reset**: Secure token-based recovery
- **Protected Routes**: Authentication middleware

### 5. **Scenario Management**
- **Save Architectures**: Persist designs to database
- **Load Scenarios**: Resume previous work
- **Templates**: Pre-built architecture patterns
  - E-commerce platform
  - Social media app
  - Real-time chat
  - Data analytics pipeline
  - IoT platform

---

## 🎨 UI/UX Features

### Modern Design System
- **Glassmorphism**: Modern gradient nodes with backdrop blur
- **Dark Mode**: Full dark mode support with theme toggle
- **Responsive**: Works on desktop and tablet
- **Keyboard Shortcuts**: Power user productivity
  - `Ctrl+Z/Y`: Undo/Redo
  - `Ctrl+C/V`: Copy/Paste
  - `Delete`: Remove selected nodes
  - `Ctrl+S`: Save architecture

### Interactive Canvas
- **Pan & Zoom**: Smooth navigation
- **Minimap**: Overview of large architectures
- **Context Menus**: Right-click for quick actions
- **Node Renaming**: Double-click to rename
- **Edge Styling**: Animated edges with traffic visualization

---

## 🔧 Technical Implementation Details

### Frontend Architecture

```
frontend/src/
├── components/
│   ├── builder/         # Canvas components
│   │   ├── CustomNode.tsx        # Node rendering with activity metrics
│   │   ├── AnimatedEdge.tsx      # Traffic flow visualization
│   │   ├── BuilderHeader.tsx     # Top toolbar
│   │   ├── BuilderFooter.tsx     # Bottom status bar
│   │   ├── NodePalette.tsx       # Component library
│   │   ├── HardwareConfigPanel.tsx  # Node configuration
│   │   ├── SimulationPanel.tsx   # Simulation controls
│   │   └── ...
│   ├── auth/            # Authentication UI
│   ├── common/          # Reusable UI components
│   └── layout/          # App layout
├── pages/
│   ├── Builder.tsx      # Main canvas page (1400+ lines!)
│   ├── Dashboard.tsx    # User dashboard
│   ├── Scenarios.tsx    # Scenario list
│   └── ...
├── services/
│   ├── simulation.service.ts  # Simulation API calls
│   ├── architecture.service.ts  # Save/load architectures
│   ├── scenario.service.ts    # Scenario management
│   └── auth.service.ts        # Authentication
├── types/
│   ├── builder.types.ts       # Node/edge definitions (600+ lines)
│   ├── simulation.types.ts    # Simulation data structures
│   └── scenario.types.ts      # Scenario schemas
└── utils/
    ├── costCalculator.ts      # AWS cost estimation
    ├── configCalculator.ts    # Hardware config defaults
    └── instanceTypes.ts       # AWS instance catalog
```

### Backend Architecture

```
backend/
├── cmd/server/
│   └── main.go          # Application entry point
├── internal/
│   ├── api/
│   │   ├── handlers/
│   │   │   ├── simulation.go    # Simulation endpoint
│   │   │   ├── architecture.go  # Save/load architectures
│   │   │   ├── scenario.go      # Scenario CRUD
│   │   │   └── auth.go          # Auth endpoints
│   │   ├── middleware/
│   │   │   └── auth.go          # JWT middleware
│   │   └── routes/
│   │       └── routes.go        # Route definitions
│   ├── simulation/
│   │   ├── engine.go      # Main simulation engine (1000+ lines)
│   │   ├── resources.go   # Resource modeling
│   │   ├── hardware.go    # Hardware specs
│   │   ├── features.go    # Feature flags
│   │   ├── regions.go     # Multi-region support
│   │   └── types.go       # Data structures
│   ├── database/
│   │   ├── postgres.go           # DB connection
│   │   ├── models/               # Data models
│   │   ├── migrations/           # SQL migrations
│   │   ├── architecture_repository.go
│   │   └── scenario_repository.go
│   ├── auth/
│   │   ├── jwt.go         # Token generation
│   │   ├── password.go    # Bcrypt hashing
│   │   └── service.go     # Auth logic
│   └── config/
│       └── config.go      # App configuration
└── scripts/
    ├── setup-db.sh        # Database setup
    └── create-admin.sh    # Admin user creation
```

---

## 🎲 How the Simulation Works

### 1. **Input Processing**
- User designs architecture on canvas
- Configures hardware for each component
- Sets workload parameters (RPS, duration, pattern)

### 2. **Simulation Engine Flow**
```
Initialization
  ↓
Generate Workload (per tick)
  ↓
Route Requests (through architecture)
  ↓
Calculate Resource Usage (CPU, memory, etc.)
  ↓
Update Queues (async processing)
  ↓
Apply Failures (if configured)
  ↓
Collect Metrics
  ↓
Repeat for N seconds
  ↓
Calculate Aggregate Metrics
  ↓
Detect Bottlenecks
  ↓
Return Results
```

### 3. **Performance Modeling**
The engine calculates realistic metrics based on:
- **Hardware specs**: CPU cores, memory, network bandwidth
- **Component type**: Database vs API server vs cache
- **Workload pattern**: Constant, spike, gradual, random
- **Traffic routing**: Load balancer distribution
- **Cross-region latency**: Geographic distance
- **Queue depths**: Async processing delays

### 4. **Bottleneck Detection**
Identifies issues:
- High CPU usage (>80%)
- Memory pressure (>85%)
- Network saturation (>90%)
- High latency (>SLA threshold)
- Error rates (>1%)
- Queue depth buildup

---

## 💡 Key Algorithms & Logic

### Traffic Routing Algorithm
```go
// Simplified flow
1. Start at entry nodes (client, mobile_app, web_browser)
2. Follow edges to route requests
3. Apply load balancer distribution (round-robin)
4. Calculate processing time based on:
   - Component latency
   - CPU/memory availability
   - Queue depth
5. Track success/failure rates
6. Propagate downstream
```

### Resource Usage Calculation
```go
// CPU usage formula
baseCPU := (requestsPerSecond / componentCapacity) * 100
actualCPU := baseCPU * (1 + randomJitter) * hardwareMultiplier
```

### Cost Estimation
```typescript
// AWS pricing
hourlyRate = instancePrice + storagePrice + transferPrice
totalCost = hourlyRate * hoursInMonth * replicas
```

---

## 🚀 Getting Started

### Quick Start (Docker)
```bash
# Start all services
docker-compose up -d

# Run database migrations
docker exec -i visualization-postgres psql -U postgres -d visualization_db < backend/internal/database/migrations/001_init.up.sql

# Access the app
open http://localhost:3000
```

### Manual Setup
```bash
# Backend
cd backend
cp env.example .env
go run cmd/server/main.go

# Frontend
cd frontend
npm install
npm run dev
```

---

## 🎯 Use Cases

1. **System Design Interviews**: Visualize and explain architectures
2. **Capacity Planning**: Estimate infrastructure needs
3. **Cost Optimization**: Compare different architecture options
4. **Learning Tool**: Understand cloud architecture patterns
5. **Documentation**: Generate architecture diagrams
6. **Performance Testing**: Model load scenarios before building

---

## 🔮 Future Enhancements (Based on existing .md files)

- ✅ Dark mode (COMPLETE)
- ✅ Keyboard shortcuts (COMPLETE)
- ✅ Cross-region simulation (COMPLETE)
- ✅ Component catalog (COMPLETE)
- 📋 Export to PNG/PDF
- 📋 Terraform/CloudFormation generation
- 📋 Real-time collaboration
- 📋 AI-powered architecture suggestions
- 📋 Integration with cloud providers

---

## 📊 Project Stats

- **Frontend**: ~20 React components, 1400+ line main page
- **Backend**: ~1000+ line simulation engine
- **Node Types**: 40+ cloud components
- **Connection Rules**: 30+ connection patterns
- **Hardware Options**: 50+ instance types
- **Regions**: 6 AWS regions supported

---

## 🐛 Recent Fixes

### Linting Issues Fixed (Jan 2026)
- Replaced `any` types in `CustomNode.tsx` with proper interfaces
- Added `ExtendedNodeData` interface for type safety
- All ESLint warnings resolved

---

## 🎉 Project Status

**Status**: ✅ **Production Ready**

All core features are implemented and tested:
- ✅ Visual builder functional
- ✅ Simulation engine working
- ✅ Authentication complete
- ✅ Database migrations ready
- ✅ Dark mode implemented
- ✅ Keyboard shortcuts active
- ✅ Cost estimation working
- ✅ No linting errors

---

## 📚 Documentation Files

The project includes extensive documentation:
- `README.md` - Main project overview
- `FOLDER_STRUCTURE.md` - Codebase organization
- `MODULE_2_AUTO_SCALING_SIMULATION.md` - Simulation details
- `SRE_CAPABILITIES.md` - Advanced features
- `COMPONENT_CATALOG_API.md` - API documentation
- `DARK_MODE_COMPLETE.md` - Dark mode implementation
- Many more in root directory...

---

## 🎨 Design Philosophy

1. **Real-world accuracy**: Simulation models actual cloud behavior
2. **User-friendly**: Intuitive drag-and-drop interface
3. **Performance**: Optimized rendering for 100+ node architectures
4. **Extensible**: Easy to add new components and features
5. **Modern**: Uses latest React/Go best practices

---

## 🤝 Key Technologies

**Frontend**:
- React 18.2, TypeScript 5.2
- React Flow 11.10 (canvas)
- Recharts 2.10 (graphs)
- TailwindCSS 3.3 (styling)
- Zustand 4.4 (state)
- Axios (HTTP client)

**Backend**:
- Go 1.21
- Fiber v2 (HTTP framework)
- PostgreSQL 15 (database)
- Redis 7 (cache)
- JWT (authentication)

**DevOps**:
- Docker & Docker Compose
- Vite (frontend build)
- ESLint + TypeScript strict mode
- Go modules

---

This is a professional-grade system design tool that combines visual design with realistic performance simulation! 🚀
