import { Module } from '@nestjs/common';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { InstagramModule } from './instagram/instagram.module';
import { FacebookModule } from './facebook/facebook.module';
import { TelegramModule } from './telegram/telegram.module';
import { SmsModule } from './sms/sms.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [WhatsappModule, InstagramModule, FacebookModule, TelegramModule, SmsModule, EmailModule]
})
export class ChannelRouterModule {}
