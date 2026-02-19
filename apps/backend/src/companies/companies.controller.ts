import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // ─── Create a new company (authenticated) ──────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard)
  createCompany(
    @Req() req: Request & { user: { userId: string } },
    @Body() body: { name: string; slug: string; plan?: string },
  ) {
    return this.companiesService.createCompany(req.user.userId, body);
  }

  // ─── List all active companies (marketplace for agents) ────────────────────
  @Get()
  @UseGuards(JwtAuthGuard)
  listCompanies(@Query() query: { status?: string; search?: string }) {
    return this.companiesService.listCompanies(query);
  }

  // ─── My companies (agent's joined companies) ──────────────────────────────
  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyCompanies(@Req() req: Request & { user: { userId: string } }) {
    return this.companiesService.getMyCompanies(req.user.userId);
  }

  // ─── Get single company ────────────────────────────────────────────────────
  @Get(':idOrSlug')
  @UseGuards(JwtAuthGuard)
  getCompany(@Param('idOrSlug') idOrSlug: string) {
    return this.companiesService.getCompany(idOrSlug);
  }

  // ─── Update company (owner only) ─────────────────────────────────────────
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateCompany(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string } },
    @Body() body: { name?: string; logo?: string; domain?: string },
  ) {
    return this.companiesService.updateCompany(id, req.user.userId, body);
  }

  // ─── Agent joins a company ─────────────────────────────────────────────────
  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  joinCompany(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.companiesService.joinCompany(id, req.user.userId);
  }

  // ─── Agent leaves a company ────────────────────────────────────────────────
  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  leaveCompany(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.companiesService.leaveCompany(id, req.user.userId);
  }

  // ─── Get conversations for a company ───────────────────────────────────────
  @Get(':id/conversations')
  @UseGuards(JwtAuthGuard)
  getCompanyConversations(
    @Param('id') id: string,
    @Query() query: { status?: string; assignedToId?: string },
  ) {
    return this.companiesService.getCompanyConversations(id, query);
  }

  // ─── Public anchor info (for embedding widget) ────────────────────────────
  @Get('anchor/:slug')
  getAnchorInfo(@Param('slug') slug: string) {
    return this.companiesService.getAnchorInfo(slug);
  }

  // ─── Inbound message via anchor (NO AUTH — public webhook) ────────────────
  @Post('anchor/:token/ingest')
  ingestViaAnchor(
    @Param('token') token: string,
    @Body() body: { clientName: string; clientEmail?: string; clientPhone?: string; message: string; channel?: string },
  ) {
    return this.companiesService.ingestViaAnchor(token, body);
  }
}
