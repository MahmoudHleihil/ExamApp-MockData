#!/bin/sh
set -e

mkdir -p \
  /app/uploads/course-materials \
  /app/outputs

chown -R appuser:appgroup \
  /app/uploads \
  /app/outputs

exec su-exec appuser "$@"