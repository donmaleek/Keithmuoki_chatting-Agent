import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Headers,
  Res,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { FacebookService } from './facebook.service';

@Controller('channels/facebook')
export class FacebookController {
  private readonly logger = new Logger(FacebookController.name);

  constructor(
    private readonly facebookService: FacebookService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * GET /channels/facebook/webhook
   * Meta webhook verification challenge.
   */
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ): void {
    const META_VERIFY_TOKEN = this.configService.get<string>('META_VERIFY_TOKEN');

    if (mode === 'subscribe' && verifyToken === META_VERIFY_TOKEN) {
      this.logger.log('Facebook webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      this.logger.warn('Facebook webhook verification failed');
      res.status(403).send('Forbidden');
    }
  }

  /**
   * POST /channels/facebook/webhook
   * Receive inbound Facebook Messenger messages from Meta.
   */
  @Post('webhook')
  @HttpCode(200)
  async receiveMessage(
    @Body() body: Buffer,
    @Headers('x-hub-signature-256') signature: string,
  ): Promise<{ status: string }> {
    await this.facebookService.handleInbound(body, signature);
    return { status: 'ok' };
  }
}
