import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL ?? 'http://localhost:3000'
    ],
    credentials: true
  }
})
export class MessagesGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(MessagesGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;

    if (!token) {
      this.logger.warn(`Socket ${client.id} rejected — no token`);
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify(token) as { sub: string; role: string };
      client.data.userId = payload.sub;
      client.data.role = payload.role;
      this.logger.log(`Socket ${client.id} connected (user: ${payload.sub})`);
    } catch {
      this.logger.warn(`Socket ${client.id} rejected — invalid token`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket ${client.id} disconnected`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, data: { conversationId: string }) {
    client.join(`conversation:${data.conversationId}`);
    this.logger.log(`Socket ${client.id} subscribed to conversation ${data.conversationId}`);
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, data: { conversationId: string }) {
    client.leave(`conversation:${data.conversationId}`);
  }

  emitNewMessage(conversationId: string, message: unknown) {
    this.server.to(`conversation:${conversationId}`).emit('message:new', {
      type: 'message',
      data: message
    });
    // Also broadcast to global room so the inbox list can refresh/badge
    this.server.emit('inbox:update', { conversationId });
  }

  emitConversationUpdate(conversationId: string, conversation: unknown) {
    this.server.to(`conversation:${conversationId}`).emit('conversation:update', {
      type: 'conversation',
      data: conversation
    });
    this.server.emit('inbox:update', { conversationId });
  }

  emitTypingIndicator(conversationId: string, userId: string, isTyping: boolean) {
    this.server.to(`conversation:${conversationId}`).emit('user:typing', {
      userId,
      isTyping
    });
  }
}
