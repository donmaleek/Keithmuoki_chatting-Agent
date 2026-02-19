import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { TeamService } from './team.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('team')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  // ─── Agent Management (Admin only) ──────────────────────────────────────────

  @Get('agents')
  @Roles('admin')
  listAgents() {
    return this.teamService.listAgents();
  }

  @Get('agents/:id')
  @Roles('admin')
  getAgent(@Param('id') id: string) {
    return this.teamService.getAgent(id);
  }

  @Post('agents')
  @Roles('admin')
  createAgent(
    @Body() body: { email: string; name: string; password: string; role?: 'admin' | 'agent' },
  ) {
    return this.teamService.createAgent(body);
  }

  @Patch('agents/:id')
  @Roles('admin')
  updateAgent(
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; role?: 'admin' | 'agent'; isActive?: boolean },
  ) {
    return this.teamService.updateAgent(id, body);
  }

  @Patch('agents/:id/password')
  @Roles('admin')
  resetPassword(
    @Param('id') id: string,
    @Body() body: { password: string },
  ) {
    return this.teamService.resetAgentPassword(id, body.password);
  }

  // ─── Conversation Assignment ─────────────────────────────────────────────────

  @Post('conversations/:id/assign')
  @Roles('admin')
  assignConversation(
    @Param('id') conversationId: string,
    @Body() body: { agentId: string },
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.teamService.assignConversation(conversationId, body.agentId, req.user.userId);
  }

  @Post('conversations/:id/unassign')
  @Roles('admin')
  unassignConversation(
    @Param('id') conversationId: string,
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.teamService.unassignConversation(conversationId, req.user.userId);
  }

  @Get('conversations/:id/history')
  getAssignmentHistory(@Param('id') conversationId: string) {
    return this.teamService.getConversationHistory(conversationId);
  }

  // ─── Performance & Bonuses ───────────────────────────────────────────────────

  @Get('performance')
  @Roles('admin')
  getTeamPerformance(@Query('days') days?: string) {
    return this.teamService.getTeamPerformance(days ? parseInt(days, 10) : 30);
  }

  @Get('performance/:id')
  @Roles('admin')
  getAgentPerformance(
    @Param('id') agentId: string,
    @Query('days') days?: string,
  ) {
    return this.teamService.getAgentPerformance(agentId, days ? parseInt(days, 10) : 30);
  }
}
