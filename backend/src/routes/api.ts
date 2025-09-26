import { Router, Request, Response } from 'express';
import { messageStore } from '../services/messageStore.js';

const router: Router = Router();

/**
 * 現在の感情状態一覧を取得
 */
router.get('/emotions', (req: Request, res: Response) => {
  try {
    const emotions = messageStore.getAllUserEmotions();
    res.json({
      success: true,
      data: emotions,
      count: emotions.length
    });
  } catch (error) {
    console.error('❌ 感情状態取得エラー:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * 過去10分間のメッセージ一覧を取得
 */
router.get('/messages', (req: Request, res: Response) => {
  try {
    const messages = messageStore.getRecentMessages();
    res.json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (error) {
    console.error('❌ メッセージ取得エラー:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * 特定ユーザーの感情状態を取得
 */
router.get('/emotions/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const emotion = messageStore.getUserEmotion(userId);
    
    if (!emotion) {
      return res.status(404).json({
        success: false,
        error: 'User emotion not found'
      });
    }

    res.json({
      success: true,
      data: emotion
    });
  } catch (error) {
    console.error('❌ ユーザー感情取得エラー:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * 特定ユーザーの過去10分間のメッセージを取得
 */
router.get('/messages/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const messages = messageStore.getUserRecentMessages(userId);
    
    res.json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (error) {
    console.error('❌ ユーザーメッセージ取得エラー:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * システム統計情報を取得
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = messageStore.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ 統計情報取得エラー:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * ヘルスチェックエンドポイント
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
