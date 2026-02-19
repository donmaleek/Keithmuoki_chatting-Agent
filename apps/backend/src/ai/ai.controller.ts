import { Body, Controller, Patch, Post, Param, Get, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * Called by the frontend ReplyEditor when aiMode === 'draft'.
   * Returns a suggested reply without persisting it — the agent reviews and sends manually.
   */
  @Post('respond')
  @UseGuards(JwtAuthGuard)
  respond(@Body() body: { conversationId: string; message: string }) {
    return this.aiService.generateReply(body.conversationId, body.message);
  }

  /**
   * GET /ai/persona
   * Returns the current AI system prompt (the persona the AI speaks as).
   */
  @Get('persona')
  @UseGuards(JwtAuthGuard)
  getPersona(@Request() req: { user: { userId: string } }) {
    return this.aiService.getPersona(req.user.userId);
  }

  /**
   * PATCH /ai/persona
   * Update the AI persona / system prompt so AI learns to respond like the owner.
   * Body: { systemPrompt: string }
   */
  @Patch('persona')
  @UseGuards(JwtAuthGuard)
  updatePersona(
    @Request() req: { user: { userId: string } },
    @Body() body: { systemPrompt: string }
  ) {
    return this.aiService.updatePersona(req.user.userId, body.systemPrompt);
  }

  /**
   * PATCH /ai/sales-context
   * Update the product catalog / sales context that gets injected into AI replies.
   * Body: { salesContext: string }
   */
  @Patch('sales-context')
  @UseGuards(JwtAuthGuard)
  updateSalesContext(
    @Request() req: { user: { userId: string } },
    @Body() body: { salesContext: string }
  ) {
    return this.aiService.updateSalesContext(req.user.userId, body.salesContext);
  }

  /**
   * PATCH /ai/conversations/:id/mode
   * Toggle AI on/off for a specific conversation.
   * Body: { mode: 'auto' | 'draft' | 'manual' }
   *   - auto   → AI replies automatically to every client message
   *   - draft  → AI suggests a reply; agent reviews and sends it
   *   - manual → AI is off; agent handles everything themselves
   */
  @Patch('conversations/:id/mode')
  @UseGuards(JwtAuthGuard)
  setConversationMode(
    @Param('id') conversationId: string,
    @Body() body: { mode: 'auto' | 'draft' | 'manual' }
  ) {
    return this.aiService.setConversationMode(conversationId, body.mode);
  }

  /**
   * GET /ai/stats
   * Returns AI usage stats: total runs, total cost, tokens used.
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats() {
    return this.aiService.getStats();
  }
}
