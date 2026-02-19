import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { prisma } from '@chat/db';

// Mock the prisma client
jest.mock('@chat/db', () => ({
  prisma: {
    client: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn()
    },
    conversation: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn()
    }
  }
}));

describe('MessagesService', () => {
  let service: MessagesService;
  let gateway: MessagesGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: MessagesGateway,
          useValue: {
            emitNewMessage: jest.fn(),
            emitConversationUpdate: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    gateway = module.get<MessagesGateway>(MessagesGateway);
  });

  describe('ingest', () => {
    it('should create a new message and conversation', async () => {
      const input = {
        client: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        },
        message: {
          content: 'Hello!',
          sender: 'client',
          channel: 'whatsapp',
          externalId: 'msg_123'
        }
      };

      const mockClient = { id: 'client_1', name: 'John Doe' };
      const mockConversation = {
        id: 'conv_1',
        clientId: 'client_1',
        channel: 'whatsapp',
        aiMode: 'auto'
      };
      const mockMessage = { id: 'msg_1', content: 'Hello!' };

      (prisma.message.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.client.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.client.create as jest.Mock).mockResolvedValue(mockClient);
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(mockConversation);
      (prisma.conversation.update as jest.Mock).mockResolvedValue(mockConversation);
      (prisma.message.create as jest.Mock).mockResolvedValue(mockMessage);

      const result = await service.ingest(input);

      expect(result.status).toBe('received');
      expect(result.conversationId).toBe('conv_1');
      expect(prisma.message.findUnique).toHaveBeenCalled();
    });
  });

  describe('listConversations', () => {
    it('should return paginated conversations', async () => {
      const mockConversations = [
        { id: 'conv_1', channel: 'whatsapp', status: 'open' },
        { id: 'conv_2', channel: 'email', status: 'open' }
      ];

      (prisma.conversation.findMany as jest.Mock).mockResolvedValue(mockConversations);

      const result = await service.listConversations({
        skip: '0',
        take: '50'
      });

      expect(result).toEqual(mockConversations);
      expect(prisma.conversation.findMany).toHaveBeenCalled();
    });
  });
});
