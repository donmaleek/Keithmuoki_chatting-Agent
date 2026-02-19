import { BadRequestException, Injectable } from '@nestjs/common';
import { prisma } from '@chat/db';
import { z } from 'zod';

const CreateInquirySchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  companyName: z.string().trim().min(2),
  phone: z.string().trim().optional(),
  teamSize: z.number().int().positive().optional(),
  monthlyVolume: z.number().int().positive().optional(),
  useCase: z.string().trim().min(10),
  planInterest: z.string().trim().min(2),
  budgetRange: z.string().trim().optional()
});

@Injectable()
export class GrowthService {
  async createInquiry(payload: unknown) {
    const parsed = CreateInquirySchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid inquiry payload',
        errors: parsed.error.flatten()
      });
    }

    const inquiry = await prisma.serviceInquiry.create({
      data: parsed.data
    });

    return {
      id: inquiry.id,
      status: inquiry.status,
      message: 'Inquiry submitted successfully. Our team will contact you shortly.'
    };
  }

  async listInquiries(status?: 'new' | 'contacted' | 'qualified' | 'won' | 'lost') {
    return prisma.serviceInquiry.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200
    });
  }
}
