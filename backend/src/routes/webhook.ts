import { Router, Request, Response } from 'express';
import { ChatMessage, GoogleChatWebhook, UserEmotionState } from '../types/index.js';
import { messageStore } from '../services/messageStore.js';
import { EmotionAnalyzer } from '../services/emotionAnalyzer.js';
import { WebSocketManager } from '../services/websocketManager.js';

const router: Router = Router();

// Gemini API キー（環境変数から取得）
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'demo_key';
const emotionAnalyzer = new EmotionAnalyzer(GEMINI_API_KEY);

let websocketManager: WebSocketManager;

// WebSocketManagerを設定
export function setWebSocketManager(wsManager: WebSocketManager) {
  websocketManager = wsManager;
}

/**
 * Google Chat Webhook エンドポイント
 */
router.post('/google-chat', async (req: Request, res: Response) => {
  try {
    const webhook: GoogleChatWebhook = req.body;
    
    console.log('📨 Google Chat Webhook受信:', webhook);

    // メッセージデータを抽出
    const chatMessage: ChatMessage = {
      id: webhook.message.name,
      content: webhook.message.text,
      userName: webhook.message.sender.displayName,
      userId: webhook.message.sender.name,
      timestamp: new Date(webhook.message.createTime).getTime()
    };

    // メッセージをストレージに保存
    messageStore.addMessage(chatMessage);

    // 過去10分間のユーザーメッセージを取得
    const userRecentMessages = messageStore.getUserRecentMessages(chatMessage.userId);

    // 感情分析を実行
    const emotionAnalysis = await emotionAnalyzer.analyzeEmotion(
      userRecentMessages, 
      chatMessage.userId
    );

    // メッセージに感情分析結果を追加
    chatMessage.emotion = emotionAnalysis;

    // ユーザー感情状態を更新
    const emotionState: UserEmotionState = {
      userId: chatMessage.userId,
      userName: chatMessage.userName,
      currentEmotion: emotionAnalysis,
      lastUpdated: Date.now()
    };

    messageStore.updateUserEmotion(emotionState);

    // WebSocket経由で全クライアントに送信
    if (websocketManager) {
      websocketManager.broadcastNewMessage(chatMessage);
      websocketManager.broadcastEmotionUpdate(messageStore.getAllUserEmotions());
    }

    console.log(`✅ メッセージ処理完了: ${chatMessage.userName} - ${emotionAnalysis.emotion}`);

    res.status(200).json({ 
      success: true, 
      emotion: emotionAnalysis.emotion,
      confidence: emotionAnalysis.confidence
    });

  } catch (error) {
    console.error('❌ Webhook処理エラー:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * テスト用メッセージ送信エンドポイント
 */
router.post('/test-message', async (req: Request, res: Response) => {
  try {
    const { content, userName = 'TestUser', userId = 'test_user_1' } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content は必須です' });
    }

    // テストメッセージを作成
    const chatMessage: ChatMessage = {
      id: `test_${Date.now()}`,
      content,
      userName,
      userId,
      timestamp: Date.now()
    };

    // メッセージをストレージに保存
    messageStore.addMessage(chatMessage);

    // 過去10分間のユーザーメッセージを取得
    const userRecentMessages = messageStore.getUserRecentMessages(userId);

    // 感情分析を実行（シンプル版を使用）
    const emotionAnalysis = emotionAnalyzer.analyzeEmotionSimple(content);
    chatMessage.emotion = emotionAnalysis;

    // ユーザー感情状態を更新
    const emotionState: UserEmotionState = {
      userId,
      userName,
      currentEmotion: emotionAnalysis,
      lastUpdated: Date.now()
    };

    messageStore.updateUserEmotion(emotionState);

    // WebSocket経由で全クライアントに送信
    if (websocketManager) {
      websocketManager.broadcastNewMessage(chatMessage);
      websocketManager.broadcastEmotionUpdate(messageStore.getAllUserEmotions());
    }

    console.log(`✅ テストメッセージ処理完了: ${userName} - ${emotionAnalysis.emotion}`);

    res.json({ 
      success: true,
      message: chatMessage,
      emotion: emotionAnalysis 
    });

  } catch (error) {
    console.error('❌ テストメッセージ処理エラー:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
