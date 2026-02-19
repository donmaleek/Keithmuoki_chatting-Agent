import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /** Called by channel webhooks (WhatsApp, Telegram, etc.) — no auth required */
  @Post('ingest')
  ingest(@Body() payload: Record<string, unknown>) {
    return this.messagesService.ingest(payload);
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  listConversations(
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('unassigned') unassigned?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string
  ) {
    return this.messagesService.listConversations({
      status,
      clientId,
      assignedToId,
      unassigned,
      skip,
      take
    });
  }

  @Get('conversations/:id')
  @UseGuards(JwtAuthGuard)
  getConversation(@Param('id') id: string) {
    return this.messagesService.getConversation(id);
  }

  @Get('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  listMessages(
    @Param('id') id: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string
  ) {
    return this.messagesService.listMessages(id, { skip, take });
  }

  /** Human takeover: change status or aiMode for a conversation */
  @Patch('conversations/:id')
  @UseGuards(JwtAuthGuard)
  patchConversation(@Param('id') id: string, @Body() body: { status?: string; aiMode?: string }) {
    return this.messagesService.patchConversation(id, body as any);
  }

  /** Send a manual reply as the logged-in agent */
  @Post('conversations/:id/reply')
  @UseGuards(JwtAuthGuard)
  sendReply(
    @Param('id') id: string,
    @Body() body: { content: string },
    @Req() req: Request & { user: { userId: string } }
  ) {
    return this.messagesService.sendReply(id, body.content, req.user.userId);
  }

  /**
   * POST /messages/reply
   * Flat version used by the ReplyEditor in the admin UI.
   * Body: { conversationId, content }
   */
  @Post('reply')
  @UseGuards(JwtAuthGuard)
  sendReplyFlat(
    @Body() body: { conversationId: string; content: string },
    @Req() req: Request & { user: { userId: string } }
  ) {
    return this.messagesService.sendReply(body.conversationId, body.content, req.user.userId);
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard)
  getAnalytics() {
    return this.messagesService.getAnalytics();
  }
}
