import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmotionAnalyzer } from '../src/services/emotionAnalyzer.js';
import { ChatMessage } from '../src/types/index.js';

// Gemini APIをモック化
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn()
    })
  }))
}));

describe('EmotionAnalyzer', () => {
  let emotionAnalyzer: EmotionAnalyzer;
  let mockModel: any;

  beforeEach(() => {
    emotionAnalyzer = new EmotionAnalyzer('test-api-key');
    // モックモデルへの参照を取得
    mockModel = (emotionAnalyzer as any).model;
  });

  describe('analyzeEmotion', () => {
    it('正常なGemini API応答で感情分析を実行する', async () => {
      const messages: ChatMessage[] = [
        {
          id: 'test-1',
          content: '今日は素晴らしい一日でした！',
          userName: 'テストユーザー',
          userId: 'user-1',
          timestamp: Date.now()
        }
      ];

      // Gemini APIの応答をモック
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => 'emotion: positive\nconfidence: 0.85'
        }
      });

      const result = await emotionAnalyzer.analyzeEmotion(messages, 'user-1');

      expect(result.emotion).toBe('positive');
      expect(result.confidence).toBe(0.85);
      expect(mockModel.generateContent).toHaveBeenCalledOnce();
    });

    it('複数メッセージから最新メッセージを重視して分析する', async () => {
      const messages: ChatMessage[] = [
        {
          id: 'test-1',
          content: '普通の日でした',
          userName: 'テストユーザー',
          userId: 'user-1',
          timestamp: Date.now() - 2000
        },
        {
          id: 'test-2',
          content: 'とても嬉しいことがありました！',
          userName: 'テストユーザー',
          userId: 'user-1',
          timestamp: Date.now()
        }
      ];

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => 'emotion: positive\nconfidence: 0.9'
        }
      });

      const result = await emotionAnalyzer.analyzeEmotion(messages, 'user-1');

      expect(result.emotion).toBe('positive');
      expect(result.confidence).toBe(0.9);
      
      // プロンプトに最新メッセージが含まれていることを確認
      const callArgs = mockModel.generateContent.mock.calls[0][0];
      expect(callArgs).toContain('とても嬉しいことがありました！');
    });

    it('対象ユーザーのメッセージが存在しない場合はneutralを返す', async () => {
      const messages: ChatMessage[] = [
        {
          id: 'test-1',
          content: 'メッセージ',
          userName: '他のユーザー',
          userId: 'other-user',
          timestamp: Date.now()
        }
      ];

      const result = await emotionAnalyzer.analyzeEmotion(messages, 'user-1');

      expect(result.emotion).toBe('neutral');
      expect(result.confidence).toBe(0.6);
      expect(result.timestamp).toBeDefined();
    });

    it('Gemini APIエラー時にneutralを返す', async () => {
      const messages: ChatMessage[] = [
        {
          id: 'test-1',
          content: 'テストメッセージ',
          userName: 'テストユーザー',
          userId: 'user-1',
          timestamp: Date.now()
        }
      ];

      // API エラーをモック
      mockModel.generateContent.mockRejectedValue(new Error('API Error'));

      const result = await emotionAnalyzer.analyzeEmotion(messages, 'user-1');

      expect(result.emotion).toBe('neutral');
      expect(result.confidence).toBe(0.6);
      expect(result.timestamp).toBeDefined();
    });

    it('異常なAPI応答でもneutralを返す', async () => {
      const messages: ChatMessage[] = [
        {
          id: 'test-1',
          content: 'テストメッセージ',
          userName: 'テストユーザー',
          userId: 'user-1',
          timestamp: Date.now()
        }
      ];

      // 異常な応答をモック
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => 'invalid response format'
        }
      });

      const result = await emotionAnalyzer.analyzeEmotion(messages, 'user-1');

      expect(result.emotion).toBe('neutral');
      expect(result.confidence).toBe(0.7); // parseAnalysisResultのデフォルト値
      expect(result.timestamp).toBeDefined();
    });

    it('各感情タイプを正しく解析する', async () => {
      const testCases = [
        { response: 'emotion: positive\nconfidence: 0.8', expected: 'positive' },
        { response: 'emotion: negative\nconfidence: 0.7', expected: 'negative' },
        { response: 'emotion: angry\nconfidence: 0.9', expected: 'angry' },
        { response: 'emotion: neutral\nconfidence: 0.6', expected: 'neutral' }
      ];

      const messages: ChatMessage[] = [
        {
          id: 'test-1',
          content: 'テストメッセージ',
          userName: 'テストユーザー',
          userId: 'user-1',
          timestamp: Date.now()
        }
      ];

      for (const testCase of testCases) {
        mockModel.generateContent.mockResolvedValue({
          response: {
            text: () => testCase.response
          }
        });

        const result = await emotionAnalyzer.analyzeEmotion(messages, 'user-1');
        expect(result.emotion).toBe(testCase.expected);
      }
    });
  });
});
