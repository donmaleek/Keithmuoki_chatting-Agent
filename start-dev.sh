#!/bin/bash
# Development server startup script

set -e

if [ ! -f .env ]; then
  echo "❌ .env file not found. Run ./setup.sh first"
  exit 1
fi

echo "🚀 Starting development servers..."
echo ""

# Check if Docker is running for optional services
if command -v docker &> /dev/null; then
  if docker ps &> /dev/null; then
    echo "🐳 Docker is running"
    echo "  Checking infrastructure..."
    
    if ! docker ps | grep -q "postgres"; then
      echo "  Starting PostgreSQL..."
      docker-compose up -d postgres redis n8n
      sleep 5
      echo "  Database services started"
    else
      echo "  Services already running"
    fi
  fi
fi

echo ""
npm run dev:all
