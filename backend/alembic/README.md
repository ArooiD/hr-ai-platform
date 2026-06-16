# Database Migrations

This project uses **Alembic** for database migrations.

## Commands

### Create a new migration
```bash
cd backend
alembic revision --autogenerate -m "description of changes"
```

### Apply migrations
```bash
cd backend
alembic upgrade head
```

### Rollback one migration
```bash
cd backend
alembic downgrade -1
```

### Check current migration status
```bash
cd backend
alembic current
```

### Show migration history
```bash
cd backend
alembic history
```

## Configuration

- Database URL is read from `DATABASE_URL` environment variable
- Falls back to `alembic.ini` configuration
- Models are imported from `app.models`

## First Time Setup

When running `docker-compose up` for the first time:
1. PostgreSQL container starts and initializes
2. Backend connects to database
3. Alembic migrations are applied automatically (or run manually with `alembic upgrade head`)
