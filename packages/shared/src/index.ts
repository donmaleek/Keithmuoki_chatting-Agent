// ─── Enums (mirror Prisma schema) ─────────────────────────────────────────────

export type Channel = 'whatsapp' | 'instagram' | 'facebook' | 'sms' | 'telegram' | 'email' | 'web';

export type ConversationStatus = 'open' | 'pending' | 'human_takeover' | 'closed';

export type AiMode = 'auto' | 'draft' | 'manual';

export type UserRole = 'admin' | 'agent';

export type MessageSender = 'client' | 'agent' | 'ai';

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  aiSystemPrompt: string | null;
  pushToken: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  clientId: string;
  channel: Channel;
  status: ConversationStatus;
  aiMode: AiMode;
  createdAt: string;
  updatedAt: string;
  client?: Client;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  externalId: string | null;
  createdAt: string;
}

export interface AIRun {
  id: string;
  conversationId: string;
  messageId: string | null;
  prompt: string;
  completion: string;
  tokensUsed: number;
  model: string;
  costUsd: number;
  createdAt: string;
}

export interface PaymentIntent {
  id: string;
  clientId: string;
  provider: 'paystack';
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'abandoned';
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── API Payloads ──────────────────────────────────────────────────────────────

/** Shape that all channel ingest services send to MessagesService.ingest() */
export interface IngestPayload {
  client?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  conversation?: {
    id?: string;
  };
  message: {
    content: string;
    sender: MessageSender;
    channel: Channel;
    externalId?: string; // channel-native message ID for deduplication
  };
}

/** Patch body for PATCH /messages/conversations/:id */
export interface ConversationPatch {
  status?: ConversationStatus;
  aiMode?: AiMode;
}

/** Request body for POST /ai/respond */
export interface AiReplyRequest {
  conversationId: string;
  message: string;
}

/** Response from AI generate endpoint */
export interface AiReplyResponse {
  reply: string;
  autoSent?: boolean;
  aiRunId: string;
}

/** Analytics response from GET /messages/analytics */
export interface AnalyticsData {
  conversationsByStatus: Record<ConversationStatus, number>;
  messagesByChannel: Record<Channel, number>;
  aiVsHumanRatio: { ai: number; human: number; total: number };
  avgFirstResponseMs: number | null;
}
