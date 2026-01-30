# Database Migrations

This directory contains SQL migration files for the visualization platform database.

## Migration Files

Migrations follow the naming convention: `XXX_description.up.sql` and `XXX_description.down.sql`

- `up.sql` - Applies the migration (creates tables, adds columns, etc.)
- `down.sql` - Reverts the migration (drops tables, removes columns, etc.)

## Current Migrations

### 001_init (Initial Setup)

**Up Migration:** Creates the core authentication and user management tables

Tables created:
- `users` - User accounts with authentication
- `password_resets` - Password reset tokens
- `progress` - User progress tracking

**Down Migration:** Drops all tables and functions created by the up migration

## Running Migrations

### Using psql (Manual)

**Apply migration:**
```bash
psql -U postgres -d visualization_db -f 001_init.up.sql
```

**Revert migration:**
```bash
psql -U postgres -d visualization_db -f 001_init.down.sql
```

### Using Docker

**Apply migration:**
```bash
docker exec -i visualization-postgres psql -U postgres -d visualization_db < 001_init.up.sql
```

**Revert migration:**
```bash
docker exec -i visualization-postgres psql -U postgres -d visualization_db < 001_init.down.sql
```

### Using Makefile

From the backend directory:

```bash
# Apply migrations
make migrate-up

# Revert migrations
make migrate-down
```

## Creating New Migrations

When adding new features, create new migration files:

1. **Create migration files:**
```bash
cd backend/internal/database/migrations
touch 002_feature_name.up.sql
touch 002_feature_name.down.sql
```

2. **Write the up migration:**
```sql
-- 002_feature_name.up.sql
CREATE TABLE new_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- columns here
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

3. **Write the down migration:**
```sql
-- 002_feature_name.down.sql
DROP TABLE IF EXISTS new_table;
```

4. **Test the migration:**
```bash
# Apply
psql -U postgres -d visualization_db -f 002_feature_name.up.sql

# Revert
psql -U postgres -d visualization_db -f 002_feature_name.down.sql

# Reapply
psql -U postgres -d visualization_db -f 002_feature_name.up.sql
```

## Best Practices

1. **Always create both up and down migrations**
   - Up migration adds new features
   - Down migration completely reverts the changes

2. **Make migrations idempotent**
   - Use `IF NOT EXISTS` and `IF EXISTS` clauses
   - Migrations should be safe to run multiple times

3. **Test migrations thoroughly**
   - Apply and revert multiple times
   - Check data integrity
   - Verify foreign key constraints

4. **Never modify existing migrations**
   - Once a migration is in production, create a new one instead
   - Use version control to track migration history

5. **Keep migrations atomic**
   - Each migration should do one logical thing
   - Split complex changes into multiple migrations

6. **Document complex migrations**
   - Add comments explaining the purpose
   - Note any data transformations

## Migration Checklist

Before deploying:

- [ ] Migration files created (up and down)
- [ ] Tested on local database
- [ ] Verified down migration reverts all changes
- [ ] Checked for data loss scenarios
- [ ] Foreign keys properly defined
- [ ] Indexes added where needed
- [ ] Default values set appropriately
- [ ] Constraints validated
- [ ] Triggers and functions tested
- [ ] Migration documented if complex

## Schema Versioning

Track which migrations have been applied:

```sql
-- Create a migrations table (optional, for tracking)
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Record migration
INSERT INTO schema_migrations (version, name) VALUES (1, 'init');
```

## Troubleshooting

**Migration failed mid-way:**
```bash
# Check which objects were created
\dt  # List tables
\df  # List functions

# Manually clean up or run down migration
psql -U postgres -d visualization_db -f 001_init.down.sql

# Try again
psql -U postgres -d visualization_db -f 001_init.up.sql
```

**Permission errors:**
```sql
-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE visualization_db TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
```

**Connection issues:**
```bash
# Test connection
psql -U postgres -d visualization_db -c "SELECT 1;"

# Check PostgreSQL is running
pg_isready
```

## Future Migrations

Plan for upcoming features:

- **002_canvas_data** - Canvas nodes and edges storage
- **003_simulation_runs** - Simulation execution data
- **004_websocket_sessions** - WebSocket connection tracking
- **005_analytics** - User analytics and metrics
- **006_notifications** - User notification system
- **007_teams** - Team collaboration features
