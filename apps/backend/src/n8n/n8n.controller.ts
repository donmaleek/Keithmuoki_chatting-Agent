import { Body, Controller, Post } from '@nestjs/common';
import { N8nService } from './n8n.service';

@Controller('n8n')
export class N8nController {
  constructor(private readonly n8nService: N8nService) {}

  @Post('trigger')
  trigger(@Body() payload: Record<string, unknown>) {
    return this.n8nService.trigger(payload);
  }

  @Post('status')
  status(@Body() payload: Record<string, unknown>) {
    return this.n8nService.status(payload);
  }
}
