import { useEffect, useCallback, useRef } from 'react';

interface WebSocketMessage {
  type: 'message' | 'conversation' | 'status';
  data: unknown;
}

export function useWebSocket(url: string, onMessage: (msg: WebSocketMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          onMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected, reconnecting in 5s...');
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    }
  }, [url, onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    send: (message: unknown) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
      }
    },
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
}
