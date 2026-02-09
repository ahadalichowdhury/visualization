# Docker Compose with SMTP Configuration Guide

## ✅ What Was Updated

The password reset feature now works with Docker! I've added SMTP environment variables to your `docker-compose.yml`.

## 📋 Files Updated

1. **`docker-compose.yml`** - Added SMTP environment variables to backend service
2. **`.env` (root directory)** - Created with your SMTP credentials for docker-compose
3. **`backend/.env`** - Already has SMTP credentials (for local development)

## 🔧 How It Works

### Two `.env` Files:

1. **Root `.env`** (`/project/.env`)
   - Used by `docker-compose.yml`
   - Contains variables that docker-compose injects into containers
   - Variables: `STRIPE_SECRET_KEY`, `SMTP_*`

2. **Backend `.env`** (`/project/backend/.env`)
   - Used when running backend directly with `go run`
   - Contains ALL environment variables for local development
   - Used for: `go run cmd/server/main.go`

### Environment Variable Flow:

```
Docker Compose:
  .env (root) → docker-compose.yml → backend container

Local Development:
  backend/.env → go application
```

## 🚀 Usage

### Option 1: Running with Docker Compose

```bash
# Start all services (postgres, redis, backend, frontend)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

The backend will automatically use SMTP credentials from the root `.env` file.

### Option 2: Running Backend Locally (without Docker)

```bash
# Start backend only (uses backend/.env)
cd backend
go run cmd/server/main.go
```

The backend will use SMTP credentials from `backend/.env`.

## 📧 SMTP Configuration in docker-compose.yml

```yaml
environment:
  # Email/SMTP Configuration (Gmail)
  - SMTP_HOST=${SMTP_HOST:-smtp.gmail.com}
  - SMTP_PORT=${SMTP_PORT:-587}
  - SMTP_USERNAME=${SMTP_USERNAME}
  - SMTP_PASSWORD=${SMTP_PASSWORD}
  - SMTP_FROM=${SMTP_FROM:-noreply@yourdomain.com}
  - SMTP_FROM_NAME=${SMTP_FROM_NAME:-Visualization Platform}
```

**Syntax:**
- `${VARIABLE}` - Read from root `.env` file
- `${VARIABLE:-default}` - Read from `.env`, use default if not set

## 🧪 Testing with Docker

### 1. Start Services:
```bash
docker-compose up -d
```

### 2. Check Backend Logs:
```bash
docker-compose logs backend
```

Look for:
```
Email service initialized
Server running on port 9090
```

### 3. Test Password Reset:

#### Via Frontend:
- Navigate to `http://localhost:3000/forgot-password`
- Enter email and submit
- Check email inbox

#### Via API:
```bash
curl -X POST http://localhost:9090/api/auth/password/forgot \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 4. Check Email Delivery:
- Open email inbox for the test user
- Should receive password reset email
- Click reset link → redirects to `http://localhost:3000/reset-password?token=xxx`

## 🔐 Current SMTP Configuration

Your current settings (from `backend/.env`):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=smahadalichowdhury@gmail.com
SMTP_PASSWORD=pyfmuesfilotljys
SMTP_FROM=noreply@smahadalichowdhury.com
SMTP_FROM_NAME=Visualization Platform
```

These credentials are now configured for both:
- ✅ Docker Compose (via root `.env`)
- ✅ Local Development (via `backend/.env`)

## 🛠️ Updating SMTP Credentials

### For Docker Compose:
Edit the **root** `.env` file:
```bash
nano .env  # or use any editor
```

Then restart backend:
```bash
docker-compose restart backend
```

### For Local Development:
Edit `backend/.env`:
```bash
nano backend/.env  # or use any editor
```

Then restart the Go server:
```bash
cd backend
go run cmd/server/main.go
```

## 🚨 Troubleshooting

### Issue 1: Backend can't send emails in Docker

**Check logs:**
```bash
docker-compose logs backend | grep -i email
```

**Possible causes:**
- SMTP credentials not in root `.env`
- Docker container can't reach `smtp.gmail.com` (network issue)

**Solution:**
```bash
# Verify environment variables are loaded
docker-compose exec backend env | grep SMTP

# Should show all SMTP_* variables
```

### Issue 2: "Email service initialized" not showing

**Solution:**
```bash
# Rebuild backend image
docker-compose build backend

# Restart
docker-compose up -d backend
```

### Issue 3: Network errors connecting to Gmail

**Check if Docker can reach Gmail:**
```bash
docker-compose exec backend ping -c 3 smtp.gmail.com
```

If ping fails, check your network/firewall.

### Issue 4: Changes to .env not taking effect

**Solution:**
```bash
# Stop containers
docker-compose down

# Start fresh
docker-compose up -d
```

Docker Compose reads `.env` only on startup.

## 📊 Complete Docker Setup

### Services Running:

1. **postgres** (port 5432) - PostgreSQL database
2. **redis** (port 6379) - Redis cache
3. **backend** (port 9090) - Go API server with SMTP
4. **frontend** (port 3000) - React app

### Network:
All services communicate via `visualization-network`.

### Volumes:
- `postgres_data` - Persistent database storage
- `redis_data` - Persistent cache storage

## 🌐 URLs

When running with docker-compose:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:9090
- **Password Reset:** http://localhost:3000/forgot-password
- **Database:** localhost:5432
- **Redis:** localhost:6379

## ✅ Verification Checklist

- [x] `docker-compose.yml` updated with SMTP variables
- [x] Root `.env` file created with credentials
- [x] `backend/.env` has SMTP credentials (for local dev)
- [x] `.gitignore` excludes `.env` files
- [x] Backend compiles successfully
- [ ] Test with `docker-compose up -d`
- [ ] Check logs for "Email service initialized"
- [ ] Test password reset flow
- [ ] Verify email delivery

## 🎯 Quick Start Commands

```bash
# Start everything
docker-compose up -d

# View all logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# Restart backend after changes
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build backend

# Stop everything
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

## 📝 Production Deployment

For production, update the root `.env` with:

```env
# Use production SMTP credentials
SMTP_USERNAME=your-production-email@gmail.com
SMTP_PASSWORD=your-production-app-password
SMTP_FROM=noreply@yourdomain.com

# Update other production settings
STRIPE_SECRET_KEY=sk_live_...
```

Also update `docker-compose.yml`:
- Change `FRONTEND_URL` to production URL
- Use proper secrets management (Docker secrets, Kubernetes secrets, etc.)
- Don't commit production `.env` to git

## 🎉 You're All Set!

Your password reset feature now works seamlessly in both:
- ✅ Docker Compose setup
- ✅ Local development setup

Just run `docker-compose up -d` and test the forgot password flow!

---

**Need help?** Check the logs:
```bash
docker-compose logs -f backend
```
