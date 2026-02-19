import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessagesModule } from '../../messages/messages.module';
import { AiModule } from '../../ai/ai.module';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';

@Module({
  imports: [MessagesModule, AiModule, ConfigModule],
  providers: [WhatsappService],
  controllers: [WhatsappController]
})
export class WhatsappModule {}
