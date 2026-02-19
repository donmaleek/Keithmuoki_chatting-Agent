import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MessagesService } from '../../messages/messages.service';
import { AiService } from '../../ai/ai.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly aiService: AiService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register the webhook with Telegram on module startup.
   */
  async onModuleInit(): Promise<void> {
    const TELEGRAM_BOT_TOKEN = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const BACKEND_PUBLIC_URL = this.configService.get<string>('BACKEND_PUBLIC_URL');
    const TELEGRAM_WEBHOOK_SECRET = this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET');

    if (!TELEGRAM_BOT_TOKEN || !BACKEND_PUBLIC_URL || !TELEGRAM_WEBHOOK_SECRET) {
      this.logger.warn(
        'Telegram: missing TELEGRAM_BOT_TOKEN, BACKEND_PUBLIC_URL, or TELEGRAM_WEBHOOK_SECRET — skipping webhook registration',
      );
      return;
    }

    const webhookUrl = `${BACKEND_PUBLIC_URL}/channels/telegram/webhook?secret=${TELEGRAM_WEBHOOK_SECRET}`;

    try {
      await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
        { url: webhookUrl },
        { headers: { 'Content-Type': 'application/json' } },
      );
      this.logger.log(`Telegram webhook registered: ${webhookUrl}`);
    } catch (err) {
      this.logger.warn(
        `Telegram: failed to register webhook: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Handle an inbound Telegram update.
   */
  async handleInbound(body: Record<string, any>): Promise<void> {
    const message = body?.message;
    if (!message) {
      // Could be an edited_message, channel_post, etc. — ignore silently.
      return;
    }

    const chatId: number = message.chat?.id;
    const username: string = message.from?.username ?? String(chatId);
    const text: string = message.text;
    const messageId: number = message.message_id;

    if (!text) {
      this.logger.warn(`Telegram: non-text message from chatId ${chatId}, skipping`);
      return;
    }

    const result = await this.messagesService.ingest({
      client: { name: username },
      message: {
        content: text,
        sender: 'client',
        channel: 'telegram',
        externalId: String(messageId),
      },
    });

    if (result.status === 'duplicate') {
      this.logger.debug(`Telegram: duplicate message ${messageId}, skipping AI`);
      return;
    }

    if (result.aiMode === 'auto') {
      const { conversationId } = result;
      try {
        const aiResult = await this.aiService.generateReply(conversationId, text);
        if (aiResult?.reply) {
          await Promise.all([
            this.send(chatId, aiResult.reply),
            this.messagesService.saveAiReply(conversationId, aiResult.reply, aiResult.aiRunId),
          ]);
        }
      } catch (err) {
        this.logger.warn(
          `Telegram: AI reply failed for conversation ${conversationId}: ${(err as Error).message}`,
        );
      }
    }
  }

  /**
   * Send a message to a Telegram chat via the Bot API.
   */
  async send(chatId: number, content: string): Promise<void> {
    const TELEGRAM_BOT_TOKEN = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    try {
      await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        { chat_id: chatId, text: content },
        { headers: { 'Content-Type': 'application/json' } },
      );
    } catch (err) {
      this.logger.warn(
        `Telegram: failed to send message to chatId ${chatId}: ${(err as Error).message}`,
      );
    }
  }
}
