// メッセージ関連の型定義
export interface ChatMessage {
  id: string;
  content: string;
  userName: string;
  userId: string;
  timestamp: number;
  emotion?: EmotionAnalysis;
}

// 感情分析結果の型定義
export interface EmotionAnalysis {
  emotion: EmotionType;
  confidence: number;
  timestamp: number;
}

// 感情の種類
export type EmotionType = 'positive' | 'negative' | 'angry' | 'neutral';

// ユーザーの感情状態
export interface UserEmotionState {
  userId: string;
  userName: string;
  currentEmotion: EmotionAnalysis;
  lastUpdated: number;
}

// Google Chat Webhook ペイロード
export interface GoogleChatWebhook {
  type: string;
  eventTime: string;
  message: {
    name: string;
    sender: {
      name: string;
      displayName: string;
      type: string;
    };
    text: string;
    createTime: string;
    space: {
      name: string;
      type: string;
    };
  };
}

// WebSocket メッセージ型
export interface WebSocketMessage {
  type: 'emotion_update' | 'new_message' | 'user_joined' | 'user_left';
  data: any;
  timestamp: number;
}
