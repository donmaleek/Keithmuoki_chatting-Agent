#!/bin/sh
set -e

echo "Syncing database schema..."
# 'db push' is used because this project uses prisma db push (no migrations folder).
# When you're ready to switch to proper migrations, run:
#   npm run prisma:migrate -w packages/db
# and change the line below to: npx prisma migrate deploy --schema=./packages/db/prisma/schema.prisma
npx prisma db push --schema=./packages/db/prisma/schema.prisma --accept-data-loss

echo "Starting backend server..."
exec node apps/backend/dist/main.js
