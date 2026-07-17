#!/bin/sh

set -e

echo "Running database migrations..."
npm run migrate

if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "Running database seed..."
  npm run seed
  echo "Database seed completed."
fi

echo "Starting ExamApp Server..."
exec node server.js