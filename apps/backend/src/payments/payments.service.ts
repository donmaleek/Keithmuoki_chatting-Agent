import { BadRequestException, Injectable } from '@nestjs/common';
import { prisma } from '@chat/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const paymentSchema = z.object({
  clientId: z.string().min(1),
  provider: z.enum(['stripe', 'paystack']).optional(),
  amount: z.number().int().positive(),
  currency: z.string().min(3)
});

const webhookSchema = z.object({
  paymentIntentId: z.string().min(1),
  status: z.enum(['pending', 'paid', 'failed']),
  metadata: z.record(z.unknown()).optional()
});

@Injectable()
export class PaymentsService {
  async createPaymentLink(payload: Record<string, unknown>) {
    const parsed = paymentSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const { clientId, amount, currency } = parsed.data;
    const provider = parsed.data.provider ?? 'stripe';

    const paymentIntent = await prisma.paymentIntent.create({
      data: {
        clientId,
        provider,
        amount,
        currency,
        status: 'pending'
      }
    });

    return {
      provider,
      url: 'https://pay.example.com/checkout',
      paymentIntentId: paymentIntent.id
    };
  }

  async handleWebhook(provider: 'stripe' | 'paystack', payload: Record<string, unknown>) {
    const parsed = webhookSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const { paymentIntentId, status, metadata } = parsed.data;

    const updated = await prisma.paymentIntent.update({
      where: { id: paymentIntentId },
      data: { status }
    });

    await prisma.auditLog.create({
      data: {
        actor: provider,
        action: 'payment_webhook',
        resourceType: 'PaymentIntent',
        resourceId: updated.id,
        details: (metadata ?? {}) as unknown as Prisma.InputJsonValue
      }
    });

    return { status: 'ok' };
  }
}
