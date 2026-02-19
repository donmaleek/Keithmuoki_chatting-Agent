# Chatting Agent - Unified Messaging Inbox with AI Control

A production-ready monorepo for managing client messages across multiple channels (WhatsApp, SMS, Email, Web, Instagram, Telegram) with AI-powered responses, n8n automation, and payment workflows.

**Status**: Fully scaffolded and ready for feature development

## Quick Links
- 📚 [Build & Deployment Guide](BUILD_AND_DEPLOY.md)
- 🏗️ [Architecture Overview](ARCHITECTURE.md)
- 🎨 [Frontend Documentation](FRONTEND.md)
- ✅ [Testing Guide](TESTING.md)
- 🔌 [WebSocket & Real-time](WEBSOCKET.md)
- 🎯 [Implementation Complete](IMPLEMENTATION_COMPLETE.md)

## Key Features
✅ **Unified Inbox**: All messages from multiple channels in one place
✅ **AI Response Modes**: Manual, draft approval, or auto-reply
✅ **N8N Automation**: Primary orchestration layer for workflows
✅ **Payment Intent Detection**: Automatic Stripe/Paystack workflow
✅ **Multi-Channel**: WhatsApp, SMS, Email, Web Chat, Instagram, Telegram
✅ **Auth & RBAC**: JWT-based with role support
✅ **Audit Logging**: Complete compliance trail
✅ **GraphQL + REST**: Dual API access

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js + React + Tailwind CSS |
| Mobile | React Native (Expo) |
| Backend | NestJS + PostgreSQL + Prisma |
| Automation | n8n (primary orchestration) |
| Auth | JWT + Passport |
| Payments | Stripe + Paystack webhooks |
| Database | PostgreSQL + Redis |
| API | REST + GraphQL |

## Project Structure

```
Keithmuoki_chatting-Agent/
├── apps/
│   ├── backend/           NestJS API (port 3001)
│   │   ├── src/
│   │   │   ├── auth/      JWT auth + RBAC guards
│   │   │   ├── messages/  Message ingestion & retrieval
│   │   │   ├── ai/        AI service endpoints
│   │   │   ├── payments/  Payment & webhook handlers
│   │   │   ├── n8n/       Workflow callbacks
│   │   │   └── graphql/   GraphQL resolvers & types
│   │   └── package.json
│   │
│   ├── web/               Next.js admin dashboard (port 3000)
│   │   ├── src/
│   │   │   ├── app/       Pages (inbox, analytics, settings)
│   │   │   ├── components/ React components
│   │   │   └── lib/       Utilities & API client
│   │   └── package.json
│   │
│   ├── mobile/            React Native mobile app (Expo)
│   │   ├── App.tsx
│   │   └── package.json
│   │
│   └── n8n/               Workflow definitions (JSON)
│       └── workflows/
│
├── packages/
│   ├── shared/            TypeScript interfaces & types
│   ├── ai-client/         AI service client library
│   └── db/                Prisma schema & migrations
│       └── prisma/
│
├── BUILD_AND_DEPLOY.md    Setup & deployment guide
├── ARCHITECTURE.md        System design & modules
├── FRONTEND.md            Frontend features & components
├── docker-compose.yml     Infra (Postgres, Redis, n8n)
├── setup.sh               Quick setup script
├── start-dev.sh           Development server launcher
└── package.json           Monorepo root
```

## Getting Started

### 1️⃣ Clone & Setup
```bash
# Install dependencies
bash setup.sh

# Update .env with your API keys
nano .env
```

### 2️⃣ Start Infrastructure
```bash
# Start Docker services (if Docker available)
docker-compose up -d

# Apply database migrations
npm run prisma:generate -w packages/db
npm run prisma:migrate -w packages/db
```

### 3️⃣ Start Development Servers
```bash
# Option A: Full stack (backend + web)
npm run dev:all

# Option B: Backend only
npm run start:dev -w apps/backend

# Option C: Web only
npm run dev -w apps/admin

# Option D: Mobile
npm run start -w apps/mobile
```

