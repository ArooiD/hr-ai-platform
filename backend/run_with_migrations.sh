#!/bin/bash
# Run database migrations before starting the server

echo "Running database migrations..."
cd "$(dirname "$0")"
export PATH=$PATH:/home/openhands/.local/bin
alembic upgrade head

echo "Starting Uvicorn server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
