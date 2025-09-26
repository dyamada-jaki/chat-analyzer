import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { WebSocketMessage, UserEmotionState } from '../types/index.js';

/**
 * WebSocket接続を管理するクラス
 */
export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocketServer();
  }

  /**
   * WebSocketサーバーのセットアップ
   */
  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('🔌 WebSocket接続が確立されました');
      this.clients.add(ws);

      // 接続確認メッセージを送信
      this.sendToClient(ws, {
        type: 'user_joined',
        data: { message: '接続が確立されました' },
        timestamp: Date.now()
      });

      // 切断時の処理
      ws.on('close', () => {
        console.log('🔌 WebSocket接続が切断されました');
        this.clients.delete(ws);
      });

      // エラーハンドリング
      ws.on('error', (error) => {
        console.error('❌ WebSocketエラー:', error);
        this.clients.delete(ws);
      });

      // メッセージ受信時の処理
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('📨 WebSocketメッセージ受信:', message);
          // 必要に応じてメッセージを処理
        } catch (error) {
          console.error('❌ WebSocketメッセージ解析エラー:', error);
        }
      });
    });

    console.log('🚀 WebSocketサーバーが起動しました');
  }

  /**
   * 感情状態の更新を全クライアントに送信
   */
  broadcastEmotionUpdate(emotions: UserEmotionState[]): void {
    const message: WebSocketMessage = {
      type: 'emotion_update',
      data: { emotions },
      timestamp: Date.now()
    };

    this.broadcast(message);
  }

  /**
   * 新しいメッセージを全クライアントに送信
   */
  broadcastNewMessage(messageData: any): void {
    const message: WebSocketMessage = {
      type: 'new_message',
      data: messageData,
      timestamp: Date.now()
    };

    this.broadcast(message);
  }

  /**
   * 全クライアントにメッセージをブロードキャスト
   */
  private broadcast(message: WebSocketMessage): void {
    const messageString = JSON.stringify(message);
    
    // アクティブな接続のみに送信
    const activeClients = new Set<WebSocket>();
    
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageString);
          activeClients.add(client);
        } catch (error) {
          console.error('❌ WebSocket送信エラー:', error);
          this.clients.delete(client);
        }
      } else {
        this.clients.delete(client);
      }
    }

    this.clients = activeClients;
    console.log(`📡 ${this.clients.size}個のクライアントにブロードキャスト: ${message.type}`);
  }

  /**
   * 特定のクライアントにメッセージを送信
   */
  private sendToClient(client: WebSocket, message: WebSocketMessage): void {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        console.error('❌ WebSocket送信エラー:', error);
        this.clients.delete(client);
      }
    }
  }

  /**
   * 接続中のクライアント数を取得
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * WebSocketサーバーを停止
   */
  close(): void {
    this.wss.close(() => {
      console.log('🛑 WebSocketサーバーが停止しました');
    });
  }
}
