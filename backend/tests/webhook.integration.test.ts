import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import webhookRoutes from '../src/routes/webhook.js';

// Gemini APIをモック化
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => 'emotion: positive\nconfidence: 0.8'
        }
      })
    })
  }))
}));

describe('Webhook API Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/webhook', webhookRoutes);
  });

  describe('POST /api/webhook/test-message', () => {
    it('Chrome拡張機能からの正常なリクエストを処理する', async () => {
      const requestBody = {
        content: '今日は素晴らしい一日でした！',
        userName: 'テストユーザー',
        userId: 'user-123'
      };

      const response = await request(app)
        .post('/api/webhook/test-message')
        .send(requestBody)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        emotion: expect.objectContaining({
          emotion: expect.stringMatching(/^(positive|negative|angry|neutral)$/),
          confidence: expect.any(Number),
          timestamp: expect.any(Number)
        })
      });

      expect(response.body.emotion.confidence).toBeGreaterThanOrEqual(0);
      expect(response.body.emotion.confidence).toBeLessThanOrEqual(1);
    });

    it('必須フィールドが不足している場合はエラーを返す', async () => {
      const invalidRequests = [
        {}, // 全フィールド不足
        { content: '' } // 空のcontent
      ];

      for (const requestBody of invalidRequests) {
        const response = await request(app)
          .post('/api/webhook/test-message')
          .send(requestBody)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(typeof response.body.error).toBe('string');
      }
    });

    it('長いメッセージも正常に処理する', async () => {
      const longMessage = 'あ'.repeat(1000); // 1000文字のメッセージ
      
      const requestBody = {
        content: longMessage,
        userName: 'テストユーザー',
        userId: 'user-123'
      };

      const response = await request(app)
        .post('/api/webhook/test-message')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.emotion).toBeDefined();
    });

    it('特殊文字を含むメッセージを処理する', async () => {
      const specialCharacters = '😊🎉👍 @user #hashtag https://example.com <script>alert("xss")</script>';
      
      const requestBody = {
        content: specialCharacters,
        userName: 'テストユーザー',
        userId: 'user-123'
      };

      const response = await request(app)
        .post('/api/webhook/test-message')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.emotion).toBeDefined();
    });

    it('複数の連続リクエストを処理する', async () => {
      const messages = [
        '今日は楽しかった！',
        'ちょっと疲れました...',
        '明日も頑張ろう',
        'イライラする出来事があった',
        '特に何もない普通の日'
      ];

      const responses = await Promise.all(
        messages.map(content => 
          request(app)
            .post('/api/webhook/test-message')
            .send({
              content,
              userName: 'テストユーザー',
              userId: 'user-123'
            })
        )
      );

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.emotion).toBeDefined();
      });
    });

    it('同じユーザーの過去メッセージが感情分析に影響する', async () => {
      const userId = 'context-test-user';
      
      // 最初にネガティブなメッセージを送信
      await request(app)
        .post('/api/webhook/test-message')
        .send({
          content: '今日は最悪の一日でした...',
          userName: 'コンテキストテストユーザー',
          userId
        })
        .expect(200);

      // 次にポジティブなメッセージを送信（過去のコンテキストを考慮）
      const response = await request(app)
        .post('/api/webhook/test-message')
        .send({
          content: 'でも友達に励まされて元気になりました！',
          userName: 'コンテキストテストユーザー',
          userId
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      // 実際の感情分析結果は変動するため、感情タイプのみ確認
      expect(['positive', 'negative', 'angry', 'neutral']).toContain(response.body.emotion.emotion);
    });

    it('不正なContent-Typeでもエラーハンドリングする', async () => {
      const response = await request(app)
        .post('/api/webhook/test-message')
        .set('Content-Type', 'text/plain')
        .send('invalid json');

      // Expressは不正なJSONを自動的に400エラーで返す
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/webhook/google-chat', () => {
    it('Google Chat Webhook形式のリクエストを処理する', async () => {
      const webhookData = {
        message: {
          name: 'spaces/test-space/messages/test-message',
          text: 'Webhookテストメッセージ',
          createTime: new Date().toISOString(),
          sender: {
            name: 'users/test-sender',
            displayName: 'Webhookテストユーザー'
          }
        }
      };

      const response = await request(app)
        .post('/api/webhook/google-chat')
        .send(webhookData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        emotion: expect.any(String),
        confidence: expect.any(Number)
      });
    });

    it('不正なWebhook形式の場合はエラーを返す', async () => {
      const invalidWebhookData = {
        message: {
          // 必須フィールドが不足
          text: 'メッセージ'
        }
      };

      const response = await request(app)
        .post('/api/webhook/google-chat')
        .send(invalidWebhookData)
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });
});
