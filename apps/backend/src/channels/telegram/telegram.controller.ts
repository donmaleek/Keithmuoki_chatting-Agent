import {
  Controller,
  Post,
  Query,
  Body,
  ForbiddenException,
  HttpCode,
  Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';

@Controller('channels/telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService
  ) {}

  /**
   * POST /channels/telegram/webhook?secret=TOKEN
   * Receive inbound Telegram messages. Validates the secret query param.
   */
  @Post('webhook')
  @HttpCode(200)
  async receiveMessage(
    @Query('secret') secret: string,
    @Body() body: Record<string, any>
  ): Promise<{ status: string }> {
    const TELEGRAM_WEBHOOK_SECRET = this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET');

    if (secret !== TELEGRAM_WEBHOOK_SECRET) {
      this.logger.warn('Telegram: webhook secret mismatch');
      throw new ForbiddenException('Invalid webhook secret');
    }

    await this.telegramService.handleInbound(body);
    return { status: 'ok' };
  }
}
