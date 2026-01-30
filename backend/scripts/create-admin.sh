#!/bin/bash

# Script to create an admin user or promote existing user to admin

set -e

echo "======================================"
echo "Admin User Creation Script"
echo "======================================"
echo ""

# Check if email is provided
if [ -z "$1" ]; then
    echo "Usage: ./create-admin.sh <email> [password]"
    echo ""
    echo "Examples:"
    echo "  ./create-admin.sh admin@example.com          # Promote existing user"
    echo "  ./create-admin.sh admin@example.com pass123  # Create new admin"
    exit 1
fi

EMAIL=$1
PASSWORD=$2

# Database connection details from environment or defaults
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-visualization_db}

echo "Database: $DB_NAME@$DB_HOST:$DB_PORT"
echo "Email: $EMAIL"
echo ""

# Check if user exists
USER_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM users WHERE email='$EMAIL';")

if [ "$USER_EXISTS" -eq "1" ]; then
    echo "User exists. Promoting to admin..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "UPDATE users SET role='admin' WHERE email='$EMAIL';"
    echo "✓ User promoted to admin successfully!"
elif [ -n "$PASSWORD" ]; then
    echo "User doesn't exist. Creating new admin user..."
    
    # Hash password with bcrypt (cost 10)
    # Note: This requires bcrypt CLI tool or you can create via API
    echo "Creating via API endpoint..."
    
    RESPONSE=$(curl -s -X POST http://localhost:9090/api/auth/signup \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Admin User\"}")
    
    if echo "$RESPONSE" | grep -q "token"; then
        echo "✓ User created successfully!"
        
        # Now promote to admin
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "UPDATE users SET role='admin' WHERE email='$EMAIL';"
        echo "✓ User promoted to admin!"
    else
        echo "✗ Failed to create user"
        echo "$RESPONSE"
        exit 1
    fi
else
    echo "✗ User doesn't exist and no password provided"
    echo "Usage: ./create-admin.sh <email> <password>"
    exit 1
fi

echo ""
echo "======================================"
echo "Admin user ready!"
echo "Email: $EMAIL"
echo "Role: admin"
echo "======================================"
