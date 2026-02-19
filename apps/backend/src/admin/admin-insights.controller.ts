import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { AdminInsightsService } from './admin-insights.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminInsightsController {
  constructor(private readonly adminInsightsService: AdminInsightsService) {}

  @Get('dashboard')
  getDashboard(@Query('days') days?: string) {
    const parsedDays = Number.parseInt(days ?? '30', 10);
    const periodDays = Number.isNaN(parsedDays) ? 30 : Math.max(7, Math.min(parsedDays, 365));
    return this.adminInsightsService.getDashboard(periodDays);
  }
}
