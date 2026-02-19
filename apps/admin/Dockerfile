# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# NEXT_PUBLIC_* vars must be baked in at build time — accept them as build args
ARG NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
ARG NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_WEBSOCKET_URL=$NEXT_PUBLIC_WEBSOCKET_URL

# Copy package files
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/admin/package.json ./apps/admin/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build frontend (env vars are baked in here)
RUN npm run build -w @chat/admin

# Production stage - Next.js standalone
FROM node:18-alpine AS production

WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000

# Copy the standalone output
COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder /app/apps/admin/public ./apps/admin/public

# Expose port
EXPOSE 3000

# Start Next.js application
CMD ["node", "apps/admin/server.js"]
