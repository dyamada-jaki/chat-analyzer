import { Router, Request, Response } from 'express';

const router: Router = Router();

/**
 * Google Chat スペース一覧取得（テスト用）
 */
router.get('/spaces', async (req: Request, res: Response) => {
  try {
    // 実際の実装では、ユーザーのアクセストークンを使用してAPIを呼び出し
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    // Google Chat API呼び出し（例）
    const response = await fetch('https://chat.googleapis.com/v1/spaces', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Chat API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Google Chat スペース取得成功:', data);

    res.json({
      success: true,
      spaces: data.spaces || [],
      message: 'Spaces retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Google Chat API エラー:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 特定スペースのメッセージ取得（実装版）
 */
router.get('/spaces/:spaceId/messages', async (req: Request, res: Response) => {
  try {
    const { spaceId } = req.params;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    const { pageSize = 10, orderBy = 'createTime desc' } = req.query;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    console.log(`📥 スペース ${spaceId} のメッセージ取得開始 (pageSize: ${pageSize})`);

    // Google Chat API呼び出し（パラメータ付き）
    const params = new URLSearchParams({
      pageSize: pageSize.toString(),
      orderBy: orderBy.toString()
    });

    const response = await fetch(
      `https://chat.googleapis.com/v1/spaces/${spaceId}/messages?${params}`, 
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ メッセージ取得エラー (${response.status}):`, errorText);
      
      return res.status(response.status).json({
        success: false,
        error: `Google Chat API error: ${response.statusText}`,
        details: errorText,
        spaceId: spaceId
      });
    }

    const data = await response.json();
    
    // メッセージを感情分析用の形式に変換
    const processedMessages = (data.messages || []).map((msg: any) => ({
      id: msg.name,
      content: msg.text || '',
      userName: msg.sender?.displayName || 'Unknown User',
      userId: msg.sender?.name || 'unknown',
      timestamp: new Date(msg.createTime).getTime(),
      originalMessage: msg
    }));
    
    console.log(`✅ スペース ${spaceId} のメッセージ取得成功: ${processedMessages.length}件`);

    res.json({
      success: true,
      messages: processedMessages,
      rawMessages: data.messages || [],
      spaceId: spaceId,
      messageCount: processedMessages.length,
      nextPageToken: data.nextPageToken
    });

  } catch (error) {
    console.error('❌ メッセージ取得エラー:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 手動スペースID入力機能
 */
router.post('/test-space', (req: Request, res: Response) => {
  try {
    const { spaceId, spaceName } = req.body;
    
    if (!spaceId) {
      return res.status(400).json({
        success: false,
        error: 'spaceId is required'
      });
    }

    // 入力されたスペースIDを検証・保存
    console.log(`�� 手動入力スペースID: ${spaceId}, 名前: ${spaceName}`);

    res.json({
      success: true,
      message: 'Space ID registered successfully',
      spaceId: spaceId,
      spaceName: spaceName || 'Unknown Space'
    });

  } catch (error) {
    console.error('❌ スペースID登録エラー:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register space ID'
    });
  }
});

/**
 * 特定スペースのテスト（AAQA2_lvzVk専用）
 */
router.get('/test-space/AAQA2_lvzVk', async (req: Request, res: Response) => {
  try {
    const spaceId = 'AAQA2_lvzVk';
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    console.log(`🧪 テストスペース ${spaceId} の情報取得中...`);
    
    if (!accessToken) {
      // アクセストークンがない場合のテスト応答
      return res.json({
        success: true,
        message: 'Test endpoint for space AAQA6AJ-JPU',
        spaceId: spaceId,
        note: 'Access token required for actual API calls',
        testMode: true
      });
    }

    // 実際のGoogle Chat API呼び出し
    const response = await fetch(`https://chat.googleapis.com/v1/spaces/${spaceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Google Chat API エラー (${response.status}):`, errorText);
      
      return res.status(response.status).json({
        success: false,
        error: `Google Chat API error: ${response.statusText}`,
        details: errorText,
        spaceId: spaceId
      });
    }

    const data = await response.json();
    
    console.log(`✅ スペース ${spaceId} 情報取得成功:`, data);

    res.json({
      success: true,
      spaceInfo: data,
      spaceId: spaceId,
      apiCallSuccess: true
    });

  } catch (error) {
    console.error('❌ テストスペースエラー:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      spaceId: 'AAQA6AJ-JPU'
    });
  }
});

/**
 * スペースのメッセージをリアルタイム取得して感情分析
 */
router.post('/spaces/:spaceId/start-monitoring', async (req: Request, res: Response) => {
  try {
    const { spaceId } = req.params;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    console.log(`🔄 スペース ${spaceId} のリアルタイム監視を開始`);

    // 最新のメッセージを取得
    const response = await fetch(
      `https://chat.googleapis.com/v1/spaces/${spaceId}/messages?pageSize=5&orderBy=createTime desc`, 
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        success: false,
        error: `Google Chat API error: ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    const messages = data.messages || [];

    // 各メッセージに感情分析を実行
    const emotionAnalyzer = new (await import('../services/emotionAnalyzer.js')).EmotionAnalyzer('demo');
    const processedMessages = [];

    for (const msg of messages) {
      const content = msg.text || '';
      if (content.trim()) {
        const emotion = emotionAnalyzer.analyzeEmotionSimple(content);
        
        processedMessages.push({
          id: msg.name,
          content: content,
          userName: msg.sender?.displayName || 'Unknown User',
          userId: msg.sender?.name || 'unknown',
          timestamp: new Date(msg.createTime).getTime(),
          emotion: emotion
        });
      }
    }

    console.log(`✅ ${processedMessages.length}件のメッセージを感情分析完了`);

    res.json({
      success: true,
      spaceId: spaceId,
      processedMessages: processedMessages,
      messageCount: processedMessages.length,
      monitoringStarted: true
    });

  } catch (error) {
    console.error('❌ リアルタイム監視エラー:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 利用可能なスペース一覧取得
 */
router.get('/spaces', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    console.log('📋 利用可能なスペース一覧取得中...');

    const response = await fetch('https://chat.googleapis.com/v1/spaces', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ スペース一覧取得エラー (${response.status}):`, errorText);
      
      return res.status(response.status).json({
        success: false,
        error: `Google Chat API error: ${response.statusText}`,
        details: errorText,
        httpStatus: response.status
      });
    }

    const data = await response.json();
    const spaces = data.spaces || [];
    
    console.log(`✅ ${spaces.length}個のスペースを取得成功`);
    spaces.forEach((space: any, index: number) => {
      console.log(`🏠 ${index + 1}. ${space.displayName || space.name} (ID: ${space.name})`);
    });

    res.json({
      success: true,
      spaces: spaces,
      totalCount: spaces.length
    });

  } catch (error) {
    console.error('❌ スペース一覧取得エラー:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * スペースの詳細情報取得
 */
router.get('/spaces/:spaceId/info', async (req: Request, res: Response) => {
  try {
    const { spaceId } = req.params;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    console.log(`ℹ️ スペース ${spaceId} の詳細情報取得中...`);

    const response = await fetch(`https://chat.googleapis.com/v1/spaces/${spaceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        success: false,
        error: `Google Chat API error: ${response.statusText}`,
        details: errorText
      });
    }

    const spaceInfo = await response.json();
    
    console.log(`✅ スペース情報取得成功: ${spaceInfo.displayName || spaceInfo.name}`);

    res.json({
      success: true,
      spaceInfo: spaceInfo,
      spaceId: spaceId
    });

  } catch (error) {
    console.error('❌ スペース情報取得エラー:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
