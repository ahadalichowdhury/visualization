# Backend

Go-based backend with Fiber framework, real-time simulation engine, and WebSocket support.

## Structure

```
backend/
├── cmd/
│   └── server/          # Main application entry point
├── internal/            # Private application code
│   ├── api/
│   │   ├── handlers/    # HTTP request handlers
│   │   ├── middleware/  # Fiber middleware
│   │   └── routes/      # Route definitions
│   ├── auth/            # JWT authentication logic
│   ├── cache/           # Redis cache implementation
│   ├── config/          # Configuration management
│   ├── database/        # Database layer
│   │   ├── models/      # Database models
│   │   └── migrations/  # SQL migrations
│   ├── simulation/      # Simulation engine
│   └── websocket/       # WebSocket hub and handlers
└── pkg/                 # Public libraries
    ├── types/           # Shared types
    └── utils/           # Utility functions
```

## Key Technologies

- **Fiber**: Fast HTTP web framework
- **JWT**: Token-based authentication
- **bcrypt**: Password hashing
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **WebSocket**: Real-time bidirectional communication

## Commands

- `go run cmd/server/main.go` - Run development server
- `go build -o bin/server cmd/server/main.go` - Build binary
- `go test ./...` - Run tests
- `go mod tidy` - Clean up dependencies
