#!/bin/sh
set -eu

echo "Waiting for database migrations to become available..."
npx prisma migrate deploy

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "RUN_SEED=true, seeding database..."
  node prisma/seed.js
fi

exec node src/server.js
