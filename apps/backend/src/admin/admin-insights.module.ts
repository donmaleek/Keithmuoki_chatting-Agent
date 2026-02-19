import { Module } from '@nestjs/common';
import { TeamModule } from '../team/team.module';
import { AdminInsightsController } from './admin-insights.controller';
import { AdminInsightsService } from './admin-insights.service';

@Module({
  imports: [TeamModule],
  controllers: [AdminInsightsController],
  providers: [AdminInsightsService],
})
export class AdminInsightsModule {}
