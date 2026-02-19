# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multi-channel AI-powered chatting agent platform (monorepo) consisting of:
- **NestJS backend** (REST + GraphQL API)
- **Next.js web admin** dashboard
- **React Native mobile** app (Expo, minimal scaffold)
- **n8n** workflow automation (primary orchestration layer)
- **Shared packages** for types, DB client, and AI client

## Commands

### Setup
```bash
bash setup.sh                           # Install deps, copy .env, generate Prisma
cp .env.example .env                    # Edit with real API keys
docker-compose up -d                    # Start Postgres (5432), Redis (6379), n8n (5678)
npm run prisma:migrate -w packages/db   # Apply DB migrations
```

### Development
```bash
npm run dev:all                         # Backend (3001) + Web (3000) concurrently
npm run start:dev -w apps/backend       # Backend only (NestJS watch mode)
npm run dev -w apps/admin                 # Web only (Next.js)
npm run start -w apps/mobile            # Mobile (Expo)
```

### Build
```bash
npm run build -w apps/backend           # tsc → dist/
npm run build -w apps/admin               # Next.js production build
```

### Lint & Format
```bash
npm run lint                            # ESLint across all workspaces
npm run format                          # Prettier check (no auto-fix)
```

### Test
```bash
npm run test -w apps/backend            # Backend unit tests (Jest)
npm run test -w apps/admin                # Frontend tests (Jest)
npm run test:e2e                        # E2E (configured, tests are TODO)
```

### Prisma
```bash
npm run prisma:generate -w packages/db  # Regenerate Prisma client after schema changes
npm run prisma:migrate -w packages/db   # Run migrations
```

## Architecture

### Monorepo Layout
```
apps/
  backend/    NestJS API (port 3001)
  web/        Next.js admin (port 3000) — pages: /login /inbox /analytics /settings
  mobile/     Expo React Native (minimal scaffold)
  n8n/        n8n workflow JSON templates
packages/
  shared/     TypeScript interfaces shared across apps (@chat/shared)
  db/         Prisma schema + singleton client (@chat/db)
  ai-client/  Fetch client for POST /ai/respond (@chat/ai-client)
```

### Message Ingestion Flow
1. External channel (WhatsApp, SMS, Email, etc.) → **n8n webhook**
2. n8n POSTs to `POST /messages/ingest` (no auth required — n8n is the internal caller)
3. `MessagesService` validates with Zod, upserts `Client` + `Conversation`, creates `Message` via Prisma
4. Optionally n8n calls `POST /ai/respond` (JWT-authenticated) for AI reply generation
5. Admin views conversation in Next.js `/inbox`

### Payment Flow
1. Payment intent detected → `POST /payments/link` (JWT) creates `PaymentIntent` record
2. Stripe/Paystack webhook → `POST /payments/webhook/stripe` or `/paystack` (no auth)
3. `PaymentsService` updates `PaymentIntent.status` and writes to `AuditLog`

### Backend Modules
| Module | Endpoints | Auth |
|---|---|---|
| AuthModule | POST /auth/login | None |
| MessagesModule | POST /messages/ingest, GET /messages | Ingest: none; GET: JWT |
| AiModule | POST /ai/respond | JWT |
| PaymentsModule | POST /payments/link, /webhook/stripe, /webhook/paystack | Link: JWT; Webhooks: none |
| N8nModule | POST /n8n/trigger, /n8n/status | None |
| HealthModule | GET /health | None |
| AppGraphqlModule | /graphql | JWT |

### Database Models
`Client` → `Conversation` → `Message` (core chain). Also: `Tag`, `MessageTag`, `PaymentIntent`, `AuditLog`.
Prisma singleton from `@chat/db` is used directly in all services (no repository abstraction).

## Key Conventions

- **Zod validation on all inputs**: Every service uses `safeParse()` and throws `BadRequestException` with flattened errors on failure.
- **Unauthenticated n8n endpoints**: `/messages/ingest`, `/n8n/*`, and payment webhooks intentionally skip `JwtAuthGuard`.
- **Shared types in `@chat/shared`**: Cross-boundary types (`Message`, `AiReplyRequest`, `PaymentIntent`, etc.) are defined once in `packages/shared/src/index.ts`.
- **Audit logging**: `N8nService` and `PaymentsService` write to `AuditLog` after every significant event.
- **ConfigModule is global**: `ConfigService` can be injected anywhere without re-importing `ConfigModule`.
- **AiService is a stub**: `generateReply()` returns a hardcoded response — needs `OPENAI_API_KEY` and real implementation.
- **Code style**: 2-space indent, LF line endings (`.editorconfig`); Prettier config in `.prettierrc.json`; ESLint configs at `apps/backend/.eslintrc.json` and `apps/admin/.eslintrc.json`.

## Infrastructure
- n8n admin: http://localhost:5678 (credentials: admin / change-me — change before production)
- Production Docker: `docker-compose.prod.yml`; deploy scripts in `scripts/`
