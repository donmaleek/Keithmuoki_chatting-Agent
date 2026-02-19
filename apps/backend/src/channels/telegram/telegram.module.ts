import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessagesModule } from '../../messages/messages.module';
import { AiModule } from '../../ai/ai.module';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';

@Module({
  imports: [MessagesModule, AiModule, ConfigModule],
  providers: [TelegramService],
  controllers: [TelegramController]
})
export class TelegramModule {}
