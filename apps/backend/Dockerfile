# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build backend
RUN npm run build -w @chat/backend

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/backend/package.json ./apps/backend/

RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/db ./packages/db

# Copy Prisma configuration
COPY packages/db/prisma ./packages/db/prisma

# Generate Prisma client
RUN npx prisma generate --schema=./packages/db/prisma/schema.prisma

# Startup script: run migrations then start server
COPY apps/backend/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE 3001

CMD ["./docker-entrypoint.sh"]
