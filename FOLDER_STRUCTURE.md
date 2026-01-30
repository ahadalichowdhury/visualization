# Folder Structure Documentation

## Overview

This document explains the complete folder structure for the Visualization Platform.

## Root Structure

```
visualization/
├── frontend/              # React frontend application
├── backend/               # Go backend services
├── config/                # Shared configuration files
├── docker-compose.yml     # Docker orchestration
├── .gitignore            # Git ignore rules
└── README.md             # Project documentation
```

## Frontend Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── canvas/         # React Flow components
│   │   │   ├── Node.tsx            # Custom node component
│   │   │   ├── Edge.tsx            # Custom edge component
│   │   │   ├── Controls.tsx        # Canvas controls
│   │   │   └── Canvas.tsx          # Main canvas component
│   │   ├── graphs/         # Recharts visualization components
│   │   │   ├── LineChart.tsx       # Line chart component
│   │   │   ├── BarChart.tsx        # Bar chart component
│   │   │   ├── PieChart.tsx        # Pie chart component
│   │   │   └── Dashboard.tsx       # Chart dashboard
│   │   ├── common/         # Reusable UI components
│   │   │   ├── Button.tsx          # Button component
│   │   │   ├── Input.tsx           # Input component
│   │   │   ├── Modal.tsx           # Modal component
│   │   │   └── Card.tsx            # Card component
│   │   ├── auth/           # Authentication components
│   │   │   ├── LoginForm.tsx       # Login form
│   │   │   ├── RegisterForm.tsx    # Registration form
│   │   │   └── ProtectedRoute.tsx  # Route guard
│   │   └── layout/         # Layout components
│   │       ├── Header.tsx          # Page header
│   │       ├── Sidebar.tsx         # Sidebar navigation
│   │       ├── Footer.tsx          # Page footer
│   │       └── Layout.tsx          # Main layout wrapper
│   ├── hooks/              # Custom React hooks
│   │   ├── useWebSocket.ts        # WebSocket hook
│   │   ├── useAuth.ts             # Authentication hook
│   │   ├── useCanvas.ts           # Canvas manipulation hook
│   │   └── useChartData.ts        # Chart data management
│   ├── store/              # Zustand state management
│   │   ├── authStore.ts           # Authentication state
│   │   ├── canvasStore.ts         # Canvas state
│   │   ├── chartStore.ts          # Chart data state
│   │   └── wsStore.ts             # WebSocket state
│   ├── services/           # API and service layer
│   │   ├── api.ts                 # Axios API client
│   │   ├── auth.service.ts        # Auth API calls
│   │   ├── canvas.service.ts      # Canvas API calls
│   │   ├── simulation.service.ts  # Simulation API calls
│   │   └── websocket.service.ts   # WebSocket client
│   ├── utils/              # Utility functions
│   │   ├── formatters.ts          # Data formatters
│   │   ├── validators.ts          # Input validators
│   │   ├── helpers.ts             # Helper functions
│   │   └── constants.ts           # App constants
│   ├── styles/             # Global styles
│   │   ├── index.css              # Main stylesheet (Tailwind)
│   │   └── variables.css          # CSS variables
│   ├── types/              # TypeScript definitions
│   │   ├── auth.types.ts          # Auth types
│   │   ├── canvas.types.ts        # Canvas types
│   │   ├── chart.types.ts         # Chart types
│   │   └── api.types.ts           # API response types
│   ├── pages/              # Page components
│   │   ├── Home.tsx               # Home page
│   │   ├── Login.tsx              # Login page
│   │   ├── Dashboard.tsx          # Main dashboard
│   │   └── NotFound.tsx           # 404 page
│   ├── App.tsx             # Root component
│   └── main.tsx            # Application entry point
├── public/                 # Static assets
│   ├── vite.svg
│   └── favicon.ico
├── index.html             # HTML template
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
├── postcss.config.js      # PostCSS configuration
├── .eslintrc.cjs          # ESLint configuration
├── Dockerfile             # Docker build file
├── nginx.conf             # Nginx configuration
└── README.md              # Frontend documentation
```

## Backend Structure

```
backend/
├── cmd/
│   └── server/              # Application entry point
│       └── main.go          # Main server file
├── internal/                # Private application code
│   ├── api/
│   │   ├── handlers/        # HTTP request handlers
│   │   │   ├── auth.go             # Auth handlers
│   │   │   ├── simulation.go       # Simulation handlers
│   │   │   ├── canvas.go           # Canvas handlers
│   │   │   └── health.go           # Health check
│   │   ├── middleware/      # Fiber middleware
│   │   │   ├── auth.go             # JWT middleware
│   │   │   ├── cors.go             # CORS middleware
│   │   │   ├── logger.go           # Logging middleware
│   │   │   └── ratelimit.go        # Rate limiting
│   │   └── routes/          # Route definitions
│   │       └── routes.go           # Route setup
│   ├── auth/                # Authentication logic
│   │   ├── jwt.go                  # JWT generation/validation
│   │   ├── password.go             # Password hashing (bcrypt)
│   │   └── service.go              # Auth business logic
│   ├── cache/               # Redis cache layer
│   │   ├── redis.go                # Redis client
│   │   └── cache.go                # Cache interface
│   ├── config/              # Configuration management
│   │   ├── config.go               # Config loader
│   │   └── types.go                # Config types
│   ├── database/            # Database layer
│   │   ├── models/          # Database models
│   │   │   ├── user.go             # User model
│   │   │   ├── simulation.go       # Simulation model
│   │   │   └── canvas.go           # Canvas data model
│   │   ├── migrations/      # SQL migrations
│   │   │   ├── 001_init.up.sql
│   │   │   ├── 001_init.down.sql
│   │   │   └── README.md
│   │   ├── postgres.go             # PostgreSQL connection
│   │   └── repository.go           # Data access layer
│   ├── simulation/          # Simulation engine
│   │   ├── engine.go               # Core simulation engine
│   │   ├── worker.go               # Simulation workers
│   │   ├── types.go                # Simulation types
│   │   └── algorithms.go           # Simulation algorithms
│   └── websocket/           # WebSocket layer
│       ├── hub.go                  # WebSocket hub (connection manager)
│       ├── client.go               # WebSocket client
│       ├── handlers.go             # WS message handlers
│       └── types.go                # WebSocket types
├── pkg/                     # Public libraries (can be imported by other projects)
│   ├── types/               # Shared types
│   │   └── common.go
│   └── utils/               # Utility functions
│       ├── logger.go               # Logging utilities
│       └── errors.go               # Error handling
├── go.mod                   # Go module file
├── go.sum                   # Go dependencies checksum
├── Makefile                 # Build automation
├── Dockerfile               # Docker build file
├── .env.example             # Environment variables template
├── .gitignore              # Git ignore rules
└── README.md               # Backend documentation
```

## Configuration Structure

```
config/
├── docker/                  # Docker-specific configs
│   ├── postgres.env        # PostgreSQL environment
│   └── redis.conf          # Redis configuration
└── nginx/                   # Nginx configs
    └── default.conf        # Default site config
