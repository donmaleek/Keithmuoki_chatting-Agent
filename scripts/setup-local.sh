#!/bin/bash

# Quick local development setup
# Usage: ./setup-local.sh

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "⚙️  Setting up local development environment"
echo -e "${NC}"

# Copy environment files
echo "📋 Setting up environment files..."
if [ ! -f "apps/backend/.env" ]; then
    cp apps/backend/.env.example apps/backend/.env
    echo -e "${GREEN}✓ Created apps/backend/.env${NC}"
fi

if [ ! -f "apps/admin/.env.local" ]; then
    cp apps/admin/.env.example apps/admin/.env.local
    echo -e "${GREEN}✓ Created apps/admin/.env.local${NC}"
fi

if [ ! -f "packages/db/.env" ]; then
    cp packages/db/.env.example packages/db/.env
    echo -e "${GREEN}✓ Created packages/db/.env${NC}"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Database setup
echo ""
echo "🗄️  Setting up database..."
npm run prisma:migrate -w @chat/db

# Seed data
echo ""
echo "🌱 Seeding sample data..."
npm run seed -w @chat/db

echo ""
echo -e "${GREEN}✅ Local setup complete!${NC}"
echo ""
echo "Start development:"
echo "  Terminal 1: npm run start:dev -w @chat/backend"
echo "  Terminal 2: npm run dev -w @chat/web"
echo ""
echo "Then visit: http://localhost:3000"
echo ""