### 4️⃣ Access Services
- **Admin Inbox**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **GraphQL**: http://localhost:3001/graphql
- **n8n Workflows**: http://localhost:5678 (admin / change-me)

## API Endpoints

### Messages
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/messages/ingest` | No | Accept message from n8n |
| GET | `/messages/conversations` | ✅ | List conversations |
| GET | `/messages/conversations/:id` | ✅ | Get single conversation |
| GET | `/messages/conversations/:id/messages` | ✅ | Get messages in thread |

### AI
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/ai/respond` | ✅ | Generate AI response |

### Payments
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/payments/link` | ✅ | Create payment link |
| POST | `/payments/webhook/stripe` | No | Stripe webhook handler |
| POST | `/payments/webhook/paystack` | No | Paystack webhook handler |

### Auth
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/auth/login` | No | Issue JWT token |

### n8n Integration
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/n8n/trigger` | No | Trigger workflow |
| POST | `/n8n/status` | No | Workflow status callback |

### Health
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/health` | No | Service health check |

## Features Ready for Development

### ✅ Completed
- Backend API scaffolding
- NestJS modules (Auth, Payments, Messages, AI, n8n)
- PostgreSQL schema with Prisma
- Frontend admin inbox UI
- Login page with JWT
- Conversation list & thread view
- n8n workflow templates
- Docker Compose setup
- API documentation

### ⏳ In Development
- Backend database integration (needs Postgres)
- AI response engine (needs OpenAI setup)
- Payment workflow (needs Stripe/Paystack keys)
- Real-time WebSocket updates
- Mobile app UI

### 🚀 Roadmap
- Message search & filters
- Advanced analytics & charts
- Custom message templates
- Bulk conversation actions
- Performance optimization
- Load testing
- Production deployment

## Environment Variables

Copy `.env.example` to `.env` and fill in required values:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chatting_agent

# Services
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Authentication
JWT_SECRET=your-secret-key-min-32-chars

# AI
OPENAI_API_KEY=sk_...

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYSTACK_SECRET_KEY=sk_...
PAYSTACK_WEBHOOK_SECRET=...

# n8n
N8N_WEBHOOK_URL=http://localhost:5678/webhook
```

## Database Schema

**Models:**
- `Client` - End customers
- `Conversation` - Message threads per channel
- `Message` - Individual messages
- `Tag` - Classification labels
- `PaymentIntent` - Payment tracking
- `AuditLog` - Compliance logging

See [ARCHITECTURE.md](ARCHITECTURE.md#database-schema) for details.

## Frontend Pages

| Page | Path | Purpose |
|------|------|---------|
| Login | `/login` | Authenticate with JWT |
| Inbox | `/inbox` | Main conversation interface |
| Analytics | `/analytics` | Metrics & trends |
| Settings | `/settings` | Configuration & integrations |

## Development Workflow

```bash
# 1. Make changes to backend
vim apps/backend/src/messages/messages.service.ts

# 2. Changes auto-reload with --watch
npm run start:dev -w apps/backend

# 3. Test with API calls
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/messages/conversations

# 4. Frontend also hot-reloads
npm run dev -w apps/admin

# 5. Update n8n workflows when needed
# Workflows in apps/n8n/workflows/*.json
```

## Testing

```bash
# Backend tests (TODO)
npm run test -w apps/backend

# Frontend tests (TODO)
npm run test -w apps/admin

# e2e tests (TODO)
npm run test:e2e
```

## Deployment

See [BUILD_AND_DEPLOY.md](BUILD_AND_DEPLOY.md#deployment) for:
- Docker image build
- Kubernetes setup
- Environment configuration
- Database migration strategy

## Support

- **Issues**: Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- **Frontend**: See [FRONTEND.md](FRONTEND.md) for component details
- **Backend**: Check `apps/backend/src/` for module documentation
- **Troubleshooting**: [BUILD_AND_DEPLOY.md#common-issues](BUILD_AND_DEPLOY.md#common-issues)

## License

Proprietary - All Rights Reserved

---

**Built with** 🚀 **for award-level messaging automation**

Last Updated: February 18, 2026
