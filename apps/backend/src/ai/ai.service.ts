import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { prisma } from '@chat/db';
import { z } from 'zod';

// GPT-4o pricing (as of 2024) — update if pricing changes
const COST_PER_INPUT_TOKEN = 5 / 1_000_000;   // $5 per 1M input tokens
const COST_PER_OUTPUT_TOKEN = 15 / 1_000_000; // $15 per 1M output tokens

const VALID_MODES = ['auto', 'draft', 'manual'] as const;
const modeSchema = z.enum(VALID_MODES);

/**
 * Humanization preamble — appended to EVERY system prompt (default or custom)
 * to ensure the AI never breaks character or reveals it is AI.
 */
const HUMANIZATION_RULES = `

CRITICAL RULES YOU MUST ALWAYS FOLLOW:
- You are a REAL HUMAN. Never reveal, hint, or imply that you are an AI, bot, language model, or automated system.
- If anyone asks "are you a bot?" or "are you AI?", deflect naturally: "Haha no, just me! How can I help?" or similar.
- Never use phrases like "As an AI", "I'm a language model", "I don't have feelings", "I was programmed to", or anything that breaks the human illusion.
- Write like a real person texting — use contractions (I'm, don't, we'll, can't), casual connectors (so, anyway, btw, honestly), and natural fillers (hmm, let me think, oh right).
- Keep responses SHORT and conversational — 1-4 sentences max unless the question genuinely needs more detail.
- Match the client's energy and tone. If they're casual, be casual. If they're formal, be polished but still warm.
- Use lowercase naturally where appropriate. Don't over-capitalize or be overly formal.
- Never use bullet points, numbered lists, or markdown formatting in chat messages. Write in flowing prose like a real text message.
- Occasionally start replies with filler words like "Hey!", "Sure thing!", "Oh yeah", "Gotcha" — real humans do this.
- Ask follow-up questions naturally to keep the conversation flowing, just like a real person would.
- If you don't know something, say it honestly like a human: "hmm I'd have to double check on that, give me a sec" or "let me look into that and get back to you".
- Show genuine warmth and personality. Use light humor when appropriate.
- NEVER start a message with "Great question!" or "That's a great question!" — it's a dead giveaway for AI.
- Vary your sentence length. Mix short punchy responses with slightly longer ones. Don't be predictable.
`;

@Injectable()
export class AiService {
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly logger = new Logger(AiService.name);

