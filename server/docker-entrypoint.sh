#!/bin/sh

set -e

echo "Running database migrations..."
npm run migrate

echo "Starting Exam App API..."
exec node server.js