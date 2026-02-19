# Chatting Agent Architecture & Features

This document provides a high-level overview of the system architecture and key features ready for implementation.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────────┬──────────────────────┬────────────────────┤
│   Web Admin         │    Mobile App        │   Channel           │
│   (Next.js)         │   (React Native)     │   (WhatsApp, SMS)   │
└──────────┬──────────┴──────────┬───────────┴────────┬───────────┘
           │                     │                    │
           │                     │                    │
┌──────────┴─────────────────────┴────────────────────┴──────────┐
│                        n8n Automation Layer                      │
│  (Message ingestion, routing, classification, workflows)        │
└──────────┬────────────────────────────────────────────────────┘
           │
┌──────────┴────────────────────────────────────────────────────┐
│                    NestJS Backend API                           │
├──────────────────────────────────────────────────────────────┤
│  REST Endpoints  │  GraphQL  │  Webhooks  │  Auth (JWT)       │
└──────────┬──────────┬──────────┬──────────┬─────────────────┘
           │          │          │          │
     ┌─────┴──────────┴──────────┴──────────┴──────┐
     │      Postgres Database & Audit Logs         │
     │  (Conversations, Messages, Payments, etc)   │
     └───────────────────────────────────────────┘
```

## Core Modules

### 1. Messages Module
**Responsibility:** Message ingestion, storage, and retrieval

**Files:**
- `apps/backend/src/messages/messages.controller.ts` - REST endpoints
- `apps/backend/src/messages/messages.service.ts` - Message logic
- `apps/backend/src/graphql/messages.resolver.ts` - GraphQL queries

**Endpoints:**
```
POST   /messages/ingest  - Accept message from n8n
GET    /messages/conversations - List all conversations
GET    /messages/conversations/:id - Get single conversation
GET    /messages/conversations/:id/messages - Get messages
```

**GraphQL:**
```graphql
query {
  conversations(status: "open", skip: 0, take: 50) {
    id
    clientId
    channel
    status
  }
  
  messages(conversationId: "...", skip: 0, take: 50) {
    id
    sender
    content
    createdAt
  }
}
```

### 2. AI Module
**Responsibility:** AI-powered message responses with multiple modes

**Files:**
- `apps/backend/src/ai/ai.controller.ts`
- `apps/backend/src/ai/ai.service.ts`

**Modes:**
- `manual` - No AI, user types response
- `draft` - AI suggests, user approves
- `auto` - AI sends directly (high confidence only)

**Features to implement:**
- Voice profile from your historical messages
- Confidence scoring for auto-reply safety
- Multi-agent checker (tone, policy, brand)

### 3. Payments Module
**Responsibility:** Payment link generation and webhook handling

**Files:**
- `apps/backend/src/payments/payments.controller.ts`
- `apps/backend/src/payments/payments.service.ts`

**Endpoints:**
```
POST /payments/link - Create Stripe or Paystack link
POST /payments/webhook/stripe - Stripe payment confirmed
POST /payments/webhook/paystack - Paystack payment confirmed
```

**Features:**
- Auto-detect payment intent from messages
- Generate checkout links
- Track payment status
- Audit logging for compliance

### 4. Auth Module
**Responsibility:** JWT authentication and RBAC

**Files:**
- `apps/backend/src/auth/auth.controller.ts`
- `apps/backend/src/auth/auth.service.ts`
- `apps/backend/src/auth/jwt.strategy.ts`
- `apps/backend/src/auth/jwt-auth.guard.ts`

**Usage:**
```bash
# Get token
POST /auth/login { userId: "your-id" }
→ { accessToken: "eyJhbGc..." }

# Use token
GET /messages/conversations
Authorization: Bearer eyJhbGc...
```

**Features to implement:**
- Role-based access control (admin, agent, viewer)
- Token refresh mechanism
- Login attempts tracking

### 5. n8n Module
**Responsibility:** Workflow orchestration and status callbacks

**Files:**
- `apps/backend/src/n8n/n8n.controller.ts`
- `apps/backend/src/n8n/n8n.service.ts`

**Endpoints:**
```
POST /n8n/trigger - Trigger workflow from backend
POST /n8n/status - Receive workflow completion status
```

**Workflows in `apps/n8n/workflows/`:**
- `ingest-message-workflow.json` - Receive messages from channels
- `ai-respond-workflow.json` - Call AI service
- `stripe-webhook-workflow.json` - Handle Stripe webhooks
- `paystack-webhook-workflow.json` - Handle Paystack webhooks

## Database Schema

Located in `packages/db/prisma/schema.prisma`

```
Client
├── id (cuid)
├── name
├── email
├── phone
├── tags
├── conversations (1:N)
└── paymentIntents (1:N)

