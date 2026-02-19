import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { GrowthService } from './growth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('growth')
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

  @Post('inquiries')
  submitInquiry(
    @Body()
    body: {
      fullName: string;
      email: string;
      companyName: string;
      phone?: string;
      teamSize?: number;
      monthlyVolume?: number;
      useCase: string;
      planInterest: string;
      budgetRange?: string;
    },
  ) {
    return this.growthService.createInquiry(body);
  }

  @Get('inquiries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listInquiries(@Query('status') status?: 'new' | 'contacted' | 'qualified' | 'won' | 'lost') {
    return this.growthService.listInquiries(status);
  }
}
