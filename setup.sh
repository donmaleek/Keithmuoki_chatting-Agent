#!/bin/bash
# Quick start script for development

set -e

echo "🚀 Chatting Agent - Quick Setup"

# Check node
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js 18+"
  exit 1
fi

echo "✓ Node $(node -v)"

# Setup env
if [ ! -f .env ]; then
  echo "📄 Creating .env from .env.example..."
  cp .env.example .env
  echo "⚠️  Update .env with your API keys before running services"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Prepare Prisma
echo "🗄️  Setting up database client..."
npm run prisma:generate -w packages/db

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update .env with your API keys"
echo "  2. Start infrastructure: docker-compose up -d"
echo "  3. Run migrations: npm run prisma:migrate -w packages/db"
echo "  4. Start dev servers: npm run dev:all"
echo ""
echo "Or for local testing:"
echo "  npm run start:dev -w apps/backend"
echo "  npm run dev -w apps/admin"