  constructor(config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: config.get<string>('OPENAI_API_KEY')
    });
    this.model = config.get<string>('OPENAI_MODEL') ?? 'gpt-4o';
  }

  /**
   * Generate a GPT-4o reply for the given conversation.
   * Returns the reply text, or null if aiMode is 'manual'.
   */
  async generateReply(
    conversationId: string,
    incomingContent: string
  ): Promise<{ reply: string; aiRunId: string } | null> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    if (conversation.aiMode === 'manual') {
      return null; // Owner has taken over — skip AI entirely
    }

    // Fetch last 20 messages for context (oldest first)
    const history = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20
    });

    // Fetch the admin user's system prompt (persona/voice instructions)
    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' },
      select: { aiSystemPrompt: true, name: true, salesContext: true }
    });

    const basePrompt =
      adminUser?.aiSystemPrompt ??
      `You are ${adminUser?.name ?? 'the business owner'}, responding personally to clients via chat. You're friendly, approachable, and genuinely care about helping people. Talk like a real person — warm, direct, and conversational. Keep it natural and human.`;

    // Inject sales/product context if available
    const salesBlock = adminUser?.salesContext
      ? `\n\nPRODUCT & SALES KNOWLEDGE:\n${adminUser.salesContext}\n\nSALES GUIDELINES:\n- When a client shows interest or asks about products/services, naturally weave in relevant details from your product knowledge above.\n- Don't hard-sell or be pushy. Recommend products genuinely like you would to a friend — "honestly, for what you're describing, our [X] would be perfect because…"\n- Mention pricing naturally when asked or when it makes sense. Don't hide costs.\n- If a client seems interested, gently guide them toward purchasing: "want me to send you a payment link?" or "I can get that set up for you right now if you're keen"\n- Handle objections warmly — acknowledge their concern and offer alternatives or more info.\n- If a product isn't the right fit, be honest. Recommend something else or say so. Trust builds sales.\n`
      : '';

    // Always append humanization rules so the AI never breaks character
    const systemPrompt = basePrompt + salesBlock + HUMANIZATION_RULES;

    // Build the OpenAI messages array
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt }
    ];

    for (const msg of history) {
      if (msg.sender === 'client') {
        messages.push({ role: 'user', content: msg.content });
      } else {
        messages.push({ role: 'assistant', content: msg.content });
      }
    }

    messages.push({ role: 'user', content: incomingContent });

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: 300,
      temperature: 0.85,
      presence_penalty: 0.3,
      frequency_penalty: 0.2
    });

    const reply = completion.choices[0]?.message?.content ?? '';
    const usage = completion.usage;
    const tokensUsed = (usage?.total_tokens) ?? 0;
    const costUsd =
      (usage?.prompt_tokens ?? 0) * COST_PER_INPUT_TOKEN +
      (usage?.completion_tokens ?? 0) * COST_PER_OUTPUT_TOKEN;

    const aiRun = await prisma.aIRun.create({
      data: {
        conversationId,
        prompt: JSON.stringify(messages),
        completion: reply,
        tokensUsed,
        model: this.model,
        costUsd
      }
    });

    this.logger.log(
      `AI reply generated for conversation ${conversationId} — ${tokensUsed} tokens, $${costUsd.toFixed(6)}`
    );

    return { reply, aiRunId: aiRun.id };
  }

  /**
   * Get the current AI persona (system prompt) for the logged-in user.
   */
  async getPersona(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, aiSystemPrompt: true, salesContext: true }
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      systemPrompt: user.aiSystemPrompt ?? '',
      salesContext: user.salesContext ?? '',
      name: user.name
    };
  }

  /**
   * Update the AI persona / system prompt so it responds like the owner.
   * The prompt teaches the AI your tone, style, and how you answer questions.
   */
  async updatePersona(userId: string, systemPrompt: string) {
    if (!systemPrompt || systemPrompt.trim().length < 10) {
      throw new BadRequestException('System prompt must be at least 10 characters');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { aiSystemPrompt: systemPrompt.trim() },
      select: { id: true, name: true, aiSystemPrompt: true }
    });

    this.logger.log(`User ${userId} updated AI persona`);
    return { success: true, systemPrompt: user.aiSystemPrompt };
  }

  /**
   * Update the salesContext (product catalog, pricing, selling points).
   * This is injected into the AI system prompt so the AI can naturally sell your products.
   */
  async updateSalesContext(userId: string, salesContext: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { salesContext: salesContext.trim() || null },
      select: { id: true, salesContext: true }
    });

    this.logger.log(`User ${userId} updated sales context (${salesContext.length} chars)`);
    return { success: true, salesContext: user.salesContext ?? '' };
  }

  /**
   * Toggle AI mode for a single conversation.
   *  - auto:   AI replies automatically to every client message
   *  - draft:  AI suggests a reply; agent reviews and approves before sending
   *  - manual: AI is OFF; agent handles this conversation personally
   */
  async setConversationMode(conversationId: string, mode: 'auto' | 'draft' | 'manual') {
    const parsed = modeSchema.safeParse(mode);
    if (!parsed.success) {
      throw new BadRequestException(`Invalid mode. Must be one of: ${VALID_MODES.join(', ')}`);
    }

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException(`Conversation ${conversationId} not found`);

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { aiMode: parsed.data },
      select: { id: true, aiMode: true, channel: true, status: true }
    });

    this.logger.log(`Conversation ${conversationId} AI mode → ${mode}`);
    return updated;
  }

  /**
   * Returns aggregate AI usage stats.
   */
  async getStats() {
    const [totalRuns, costAgg, tokenAgg] = await Promise.all([
      prisma.aIRun.count(),
      prisma.aIRun.aggregate({ _sum: { costUsd: true } }),
      prisma.aIRun.aggregate({ _sum: { tokensUsed: true } })
    ]);

    return {
      totalRuns,
      totalCostUsd: Number((costAgg._sum.costUsd ?? 0).toFixed(4)),
      totalTokens: tokenAgg._sum.tokensUsed ?? 0
    };
  }
}
