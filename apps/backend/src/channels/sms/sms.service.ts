import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from '../../messages/messages.service';
import { AiService } from '../../ai/ai.service';

interface AfricasTalkingInboundBody {
  from: string;
  to: string;
  text: string;
  date?: string;
  id?: string;
  linkId?: string;
  networkCode?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly aiService: AiService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Handle inbound SMS from Africa's Talking webhook.
   * Ingests the message and optionally generates an AI reply.
   */
  async handleInbound(body: AfricasTalkingInboundBody): Promise<void> {
    const { from, text, id } = body;

    if (!text || !from) {
      this.logger.warn('SMS: missing from or text in inbound body');
      return;
    }

    // Ingest message
    const result = await this.messagesService.ingest({
      client: { phone: from },
      message: {
        content: text,
        sender: 'client',
        channel: 'sms',
        externalId: id ?? `sms_${Date.now()}`
      }
    });

    if (result.status === 'duplicate') {
      this.logger.debug(`SMS: duplicate message ${id}, skipping AI`);
      return;
    }

    // Generate AI reply
    try {
      const aiReply = await this.aiService.generateReply(result.conversationId!, text);

      if (aiReply?.reply) {
        // Save AI reply as a message in the conversation
        await this.messagesService.saveAiReply(
          result.conversationId!,
          aiReply.reply,
          aiReply.aiRunId
        );
        this.logger.log(`SMS AI reply saved: ${aiReply.reply.substring(0, 50)}...`);

        // Send outbound SMS
        await this.sendMessage(from, aiReply.reply);
      }
    } catch (err) {
      this.logger.error(`SMS: AI reply failed for conversation ${result.conversationId}`, err);
    }
  }

  /**
   * Send outbound SMS via Africa's Talking API.
   * This method can be called by the MessagesService when replying to a client.
   */
  async sendMessage(to: string, text: string): Promise<void> {
    const apiKey = this.configService.get<string>('AFRICASTALKING_API_KEY');
    const username = this.configService.get<string>('AFRICASTALKING_USERNAME');

    if (!apiKey || !username) {
      this.logger.warn("SMS: Africa's Talking credentials not configured");
      return;
    }

    // TODO: Implement actual API call to Africa's Talking
    this.logger.log(`SMS: would send to ${to}: ${text.substring(0, 50)}...`);
  }
}
