import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => MessagesModule), // Circular: AiModule <-> MessagesModule
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService]  // Channel modules import AiService to trigger AI after ingest
})
export class AiModule {}
