import { WSEvent } from '@/types';

type EventCallback = (data: any) => void;

class SocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: any = null;
  private isConnecting = false;

  public connect(token: string) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = process.env.NEXT_PUBLIC_WS_URL || `${wsProtocol}//${window.location.hostname}:8080/ws`;
    const url = `${wsHost}?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected successfully');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.emit('connection.open', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const payload: WSEvent = JSON.parse(event.data);
          this.dispatch(payload.event, payload.data);
        } catch (err) {
          console.error('[WebSocket] Failed to parse message', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.emit('connection.close', {});
        this.scheduleReconnect(token);
      };

      this.ws.onerror = (err) => {
        console.warn('[WebSocket] Error occurred', err);
        this.ws?.close();
      };
    } catch (err) {
      this.isConnecting = false;
      this.scheduleReconnect(token);
    }
  }

  private scheduleReconnect(token: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WebSocket] Max reconnect attempts reached');
      return;
    }
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);
    this.reconnectAttempts++;
    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect(token);
    }, delay);
  }

  public on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: EventCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  private dispatch(event: string, data: any) {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (err) {
        console.error(`[WebSocket] Listener error for ${event}`, err);
      }
    });
  }

  public emit(event: string, data: any) {
    this.dispatch(event, data);
  }

  public send(event: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    }
  }

  public subscribeToChannel(channelId: string) {
    this.send('subscribe', { channel_id: channelId });
  }

  public unsubscribeFromChannel(channelId: string) {
    this.send('unsubscribe', { channel_id: channelId });
  }

  public sendTyping(channelId: string, isTyping: boolean) {
    this.send(isTyping ? 'typing.start' : 'typing.stop', { channel_id: channelId });
  }

  public disconnect() {
    clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
  }
}

export const socketClient = new SocketClient();

