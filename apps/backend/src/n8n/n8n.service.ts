import { BadRequestException, Injectable } from '@nestjs/common';
import { prisma } from '@chat/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const triggerSchema = z.object({
  workflow: z.string().min(1),
  payload: z.record(z.unknown()).optional()
});

const statusSchema = z.object({
  workflow: z.string().min(1),
  runId: z.string().min(1),
  status: z.enum(['success', 'failed', 'running']),
  metadata: z.record(z.unknown()).optional()
});

@Injectable()
export class N8nService {
  async trigger(payload: Record<string, unknown>) {
    const parsed = triggerSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    await prisma.auditLog.create({
      data: {
        actor: 'n8n',
        action: 'trigger',
        details: parsed.data as unknown as Prisma.InputJsonValue
      }
    });

    return { status: 'accepted' };
  }

  async status(payload: Record<string, unknown>) {
    const parsed = statusSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    await prisma.auditLog.create({
      data: {
        actor: 'n8n',
        action: 'status',
        details: parsed.data as unknown as Prisma.InputJsonValue
      }
    });

    return { status: 'recorded' };
  }
}