Conversation
├── id (cuid)
├── clientId (FK)
├── channel (whatsapp, sms, email, etc)
├── status (open, closed, on_hold)
├── messages (1:N)
└── timestamps

Message
├── id (cuid)
├── conversationId (FK)
├── sender
├── content
├── messageTags (M:N)
└── createdAt

PaymentIntent
├── id (cuid)
├── clientId (FK)
├── provider (stripe, paystack)
├── amount
├── currency
├── status (pending, paid, failed)
└── timestamps

AuditLog
├── id (cuid)
├── actor (user, n8n, stripe, etc)
├── action
├── targetId
├── metadata (JSON)
└── createdAt
```

## Key Features

### 1. Unified Inbox
- All messages from multiple channels in one place
- Filter by conversation status, client, channel
- Real-time updates via WebSocket (planned)
- Pagination support for large datasets

### 2. AI Response Modes
- **Manual:** You write responses
- **Draft:** AI suggests, you approve
- **Auto:** AI responds automatically (confidence > threshold)
- Fallback to human if policy violation detected

### 3. Payment Intent Detection
- Automatic detection of payment keywords
- Generate Stripe/Paystack checkout links
- Handle webhook confirmations
- Track payment status and follow-ups

### 4. n8n Automation
- Channel connectors (WhatsApp Business, SendGrid, etc.)
- Message classification (intent, urgency, sentiment)
- Auto-tagging and routing
- Workflow triggers and callbacks

### 5. Multi-Channel Support
- WhatsApp Business API
- SMS (Twilio)
- Email (IMAP/SMTP)
- Web Chat (embedded)
- Instagram DMs
- Telegram

### 6. Audit & Compliance
- Complete audit trail in `AuditLog`
- PII redaction (future)
- GDPR/HIPAA logging (future)
- Export capabilities

## Frontend (Next.js)

**Current status:** Scaffolded with basic home page

**Planned components:**
- Inbox (conversation list)
- Conversation detail (message thread)
- AI response suggestion panel
- Client profile sidebar
- Payment status dashboard
- Settings & API keys

**Authentication:** Uses JWT from backend

## Mobile (React Native)

**Current status:** Scaffolded with Expo setup

**Planned features:**
- Push notifications
- Mobile inbox
- Quick reply templates
- Payment status notifications
- Voice messages (future)

## Development Workflow

1. **Backend Development**
   ```bash
   npm run start:dev -w apps/backend
   # API available at http://localhost:3001
   # GraphQL at http://localhost:3001/graphql
   ```

2. **Frontend Development**
   ```bash
   npm run dev -w apps/admin
   # UI available at http://localhost:3000
   ```

3. **n8n Workflows**
   - Visit http://localhost:5678
   - Import workflows from `apps/n8n/workflows/`
   - Test with manual triggers
   - Connect to live backend

## Deployment

**Production checklist:**
- [ ] Docker images built and tested
- [ ] Environment secrets injected
- [ ] Database migrations applied
- [ ] n8n credentials configured
- [ ] Stripe/Paystack webhook URLs set
- [ ] JWT secret rotated
- [ ] HTTPS enabled
- [ ] Monitoring and alerting configured

**Hosting options:**
- Heroku / Railway (easy, small scale)
- AWS ECS/EKS (scalable)
- DigitalOcean App Platform (simple)
- Kubernetes (enterprise)

## Performance Optimizations

**Implemented:**
- Pagination on conversation/message queries
- Database indexes on frequently queried fields
- JWT caching

**Planned:**
- Redis caching for active conversations
- Message search with Elasticsearch
- WebSocket connections for real-time
- Background job queue (Bull)

## Security

**Implemented:**
- JWT authentication
- Input validation with Zod
- CORS protection

**Planned:**
- Rate limiting
- CSRF protection
- SQL injection prevention (Prisma ORM)
- XSS protection
- Security headers
- API key rotation

## Next Steps

1. **Complete frontend inbox UI**
2. **Implement AI response engine**
3. **Set up payment webhook handlers**
4. **Add real channel connectors** (WhatsApp Business, SendGrid)
5. **Implement message classification** (intent detection)
6. **Add real-time WebSocket updates**
7. **Deploy to staging environment**
8. **Load testing and optimization**
9. **Production launch**

---

**Last Updated:** 2026-02-18
**Maintainer:** Chatting Agent Team
