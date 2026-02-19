import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { prisma } from '@chat/db';

// Mock the prisma client
jest.mock('@chat/db', () => ({
  prisma: {
    paymentIntent: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn()
    },
    client: {
      findUnique: jest.fn()
    }
  }
}));

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentsService]
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('createPaymentLink', () => {
    it('should create a payment intent for Stripe', async () => {
      const input = {
        clientId: 'client_1',
        provider: 'stripe',
        amount: 5000,
        currency: 'USD'
      };

      const mockPaymentIntent = {
        id: 'pi_1',
        externalId: 'pi_test_123',
        status: 'pending'
      };

      (prisma.paymentIntent.create as jest.Mock).mockResolvedValue(mockPaymentIntent);

      const result = await service.createPaymentLink(input);

      expect(result).toBeDefined();
      expect(prisma.paymentIntent.create).toHaveBeenCalled();
    });

    it('should validate amount is positive', async () => {
      const input = {
        clientId: 'client_1',
        provider: 'stripe',
        amount: -100,
        currency: 'USD'
      };

      await expect(service.createPaymentLink(input)).rejects.toThrow();
    });
  });

  describe('handleWebhook', () => {
    it('should update payment status from webhook', async () => {
      const webhookData = {
        externalId: 'pi_test_123',
        status: 'completed'
      };

      const mockPaymentIntent = {
        id: 'pi_1',
        status: 'completed'
      };

      (prisma.paymentIntent.findFirst as jest.Mock).mockResolvedValue({
        id: 'pi_1',
        externalId: 'pi_test_123'
      });
      (prisma.paymentIntent.update as jest.Mock).mockResolvedValue(mockPaymentIntent);

      const result = await service.handleWebhook('stripe', webhookData);

      expect(result.status).toBe('completed');
      expect(prisma.paymentIntent.update).toHaveBeenCalled();
    });
  });
});
