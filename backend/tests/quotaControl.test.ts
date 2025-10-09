import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmotionAnalyzer } from '../src/services/emotionAnalyzer.js';
import { ChatMessage } from '../src/types/index.js';

describe('EmotionAnalyzer - Quota Control', () => {
  let emotionAnalyzer: EmotionAnalyzer;
  const mockApiKey = 'test_api_key';

  beforeEach(() => {
    // モックAPIキーでインスタンス作成
    emotionAnalyzer = new EmotionAnalyzer(mockApiKey);
    
    // コンソールログをモック
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('クォータ管理機能', () => {
    it('初期状態では日間・月間カウントが0である', () => {
      const quotaInfo = emotionAnalyzer.getQuotaInfo();
      
      expect(quotaInfo.daily.used).toBe(0);
      expect(quotaInfo.monthly.used).toBe(0);
      expect(quotaInfo.daily.limit).toBe(50);
      expect(quotaInfo.monthly.limit).toBe(1400);
    });

    it('日間制限に達した場合、フォールバック分析を使用する', async () => {
      // 日間制限を超えるようにカウントを設定
      for (let i = 0; i < 50; i++) {
        (emotionAnalyzer as any).updateQuotaCount();
      }

      const messages: ChatMessage[] = [{
        id: 'test_1',
        content: '今日はとても嬉しいです',
        userName: 'テストユーザー',
        userId: 'test-user-001',
        timestamp: Date.now(),
        emotion: undefined
      }];

      const result = await emotionAnalyzer.analyzeEmotion(messages, 'test-user-001');
      
      // フォールバック分析の結果が返されることを確認
      expect(result).toBeDefined();
      expect(result.emotion).toMatch(/positive|negative|angry|neutral/);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      
      // 警告ログが出力されることを確認
      expect(console.warn).toHaveBeenCalledWith(
        'Gemini APIクォータ制限に達しました。フォールバック分析を使用します。'
      );
    });

    it('月間制限に達した場合、フォールバック分析を使用する', async () => {
      // 月間制限を超えるようにカウントを設定
      for (let i = 0; i < 1400; i++) {
        (emotionAnalyzer as any).updateQuotaCount();
      }

      const messages: ChatMessage[] = [{
        id: 'test_2',
        content: 'このプロジェクトは最悪だ',
        userName: 'テストユーザー',
        userId: 'test-user-002',
        timestamp: Date.now(),
        emotion: undefined
      }];

      const result = await emotionAnalyzer.analyzeEmotion(messages, 'test-user-002');
      
      // フォールバック分析の結果が返されることを確認
      expect(result).toBeDefined();
      expect(result.emotion).toMatch(/positive|negative|angry|neutral/);
      
      // 警告ログが出力されることを確認
      expect(console.warn).toHaveBeenCalledWith(
        'Gemini APIクォータ制限に達しました。フォールバック分析を使用します。'
      );
    });

    it('制限内の場合、Gemini APIを呼び出そうとする（モック環境では失敗）', async () => {
      const messages: ChatMessage[] = [{
        id: 'test_3',
        content: 'テストメッセージです',
        userName: 'テストユーザー',
        userId: 'test-user-003',
        timestamp: Date.now(),
        emotion: undefined
      }];

      // モック環境ではGemini APIが失敗するため、フォールバック分析が使用される
      const result = await emotionAnalyzer.analyzeEmotion(messages, 'test-user-003');
      
      expect(result).toBeDefined();
      expect(result.emotion).toMatch(/positive|negative|angry|neutral/);
      
      // エラーログが出力されることを確認（API呼び出しが失敗するため）
      expect(console.error).toHaveBeenCalled();
    });

    it('クォータ情報を正しく取得できる', () => {
      // 使用量を増やす
      (emotionAnalyzer as any).updateQuotaCount();
      (emotionAnalyzer as any).updateQuotaCount();
      (emotionAnalyzer as any).updateQuotaCount();

      const quotaInfo = emotionAnalyzer.getQuotaInfo();
      
      expect(quotaInfo.daily.used).toBe(3);
      expect(quotaInfo.daily.remaining).toBe(47);
      expect(quotaInfo.monthly.used).toBe(3);
      expect(quotaInfo.monthly.remaining).toBe(1397);
    });

    it('使用量更新時にログが出力される', () => {
      (emotionAnalyzer as any).updateQuotaCount();
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Gemini API使用量: 日間 1/50, 月間 1/1400')
      );
    });
  });

  describe('フォールバック分析機能', () => {
    it('ポジティブなメッセージを正しく分析する', () => {
      const result = emotionAnalyzer.analyzeEmotionSimple('今日はとても嬉しいです！ありがとう！');
      
      expect(result.emotion).toBe('positive');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.timestamp).toBeDefined();
    });

    it('ネガティブなメッセージを正しく分析する', () => {
      const result = emotionAnalyzer.analyzeEmotionSimple('悲しいです。心配で不安になります。');
      
      expect(result.emotion).toBe('negative');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('怒りのメッセージを正しく分析する', () => {
      const result = emotionAnalyzer.analyzeEmotionSimple('むかつく！いい加減にしろ！最悪だ！');
      
      expect(result.emotion).toBe('angry');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('ニュートラルなメッセージを正しく分析する', () => {
      const result = emotionAnalyzer.analyzeEmotionSimple('会議は明日の10時からです。');
      
      expect(result.emotion).toBe('neutral');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });
});
