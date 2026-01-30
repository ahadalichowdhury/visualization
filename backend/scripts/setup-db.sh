#!/bin/bash

# Database Setup Script for Visualization Platform
# This script creates the database and runs migrations

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME=${DB_NAME:-visualization_db}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo -e "${GREEN}=== Visualization Platform Database Setup ===${NC}\n"

# Check if PostgreSQL is running
echo "Checking PostgreSQL connection..."
if ! psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to PostgreSQL${NC}"
    echo "Please ensure PostgreSQL is running and credentials are correct."
    echo "You can set environment variables: DB_USER, DB_PASSWORD, DB_HOST, DB_PORT"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}\n"

# Check if database exists
echo "Checking if database exists..."
if psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${YELLOW}Database '$DB_NAME' already exists.${NC}"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping database..."
        psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -c "DROP DATABASE $DB_NAME;"
        echo -e "${GREEN}✓ Database dropped${NC}\n"
    else
        echo "Keeping existing database."
        read -p "Do you want to run migrations anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Exiting without changes."
            exit 0
        fi
    fi
fi

# Create database if it doesn't exist
if ! psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "Creating database '$DB_NAME'..."
    psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -c "CREATE DATABASE $DB_NAME;"
    echo -e "${GREEN}✓ Database created${NC}\n"
fi

# Run migrations
echo "Running migrations..."
MIGRATIONS_DIR="$(dirname "$0")/../internal/database/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}Error: Migrations directory not found at $MIGRATIONS_DIR${NC}"
    exit 1
fi

# Find all up migrations and sort them
for migration in $(ls "$MIGRATIONS_DIR"/*up.sql 2>/dev/null | sort); do
    migration_name=$(basename "$migration")
    echo "Applying migration: $migration_name"
    
    if PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f "$migration" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $migration_name applied successfully${NC}"
    else
        echo -e "${RED}✗ Failed to apply $migration_name${NC}"
        echo "Error details:"
        PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f "$migration"
        exit 1
    fi
done

echo ""

# Verify tables were created
echo "Verifying database structure..."
TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Database setup complete!${NC}\n"
    echo "Tables created:"
    PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "\dt"
else
    echo -e "${RED}✗ No tables were created${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "Database Details:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""
echo "You can now start the backend server with:"
echo "  cd backend && go run cmd/server/main.go"
