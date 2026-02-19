import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessagesModule } from '../../messages/messages.module';
import { AiModule } from '../../ai/ai.module';

/**
 * EmailModule - placeholder for email channel integration.
 * TODO: Implement email webhook handler (e.g., SendGrid inbound parse webhook).
 */
@Module({
  imports: [MessagesModule, AiModule, ConfigModule],
  providers: [],
  controllers: []
})
export class EmailModule {}
