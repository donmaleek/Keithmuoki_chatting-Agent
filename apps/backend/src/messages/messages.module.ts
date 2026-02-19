import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { MessagesGateway } from './messages.gateway';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [
    AuthModule, // provides JwtModule (and JwtService) for the gateway auth
    forwardRef(() => AiModule), // AiService needed for auto-reply on ingest
  ],
  controllers: [MessagesController],
  providers: [MessagesGateway, MessagesService],
  exports: [MessagesService, MessagesGateway]
})
export class MessagesModule {}
