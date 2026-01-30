# Visualization Platform

A real-time data visualization platform with interactive canvas, dynamic graphs, and complete user authentication system.

## 🚀 Quick Start

**Get started in 2 minutes:**

```bash
# Using Docker (recommended)
docker-compose up -d
docker exec -i visualization-postgres psql -U postgres -d visualization_db < backend/internal/database/migrations/001_init.up.sql

# Open http://localhost:3000
```

See [QUICK_START.md](./QUICK_START.md) for more options.

## ✨ Features

### Module 1: Authentication & User System ✅ COMPLETE

- ✅ **User Authentication**
  - Local signup with email/password
  - Secure login with JWT tokens
  - OAuth preparation (Google, GitHub)
  - Password reset flow
  
- ✅ **User Management**
  - User profiles with avatar support
  - Progress tracking
  - Role-based access control (basic, pro, admin)
  
- ✅ **Security**
  - Bcrypt password hashing
  - JWT token authentication
  - Protected routes
  - CORS configuration

### Coming Soon

- 📊 **Canvas Visualization** - React Flow integration
- 📈 **Real-time Graphs** - Recharts dashboards
- ⚡ **WebSocket Updates** - Live data streaming
- 🔧 **Simulation Engine** - Go-based simulations

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Canvas**: React Flow (ready)
- **Graphs**: Recharts (ready)
- **State**: Zustand
- **Styling**: TailwindCSS
- **Build**: Vite

### Backend
- **Language**: Go 1.21
- **Framework**: Fiber v2
- **Auth**: JWT + bcrypt
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **WebSocket**: Ready for implementation

## 📁 Project Structure

```
visualization/
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── auth/      # Auth components (Login, Signup, etc.)
│   │   │   ├── common/    # Reusable UI components
│   │   │   └── layout/    # Layout components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand state management
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── package.json
│
├── backend/               # Go backend
│   ├── cmd/server/        # Application entry point
│   ├── internal/          # Private application code
│   │   ├── api/          # HTTP handlers & routes
│   │   ├── auth/         # Auth logic (JWT, bcrypt)
│   │   ├── database/     # Database models & migrations
│   │   └── config/       # Configuration
│   ├── scripts/          # Utility scripts
│   └── go.mod
│
├── docker-compose.yml     # Docker orchestration
├── SETUP_GUIDE.md        # Detailed setup instructions
├── QUICK_START.md        # Quick start guide
└── README.md             # This file
```

## 🚦 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Go** 1.21+
- **PostgreSQL** 15+
- **Redis** 7+
- **Docker** (optional)

### Installation

**Option 1: Docker (Easiest)**

```bash
docker-compose up -d
./backend/scripts/setup-db.sh
```

**Option 2: Manual Setup**

See the complete [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

**Quick Manual Setup:**

```bash
# 1. Setup database
psql -U postgres -c "CREATE DATABASE visualization_db;"
cd backend
psql -U postgres -d visualization_db -f internal/database/migrations/001_init.up.sql

# 2. Start backend
cp env.example .env  # Edit with your settings
go run cmd/server/main.go

# 3. Start frontend
cd ../frontend
npm install
npm run dev
```

## 📖 Documentation

- [Quick Start Guide](./QUICK_START.md) - Get running in 5 minutes
- [Complete Setup Guide](./SETUP_GUIDE.md) - Detailed installation & configuration
- [Module 1 Implementation](./MODULE_1_AUTH_IMPLEMENTATION.md) - Auth system details
- [Folder Structure](./FOLDER_STRUCTURE.md) - Project organization

## 🧪 Testing

### Test the Auth System

1. **Create Account**: `http://localhost:3000/signup`
2. **Login**: `http://localhost:3000/login`
3. **View Profile**: Click avatar → Profile
4. **Test Password Reset**: Logout → "Forgot password?"
5. **Test Roles**: See SETUP_GUIDE.md for role testing

### API Testing

```bash
# Health check
curl http://localhost:9090/health

# Create account
curl -X POST http://localhost:9090/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:9090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🔒 Security

- Passwords hashed with bcrypt (cost 10)
- JWT tokens with configurable expiry
- CORS protection
- Role-based access control
- Protected API endpoints
- Secure password reset tokens

## 🌐 URLs

- **Frontend**: http://localhost:9090
- **Backend API**: http://localhost:9090
- **Health Check**: http://localhost:9090/health
- **API Docs**: Coming soon

## 🐳 Docker Services

When using `docker-compose up`:

- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Backend**: localhost:9090
- **Frontend**: localhost:3000

## 📝 Environment Variables

### Backend (.env)
```env
PORT=9090
DB_HOST=localhost
DB_NAME=visualization_db
JWT_SECRET=change-this-in-production
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:9090
VITE_WS_URL=ws://localhost:9090/ws
```

See env.example files for complete configuration.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📋 Roadmap

- [x] Module 1: Authentication & User System
- [ ] Module 2: Canvas Visualization (React Flow)
- [ ] Module 3: Real-time Graphs (Recharts)
- [ ] Module 4: WebSocket Integration
- [ ] Module 5: Simulation Engine
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] Analytics & metrics
- [ ] API documentation

## 🐛 Troubleshooting

See [SETUP_GUIDE.md - Troubleshooting](./SETUP_GUIDE.md#troubleshooting) for common issues and solutions.

**Quick fixes:**

- Backend won't start? Check database connection in `.env`
- Frontend errors? Run `npm install` again
- Database issues? Run migrations: `psql -U postgres -d visualization_db -f backend/internal/database/migrations/001_init.up.sql`

## 📄 License

MIT

## 🎉 Status

**Module 1 (Auth & User System): COMPLETE AND READY TO USE!**

All authentication features are fully implemented and tested:
- ✅ Signup/Login working
- ✅ Password reset functional
- ✅ User profiles with progress tracking
- ✅ Role-based access control
- ✅ JWT authentication secure
- ✅ Frontend & Backend integrated
- ✅ Database migrations ready
- ✅ Docker setup complete

Ready for production deployment or building additional modules!
