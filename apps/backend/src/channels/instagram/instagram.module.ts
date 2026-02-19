import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessagesModule } from '../../messages/messages.module';
import { AiModule } from '../../ai/ai.module';
import { InstagramService } from './instagram.service';
import { InstagramController } from './instagram.controller';

@Module({
  imports: [MessagesModule, AiModule, ConfigModule],
  providers: [InstagramService],
  controllers: [InstagramController]
})
export class InstagramModule {}
