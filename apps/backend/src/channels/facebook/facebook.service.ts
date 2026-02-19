import {
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';
import { MessagesService } from '../../messages/messages.service';
import { AiService } from '../../ai/ai.service';

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly aiService: AiService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Verify the X-Hub-Signature-256 header from Meta.
   * Throws ForbiddenException on mismatch.
   */
  verifySignature(rawBody: Buffer, signature: string): void {
    const META_APP_SECRET = this.configService.get<string>('META_APP_SECRET') ?? '';
    const expected =
      'sha256=' +
      crypto.createHmac('sha256', META_APP_SECRET).update(rawBody).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature ?? ''))) {
      throw new ForbiddenException('Invalid Facebook webhook signature');
    }
  }

  /**
   * Main handler: verify signature, extract message, ingest, and optionally send AI reply.
   */
  async handleInbound(rawBody: Buffer, signature: string): Promise<void> {
    this.verifySignature(rawBody, signature);

    let payload: Record<string, any>;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      this.logger.warn('Facebook: failed to parse JSON body');
      return;
    }

    const messagingEvent = payload?.entry?.[0]?.messaging?.[0];
    if (!messagingEvent) {
      return;
    }

    const senderId: string = messagingEvent.sender?.id;
    const messageText: string = messagingEvent.message?.text;
    const mid: string = messagingEvent.message?.mid;

    if (!messageText) {
      this.logger.warn(`Facebook: non-text message from ${senderId}, skipping`);
      return;
    }

    const result = await this.messagesService.ingest({
      client: { id: senderId },
      message: {
        content: messageText,
        sender: 'client',
        channel: 'facebook',
        externalId: mid,
      },
    });

    if (result.status === 'duplicate') {
      this.logger.debug(`Facebook: duplicate message ${mid}, skipping AI`);
      return;
    }

    if (result.aiMode === 'auto') {
      const { conversationId } = result;
      try {
        const aiResult = await this.aiService.generateReply(conversationId, messageText);
        if (aiResult?.reply) {
          await Promise.all([
            this.send(senderId, aiResult.reply),
            this.messagesService.saveAiReply(conversationId, aiResult.reply, aiResult.aiRunId),
          ]);
        }
      } catch (err) {
        this.logger.warn(
          `Facebook: AI reply failed for conversation ${conversationId}: ${(err as Error).message}`,
        );
      }
    }
  }

  /**
   * Send a Facebook Messenger message via the Graph API.
   */
  async send(recipientId: string, content: string): Promise<void> {
    const FACEBOOK_PAGE_ACCESS_TOKEN = this.configService.get<string>(
      'FACEBOOK_PAGE_ACCESS_TOKEN',
    );

    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/me/messages?access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`,
        {
          recipient: { id: recipientId },
          message: { text: content },
        },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );
    } catch (err) {
      this.logger.warn(
        `Facebook: failed to send message to ${recipientId}: ${(err as Error).message}`,
      );
    }
  }
}
