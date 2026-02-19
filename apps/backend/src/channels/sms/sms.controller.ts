import {
  Controller,
  Post,
  Body,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { SmsService } from './sms.service';

interface AfricasTalkingInboundBody {
  from: string;
  to: string;
  text: string;
  date?: string;
  id?: string;
  linkId?: string;
  networkCode?: string;
}

@Controller('channels/sms')
export class SmsController {
  private readonly logger = new Logger(SmsController.name);

  constructor(private readonly smsService: SmsService) {}

  /**
   * POST /channels/sms/inbound
   * Africa's Talking inbound SMS webhook (application/x-www-form-urlencoded).
   * NestJS parses urlencoded bodies automatically when the middleware is configured in main.ts.
   */
  @Post('inbound')
  @HttpCode(200)
  async receiveMessage(
    @Body() body: AfricasTalkingInboundBody,
  ): Promise<{ status: string }> {
    await this.smsService.handleInbound(body);
    return { status: 'ok' };
  }
}
