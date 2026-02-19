#!/bin/bash

# Pre-Deployment Checklist for Chatting Agent
# This script verifies everything is ready before deployment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Pre-Deployment Checklist for Chatting Agent"
echo "================================================"
echo ""

# Check Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "   Found: $NODE_VERSION"
if [[ $NODE_VERSION == *"v18"* ]] || [[ $NODE_VERSION == *"v19"* ]] || [[ $NODE_VERSION == *"v20"* ]]; then
    echo -e "   ${GREEN}✓ Node.js version compatible${NC}"
else
    echo -e "   ${YELLOW}⚠ Recommended Node.js 18+${NC}"
fi
echo ""

# Check npm
echo "📋 Checking npm..."
npm -v > /dev/null 2>&1 && echo -e "   ${GREEN}✓ npm installed${NC}" || echo -e "   ${RED}✗ npm not found${NC}"
echo ""

# Check environment files
echo "📋 Checking environment files..."
if [ -f "apps/backend/.env" ]; then
    echo -e "   ${GREEN}✓ Backend .env exists${NC}"
else
    echo -e "   ${YELLOW}⚠ Backend .env missing (cp apps/backend/.env.example apps/backend/.env)${NC}"
fi

if [ -f "apps/web/.env.local" ]; then
    echo -e "   ${GREEN}✓ Frontend .env.local exists${NC}"
else
    echo -e "   ${YELLOW}⚠ Frontend .env.local missing (cp apps/web/.env.example apps/web/.env.local)${NC}"
fi
echo ""

# Check dependencies
echo "📋 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "   ${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "   ${YELLOW}⚠ Dependencies not installed (npm install)${NC}"
fi
echo ""

# Check builds
echo "📋 Testing builds..."
echo "   Building backend..."
npm run build -w @chat/backend > /dev/null 2>&1 && echo -e "   ${GREEN}✓ Backend build successful${NC}" || echo -e "   ${RED}✗ Backend build failed${NC}"

echo "   Building frontend..."
npm run build -w @chat/web > /dev/null 2>&1 && echo -e "   ${GREEN}✓ Frontend build successful${NC}" || echo -e "   ${RED}✗ Frontend build failed${NC}"
echo ""

# Run tests
echo "📋 Running tests..."
echo "   Running backend tests..."
npm run test -w @chat/backend -- --passWithNoTests > /dev/null 2>&1 && echo -e "   ${GREEN}✓ Backend tests passed${NC}" || echo -e "   ${YELLOW}⚠ Backend tests failed${NC}"

echo "   Running frontend tests..."
npm run test -w @chat/web -- --passWithNoTests > /dev/null 2>&1 && echo -e "   ${GREEN}✓ Frontend tests passed${NC}" || echo -e "   ${YELLOW}⚠ Frontend tests failed${NC}"
echo ""

# Check database requirements
echo "📋 Checking database requirements..."
if command -v psql &> /dev/null; then
    echo -e "   ${GREEN}✓ PostgreSQL client installed${NC}"
else
    echo -e "   ${YELLOW}⚠ PostgreSQL client not found (needed for local dev)${NC}"
fi
echo ""

# Check Docker (optional)
echo "📋 Checking Docker (optional)..."
if command -v docker &> /dev/null; then
    echo -e "   ${GREEN}✓ Docker installed${NC}"
    if command -v docker-compose &> /dev/null; then
        echo -e "   ${GREEN}✓ Docker Compose installed${NC}"
    else
        echo -e "   ${YELLOW}⚠ Docker Compose not found${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠ Docker not installed (needed for containerized deployment)${NC}"
fi
echo ""

# Summary
echo "================================================"
echo "✅ Pre-deployment checklist complete!"
echo ""
echo "Next steps:"
echo "1. Configure environment variables (see .env.example files)"
echo "2. Setup database: npm run prisma:migrate -w @chat/db"
echo "3. Seed data (optional): npm run seed -w @chat/db"
echo "4. Start local dev: npm run start:dev -w @chat/backend & npm run dev -w @chat/web"
echo "5. Test at http://localhost:3000"
echo ""
echo "For deployment:"
echo "- Docker: docker-compose -f docker-compose.prod.yml up -d"
echo "- Cloud: See DEPLOYMENT.md for provider-specific instructions"
echo ""
