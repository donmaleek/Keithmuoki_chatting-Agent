import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessagesModule } from '../../messages/messages.module';
import { AiModule } from '../../ai/ai.module';
import { FacebookService } from './facebook.service';
import { FacebookController } from './facebook.controller';

@Module({
  imports: [MessagesModule, AiModule, ConfigModule],
  providers: [FacebookService],
  controllers: [FacebookController]
})
export class FacebookModule {}
