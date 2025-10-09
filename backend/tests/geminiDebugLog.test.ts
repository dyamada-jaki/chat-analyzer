import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmotionAnalyzer } from '../src/services/emotionAnalyzer';
import { ChatMessage } from '../src/types';

describe('Gemini APIデバッグログ機能', () => {
  let emotionAnalyzer: EmotionAnalyzer;
  let consoleSpy: vi.SpyInstance;

  beforeEach(() => {
    emotionAnalyzer = new EmotionAnalyzer('test-api-key');
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('プロンプトログ出力', () => {
    it('感情分析時にプロンプトがログ出力される', async () => {
      const messages: ChatMessage[] = [{
        id: 'test-1',
        content: 'テストメッセージです',
        userName: 'テストユーザー',
        userId: 'test-user-1',
        timestamp: Date.now()
      }];

      // Gemini APIモック（エラーを発生させてフォールバックを実行）
      const mockGenerateContent = vi.fn().mockRejectedValue(new Error('API Error'));
      emotionAnalyzer['model'] = { generateContent: mockGenerateContent };

      await emotionAnalyzer.analyzeEmotion(messages, 'test-user-1');

      // プロンプトログ出力の確認
      expect(consoleSpy).toHaveBeenCalledWith(
        '📝 Gemini APIプロンプト:',
        expect.stringContaining('以下のチャットメッセージから、ユーザーの現在の感情状態を分析してください')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '📝 Gemini APIプロンプト:',
        expect.stringContaining('テストメッセージです')
      );
    });

    it('プロンプトに感情カテゴリーが含まれる', async () => {
      const messages: ChatMessage[] = [{
        id: 'test-2',
        content: '今日は素晴らしい日です',
        userName: 'ユーザー2',
        userId: 'test-user-2',
        timestamp: Date.now()
      }];

      const mockGenerateContent = vi.fn().mockRejectedValue(new Error('API Error'));
      emotionAnalyzer['model'] = { generateContent: mockGenerateContent };

      await emotionAnalyzer.analyzeEmotion(messages, 'test-user-2');

      expect(consoleSpy).toHaveBeenCalledWith(
        '📝 Gemini APIプロンプト:',
        expect.stringContaining('positive: 嬉しい、満足、期待、楽観的')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '📝 Gemini APIプロンプト:',
        expect.stringContaining('negative: 悲しい、落胆、不安、心配')
      );
    });
  });

  describe('レスポンスログ出力', () => {
    it('Gemini APIレスポンスがログ出力される', async () => {
      const messages: ChatMessage[] = [{
        id: 'test-3',
        content: '最高の一日でした！',
        userName: 'ユーザー3',
        userId: 'test-user-3',
        timestamp: Date.now()
      }];

      // Gemini API成功レスポンスのモック
      const mockResponse = {
        response: {
          text: () => 'emotion: positive\nconfidence: 0.95'
        }
      };
      const mockGenerateContent = vi.fn().mockResolvedValue(mockResponse);
      emotionAnalyzer['model'] = { generateContent: mockGenerateContent };

      await emotionAnalyzer.analyzeEmotion(messages, 'test-user-3');

      // レスポンスログ出力の確認
      expect(consoleSpy).toHaveBeenCalledWith(
        '🤖 Gemini API生レスポンス:',
        'emotion: positive\nconfidence: 0.95'
      );
    });

    it('複数行レスポンスも正しくログ出力される', async () => {
      const messages: ChatMessage[] = [{
        id: 'test-4',
        content: '今日は最悪でした...',
        userName: 'ユーザー4',
        userId: 'test-user-4',
        timestamp: Date.now()
      }];

      const mockResponse = {
        response: {
          text: () => 'emotion: negative\nconfidence: 0.88\n\n追加情報: 悲しい感情が検出されました'
        }
      };
      const mockGenerateContent = vi.fn().mockResolvedValue(mockResponse);
      emotionAnalyzer['model'] = { generateContent: mockGenerateContent };

      await emotionAnalyzer.analyzeEmotion(messages, 'test-user-4');

      expect(consoleSpy).toHaveBeenCalledWith(
        '🤖 Gemini API生レスポンス:',
        'emotion: negative\nconfidence: 0.88\n\n追加情報: 悲しい感情が検出されました'
      );
    });
  });

  describe('デバッグログの統合テスト', () => {
    it('プロンプト→API呼び出し→レスポンスの完全なログフローが動作する', async () => {
      const messages: ChatMessage[] = [{
        id: 'test-5',
        content: 'とても怒っています！',
        userName: 'ユーザー5',
        userId: 'test-user-5',
        timestamp: Date.now()
      }];

      const mockResponse = {
        response: {
          text: () => 'emotion: angry\nconfidence: 0.92'
        }
      };
      const mockGenerateContent = vi.fn().mockResolvedValue(mockResponse);
      emotionAnalyzer['model'] = { generateContent: mockGenerateContent };

      const result = await emotionAnalyzer.analyzeEmotion(messages, 'test-user-5');

      // プロンプトログの確認
      expect(consoleSpy).toHaveBeenCalledWith(
        '📝 Gemini APIプロンプト:',
        expect.stringContaining('とても怒っています！')
      );

      // レスポンスログの確認
      expect(consoleSpy).toHaveBeenCalledWith(
        '🤖 Gemini API生レスポンス:',
        'emotion: angry\nconfidence: 0.92'
      );

      // 正しい分析結果の確認
      expect(result.emotion).toBe('angry');
      expect(result.confidence).toBe(0.92);
    });

    it('APIエラー時はレスポンスログが出力されない', async () => {
      const messages: ChatMessage[] = [{
        id: 'test-6',
        content: 'エラーテスト',
        userName: 'ユーザー6',
        userId: 'test-user-6',
        timestamp: Date.now()
      }];

      const mockGenerateContent = vi.fn().mockRejectedValue(new Error('API Key Invalid'));
      emotionAnalyzer['model'] = { generateContent: mockGenerateContent };

      await emotionAnalyzer.analyzeEmotion(messages, 'test-user-6');

      // プロンプトログは出力される
      expect(consoleSpy).toHaveBeenCalledWith(
        '📝 Gemini APIプロンプト:',
        expect.stringContaining('エラーテスト')
      );

      // レスポンスログは出力されない（エラーのため）
      expect(consoleSpy).not.toHaveBeenCalledWith(
        '🤖 Gemini API生レスポンス:',
        expect.any(String)
      );
    });
  });
});
