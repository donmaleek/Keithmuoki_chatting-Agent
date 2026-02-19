#!/bin/bash

# Production deployment checklist script
# Run this before deploying to ensure everything is ready

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

CHECKLIST=(
    "✓ All tests are passing"
    "✓ Environment variables configured"
    "✓ Database backups created"
    "✓ SSL certificates installed"
    "✓ API keys and secrets stored securely"
    "✓ CORS origins configured"
    "✓ Rate limiting enabled"
    "✓ Error tracking enabled"
    "✓ Monitoring configured"
    "✓ Rollback plan prepared"
    "✓ Team notified of deployment"
)

echo "📋 Production Deployment Checklist"
echo "==================================="
echo ""

for item in "${CHECKLIST[@]}"; do
    echo "[ ] $item"
done

echo ""
echo "Run tests before deployment:"
echo "   npm test"
echo ""
echo "Check build:"
echo "   npm run build -w @chat/backend"
echo "   npm run build -w @chat/admin"
echo ""
echo "Deploy with:"
echo "   ./scripts/deploy.sh"
echo ""
