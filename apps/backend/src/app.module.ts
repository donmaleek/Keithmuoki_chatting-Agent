import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { AiModule } from './ai/ai.module';
import { MessagesModule } from './messages/messages.module';
import { PaymentsModule } from './payments/payments.module';
import { AuthModule } from './auth/auth.module';
import { AppGraphqlModule } from './graphql/graphql.module';
import { N8nModule } from './n8n/n8n.module';
import { ChannelRouterModule } from './channels/channel-router.module';
import { TeamModule } from './team/team.module';
import { GrowthModule } from './growth/growth.module';
import { AdminInsightsModule } from './admin/admin-insights.module';
import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    AiModule,
    MessagesModule,
    PaymentsModule,
    AuthModule,
    AppGraphqlModule,
    N8nModule,
    ChannelRouterModule,
    TeamModule,
    GrowthModule,
    AdminInsightsModule,
    CompaniesModule
  ]
})
export class AppModule {}
