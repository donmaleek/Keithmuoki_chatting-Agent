# Chatting Agent - Build & Deployment Guide

## Project Overview
This is a production-ready monorepo for a unified messaging inbox with AI responses, n8n automation, and payment workflows.

**Stack:**
- Backend: Node.js + NestJS + PostgreSQL + GraphQL + REST
- Frontend: Next.js + Tailwind CSS
- Mobile: React Native (Expo)
- Automation: n8n (primary orchestration)
- Payment: Stripe + Paystack
- Auth: JWT + RBAC

## Repository Structure
```
├── apps/
│   ├── backend/        NestJS API (port 3001)
│   ├── web/            Next.js admin dashboard (port 3000)
│   ├── mobile/         React Native / Expo app
│   └── n8n/            n8n workflow definitions
├── packages/
│   ├── shared/         TypeScript types and interfaces
│   ├── ai-client/      AI service client library
│   └── db/             Prisma schema and migrations
├── docker-compose.yml  Infrastructure (PostgreSQL, Redis, n8n)
└── README.md
```

## Quick Start (Development)

### Prerequisites
- Node.js 18+ and npm
- Docker and docker-compose (optional, for full infrastructure)
- Git

### Step 1: Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
# - JWT_SECRET: generate a strong secret
# - Database URL (if running Postgres)
# - Stripe/Paystack API keys
# - OpenAI API key (for AI features)
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3a: With Docker (Full Stack)
```bash
# Start infrastructure
docker-compose up -d

# Wait for services to be ready (30-60 seconds)
docker-compose ps

# Run database migrations
npm run prisma:generate -w packages/db
npm run prisma:migrate -w packages/db

# Start backend and web in parallel
npm run dev:all

# Services will be available at:
# - Backend: http://localhost:3001
# - Web: http://localhost:3000
# - GraphQL: http://localhost:3001/graphql
# - n8n: http://localhost:5678 (user: admin, pass: change-me)
```

### Step 3b: Local Development (No Docker)
```bash
# For local testing without a database:

# Backend only
npm run start:dev -w apps/backend

# Web only
npm run dev -w apps/admin

# Mobile
npm run start -w apps/mobile
```

## API Endpoints

### Messages
- `POST /messages/ingest` - Ingest message from channel
- `GET /messages/conversations` - List conversations (paginated, requires auth)
- `GET /messages/conversations/:id` - Get single conversation (requires auth)
- `GET /messages/conversations/:id/messages` - Get messages in conversation (requires auth, paginated)

### AI
- `POST /ai/respond` - Generate AI response for a message

### Payments
- `POST /payments/link` - Create payment link (Stripe or Paystack)
- `POST /payments/webhook/stripe` - Stripe webhook handler
- `POST /payments/webhook/paystack` - Paystack webhook handler

### Auth
- `POST /auth/login` - Issue JWT token

### Workflows (n8n)
- `POST /n8n/trigger` - Trigger n8n workflow
- `POST /n8n/status` - Receive workflow status update

### Health
- `GET /health` - Service health check

## n8n Workflows

All workflows are in `apps/n8n/workflows/`. To use them:

1. Start n8n: `docker-compose up -d n8n`
2. Visit http://localhost:5678 (user: admin, pass: change-me)
3. Go to Workflows > Import from File
4. Select each JSON file from `apps/n8n/workflows/`
5. Activate each workflow

### Available Workflows
- **ingest-message**: Receives messages from channels, sends to backend
- **ai-respond**: Calls AI endpoint to generate responses
- **stripe-webhook**: Processes Stripe payment events
- **paystack-webhook**: Processes Paystack payment events

## Database

### Prisma Schema
Located in `packages/db/prisma/schema.prisma`

**Models:**
- `Client` - End customer
- `Conversation` - Message thread per channel
- `Message` - Individual messages
- `Tag` - Message classification
- `PaymentIntent` - Payment tracking
- `AuditLog` - Compliance logging

### Migrations
```bash
# Generate Prisma client
npm run prisma:generate -w packages/db

# Create a new migration
npm run prisma:migrate -w packages/db

# Reset database (dev only)
npm run prisma:reset -w packages/db
```

## Authentication

All protected endpoints require a JWT Bearer token.

### Get Token
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"your-user-id"}'

# Response: {"accessToken": "eyJhbGc..."}
```

### Use Token
```bash
curl -X GET http://localhost:3001/messages/conversations \
  -H "Authorization: Bearer eyJhbGc..."
```

## Testing

### Backend
```bash
npm run test -w apps/backend
npm run test:e2e -w apps/backend
```

### Frontend
```bash
npm run test -w apps/admin
```

## Building for Production

### Backend
```bash
npm run build -w apps/backend
NODE_ENV=production npm start -w apps/backend
```

### Frontend
```bash
npm run build -w apps/admin
npm start -w apps/admin
```

### Mobile
```bash
# Build for iOS
npm run ios -w apps/mobile

# Build for Android
npm run android -w apps/mobile

# Build standalone
npm run build -- -t app -p ios -w apps/mobile
```

## Deployment

### Docker Deployment
```bash
# Rebuild with production settings
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Kubernetes
A Helm chart can be created from the Docker Compose setup.

### Environment Variables for Production
- `NODE_ENV=production`
- `JWT_SECRET` - Use a strong, random value
- `DATABASE_URL` - Managed database (AWS RDS, Digital Ocean, etc.)
- `REDIS_URL` - Managed Redis
- `OPENAI_API_KEY` - From OpenAI platform
- `STRIPE_SECRET_KEY` - From Stripe dashboard
- `PAYSTACK_SECRET_KEY` - From Paystack dashboard
- Webhook secrets from Stripe and Paystack

## Monitoring & Logging

- Backend logs to console and can be configured with structured logging
- n8n has its own UI for workflow execution logs
- Audit logs stored in `AuditLog` table for compliance

## Common Issues

### Port Already in Use
```bash
# Find process using port
lsof -i :3001

# Kill it
kill -9 <PID>
```

### Database Connection Failed
- Ensure PostgreSQL is running: `docker-compose ps`
- Check DATABASE_URL in .env matches docker-compose config
- Verify network connectivity between services

### n8n Webhook Issues
- Ensure `BACKEND_URL` env var in n8n is set correctly
- Check firewall rules allow traffic between containers
- Verify workflow is active in n8n UI

## Support & Documentation

- NestJS: https://docs.nestjs.com
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- n8n: https://docs.n8n.io
- GraphQL: https://graphql.org

## License
Proprietary - All Rights Reserved
