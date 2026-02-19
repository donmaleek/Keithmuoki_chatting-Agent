# WebSocket & Real-time Updates

This guide explains how real-time updates work in the Chatting Agent.

## Architecture

The system uses Socket.io for bidirectional communication between frontend and backend:

```
┌─────────────┐                    ┌──────────────┐
│   Client    │ ← WebSocket →      │   Backend    │
│  (Browser)  │   (Socket.io)      │   Server     │
└─────────────┘                    └──────────────┘
      │                                    │
      ├─ subscribe(conversationId)        │
      │                                   ├─ Store subscription
      │◄─ message:new ───────────────────┤
      │◄─ conversation:update ───────────┤
      │◄─ user:typing ──────────────────┤
      │                                   │
      └─ unsubscribe() ────────────────►─┤
```

## Backend: WebSocket Gateway

The `MessagesGateway` handles all WebSocket connections and subscriptions.

### Subscribing to a Conversation

```typescript
// In frontend, subscribe once conversation is selected
socket.emit('subscribe', { conversationId: 'conv_123' });
```

### Emitting Events

Backend can emit events to specific conversations:

```typescript
// Emit new message to all subscribers
this.messagesGateway.emitNewMessage(conversationId, messageData);

// Emit conversation status update
this.messagesGateway.emitConversationUpdate(conversationId, conversationData);

// Emit typing indicator
this.messagesGateway.emitTypingIndicator(conversationId, userId, true);
```

### Integration with Services

Update `MessagesService` to emit events when creating messages:

```typescript
async ingest(input: ConversationIngestInput) {
  // ... create message
  
  // Emit real-time update
  this.messagesGateway.emitNewMessage(
    conversation.id,
    message
  );
  
  return message;
}
```

## Frontend: Using WebSocket

### useWebSocket Hook

The custom hook handles connection, reconnection, and message parsing:

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

export function MessageThread({ conversationId }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleWebSocketMessage = (msg: any) => {
    if (msg.type === 'message') {
      // Add new message to list
      setMessages(prev => [...prev, msg.data]);
    } else if (msg.type === 'conversation') {
      // Update conversation status
      // ...
    }
  };

  const { send, isConnected } = useWebSocket(
    `ws://localhost:3001?token=${token}`,
    handleWebSocketMessage
  );

  useEffect(() => {
    if (isConnected) {
      // Subscribe to this conversation
      send({ type: 'subscribe', conversationId });
    }

    return () => {
      if (isConnected) {
        send({ type: 'unsubscribe', conversationId });
      }
    };
  }, [isConnected, conversationId]);

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

### Updated ConversationList

The conversation list now polls every 10 seconds instead of once on mount, ready for WebSocket replacement:

```typescript
useEffect(() => {
  fetchConversations();
  
  // Auto-refresh every 10 seconds (transition to WebSocket)
  const interval = setInterval(fetchConversations, 10000);
  return () => clearInterval(interval);
}, []);
```

### Updated MessageThread

The message thread now polls every 5 seconds instead of once on mount:

```typescript
useEffect(() => {
  if (!conversationId) {
    setMessages([]);
    return;
  }

  fetchMessages();
  
  // Auto-refresh every 5 seconds
  const interval = setInterval(fetchMessages, 5000);
  return () => clearInterval(interval);
}, [conversationId]);
```

## Migration Path: Polling → WebSocket

### Phase 1: Current State (Polling)
- Frontend polls every 5-10 seconds
- Low-stress for small user bases
- Better browser compatibility
- Setup is in place

### Phase 2: WebSocket (Production)
- Replace polling with real-time subscriptions
- Enable Socket.io in NestJS app module
- Update useWebSocket hook to actual server URL
- Deploy with `@nestjs/websockets` and `socket.io`
- Install on frontend: `npm install socket.io-client`

### Phase 3: Advanced (Optional)
- Add Redis adapter for scaling WebSocket across multiple servers
- Implement typing indicators
- Add presence features (who's viewing conversation)
- Broadcast agent status updates

## Configuration

### Environment Variables

```bash
# .env.local (Frontend)
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001

# .env (Backend)
WEBSOCKET_ENABLED=true
CORS_ORIGIN=http://localhost:3000
```

### NestJS Configuration

The WebSocket gateway is pre-configured in:
- `apps/backend/src/messages/messages.gateway.ts`
- `apps/backend/src/messages/messages.module.ts`

To enable in production:
1. Add `@nestjs/websockets` to backend dependencies
2. Enable in app.module.ts
3. Update frontend to use real WebSocket connection
4. Deploy with WebSocket support

## Testing WebSocket Components

```typescript
describe('MessageThread with WebSocket', () => {
  it('should receive new messages via WebSocket', async () => {
    const mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn()
    };

    // Mock socket connection
    (global as any).io = jest.fn(() => mockSocket);

    render(<MessageThread conversationId="conv_1" />);

    // Simulate message from server
    const messageHandler = mockSocket.on.mock.calls[0][1];
    messageHandler({
      type: 'message',
      data: { id: 'msg_1', content: 'Real-time message' }
    });

    await waitFor(() => {
      expect(screen.getByText('Real-time message')).toBeInTheDocument();
    });
  });
});
```

## Performance Considerations

1. **Connection Pooling**: One WebSocket per browser tab
2. **Memory Management**: Unsubscribe from conversations when not needed
3. **Message Batching**: Buffer and send messages in batches if needed
4. **Reconnection Strategy**: Automatic reconnection with exponential backoff
5. **Message History**: Don't rely only on WebSocket, keep polling as fallback

## Troubleshooting

### WebSocket Not Connecting

```bash
# Check if backend server is running
curl http://localhost:3001/health

# Check browser console for connection errors
# Look for CORS issues
```

### Messages Not Updating

1. Verify subscription was sent: `socket.emit('subscribe', { conversationId })`
2. Check backend is calling `emitNewMessage()`
3. Verify CORS origin matches frontend URL
4. Check browser WebSocket in DevTools

### High Latency

1. Check network quality
2. Reduce message batch size
3. Disable other polling if using WebSocket
4. Consider message throttling

## Next Steps

1. Install Socket.io dependencies in production
2. Update frontend to initialize Socket.io connection on app load
3. Replace polling with real-time listeners
4. Add typing indicators
5. Monitor WebSocket connections in production
