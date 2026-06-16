#!/usr/bin/env python3
"""
Auto-migration script that runs Alembic migrations on startup.
Exits with error if migrations fail.
"""
import os
import sys
import subprocess
import time
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT


def wait_for_database(max_retries=30, delay=2):
    """Wait for PostgreSQL to be ready."""
    print("Waiting for PostgreSQL to be ready...")
    
    for attempt in range(max_retries):
        try:
            conn = psycopg2.connect(
                host=os.getenv("DB_HOST", "db"),
                port=os.getenv("DB_PORT", "5432"),
                database=os.getenv("POSTGRES_DB", "hr_platform"),
                user=os.getenv("POSTGRES_USER", "hradmin"),
                password=os.getenv("POSTGRES_PASSWORD", "hradmin123"),
            )
            conn.close()
            print("PostgreSQL is ready!")
            return True
        except psycopg2.OperationalError as e:
            print(f"Attempt {attempt + 1}/{max_retries}: Database not ready yet. Waiting...")
            time.sleep(delay)
    
    print("ERROR: Could not connect to PostgreSQL after multiple attempts.")
    return False


def run_migrations():
    """Run Alembic migrations."""
    print("\nRunning database migrations...")
    
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        capture_output=False,
    )
    
    if result.returncode != 0:
        print("\nERROR: Migrations failed!")
        return False
    
    print("Migrations applied successfully!")
    return True


def check_current_revision():
    """Check current database revision."""
    result = subprocess.run(
        ["alembic", "current"],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        capture_output=True,
        text=True,
    )
    
    if result.returncode == 0:
        print(f"\nCurrent database revision: {result.stdout.strip()}")
    else:
        print("\nWARNING: Could not determine current revision.")
    
    return True


def main():
    """Main entry point."""
    print("=" * 50)
    print("Database Migration Checker")
    print("=" * 50)
    
    # Wait for database
    if not wait_for_database():
        sys.exit(1)
    
    # Check current revision
    check_current_revision()
    
    # Run migrations
    if not run_migrations():
        sys.exit(1)
    
    # Verify after migration
    check_current_revision()
    
    print("\n" + "=" * 50)
    print("Database is ready!")
    print("=" * 50)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
