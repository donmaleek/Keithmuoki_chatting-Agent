#!/bin/bash

# Deploy to Production using Docker
# Usage: ./deploy.sh [environment] [version]
# Example: ./deploy.sh aws v1.0.0

set -e

DEPLOY_ENV=${1:-docker}
VERSION=${2:-latest}

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "🚀 Deploying Chatting Agent to ${DEPLOY_ENV}"
echo "Version: ${VERSION}"
echo -e "${NC}"

# Pre-flight checks
echo "📋 Running pre-flight checks..."
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}✗ docker-compose.prod.yml not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose config found${NC}"

if [ ! -f "apps/backend/.env" ]; then
    echo -e "${RED}✗ Backend .env file not found${NC}"
    echo "   Create it with: cp apps/backend/.env.example apps/backend/.env"
    exit 1
fi
echo -e "${GREEN}✓ Backend config found${NC}"

if [ ! -f "apps/admin/.env.local" ]; then
    echo -e "${RED}✗ Admin .env.local not found${NC}"
    echo "   Create it with: cp apps/admin/.env.example apps/admin/.env.local"
    exit 1
fi
echo -e "${GREEN}✓ Admin config found${NC}"

echo ""
echo "🔨 Building containers..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo ""
echo "🚢 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Services running:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🔗 URLs:"
echo "   Backend API:  http://localhost:3001"
echo "   Frontend:     http://localhost:3000"
echo "   GraphQL:      http://localhost:3001/graphql"
echo "   Health:       http://localhost:3001/health"

echo ""
echo "📊 Checking health..."
sleep 3

if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    echo "   Check logs: docker-compose -f docker-compose.prod.yml logs backend"
fi

echo ""
echo "📝 Helpful commands:"
echo "   View logs:     docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.prod.yml stop"
echo "   Restart:       docker-compose -f docker-compose.prod.yml restart"
echo "   Database:      npm run prisma:migrate -w @chat/db"
echo "   Seed data:     npm run seed -w @chat/db"
echo ""
