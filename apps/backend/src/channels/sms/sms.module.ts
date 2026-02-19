import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessagesModule } from '../../messages/messages.module';
import { AiModule } from '../../ai/ai.module';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';

@Module({
  imports: [MessagesModule, AiModule, ConfigModule],
  providers: [SmsService],
  controllers: [SmsController]
})
export class SmsModule {}