```

## Key Design Decisions

### Frontend

1. **Component Organization**
   - Organized by feature/domain (canvas, graphs, auth)
   - Common components are reusable across features
   - Layout components provide consistent structure

2. **State Management**
   - Zustand stores separated by domain
   - WebSocket state isolated for real-time updates
   - Auth state persisted to localStorage

3. **Services Layer**
   - Centralized API client configuration
   - Service files group related API calls
   - WebSocket service handles connection lifecycle

### Backend

1. **Project Layout**
   - Follows Go standard project layout
   - `internal/` contains private application code
   - `pkg/` contains reusable public libraries
   - `cmd/` contains application entry points

2. **Separation of Concerns**
   - Handlers: HTTP request/response
   - Services: Business logic
   - Repository: Data access
   - Models: Data structures

3. **Simulation Engine**
   - Worker pool pattern for parallel processing
   - Dedicated package for simulation algorithms
   - Integration with WebSocket for real-time updates

4. **WebSocket Architecture**
   - Hub pattern for connection management
   - Client struct per connection
   - Message broadcasting to subscribed clients

## Usage

### Development

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
go mod download
go run cmd/server/main.go
```

### Docker

```bash
docker-compose up -d
```

This starts all services (PostgreSQL, Redis, Backend, Frontend) together.

## Next Steps

1. Implement authentication flow (JWT + bcrypt)
2. Create database migrations
3. Build React Flow canvas components
4. Integrate Recharts for data visualization
5. Implement WebSocket real-time updates
6. Build simulation engine algorithms
7. Add Redis caching layer
8. Configure Nginx for production
