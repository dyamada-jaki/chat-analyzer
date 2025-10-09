import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatMessage, EmotionAnalysis, EmotionType } from '../types/index.js';

/**
 * Google Gemini APIを使用した感情分析サービス
 */
export class EmotionAnalyzer {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private quotaTracker: {
    dailyCount: number;
    monthlyCount: number;
    lastReset: string;
    maxDaily: number;
    maxMonthly: number;
  };

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // クォータ追跡の初期化
    this.quotaTracker = {
      dailyCount: 0,
      monthlyCount: 0,
      lastReset: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      maxDaily: 50,  // 1日50リクエストまで（安全マージン）
      maxMonthly: 1400  // 月間1400リクエストまで（安全マージン）
    };
    
    this.loadQuotaFromStorage();
  }

  /**
   * メッセージの感情を分析
   * @param messages 分析対象のメッセージ配列（最新のメッセージ + 過去10分の履歴）
   * @param targetUserId 分析対象のユーザーID
   * @returns 感情分析結果
   */
  async analyzeEmotion(messages: ChatMessage[], targetUserId: string): Promise<EmotionAnalysis> {
    // クォータチェック
    if (!this.canMakeRequest()) {
      console.warn('Gemini APIクォータ制限に達しました。フォールバック分析を使用します。');
      const latestMessage = messages.filter(msg => msg.userId === targetUserId).pop();
      if (latestMessage) {
        return this.analyzeEmotionSimple(latestMessage.content);
      }
      return this.createNeutralEmotion();
    }

    try {
      // 対象ユーザーのメッセージのみを抽出
      const userMessages = messages.filter(msg => msg.userId === targetUserId);
      
      if (userMessages.length === 0) {
        return this.createNeutralEmotion();
      }

      // 最新のメッセージを重視しながらコンテキストを構築
      const latestMessage = userMessages[userMessages.length - 1];
      const context = this.buildContext(userMessages);

      const prompt = `
以下のチャットメッセージから、ユーザーの現在の感情状態を分析してください。

【分析対象メッセージ】
${context}

【最新メッセージ（重視）】
"${latestMessage.content}"

【感情カテゴリ】
- positive: 嬉しい、満足、期待、楽観的
- negative: 悲しい、落胆、不安、心配  
- angry: 不満、イライラ、批判的、不快
- neutral: 普通、事実的、冷静、客観的

【出力形式】
emotion: [positive/negative/angry/neutral]
confidence: [0.0-1.0の数値]

最新のメッセージを最も重視し、過去のメッセージは文脈として参考にしてください。
簡潔に分析結果のみを出力してください。
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // 成功時のクォータ更新
      this.updateQuotaCount();

      return this.parseAnalysisResult(text);

    } catch (error) {
      console.error('感情分析エラー:', error);
      
      // エラー時はフォールバック分析を使用
      const latestMessage = messages.filter(msg => msg.userId === targetUserId).pop();
      if (latestMessage) {
        return this.analyzeEmotionSimple(latestMessage.content);
      }
      return this.createNeutralEmotion();
    }
  }

  /**
   * クォータ情報をストレージから読み込み
   */
  private loadQuotaFromStorage(): void {
    // 簡易実装: メモリベース（実際の運用では永続化が必要）
    const today = new Date().toISOString().split('T')[0];
    
    if (this.quotaTracker.lastReset !== today) {
      // 日が変わった場合はリセット
      this.quotaTracker.dailyCount = 0;
      this.quotaTracker.lastReset = today;
    }
  }

  /**
   * APIリクエストが可能かチェック
   */
  private canMakeRequest(): boolean {
    this.loadQuotaFromStorage();
    
    return this.quotaTracker.dailyCount < this.quotaTracker.maxDaily &&
           this.quotaTracker.monthlyCount < this.quotaTracker.maxMonthly;
  }

  /**
   * クォータカウントを更新
   */
  private updateQuotaCount(): void {
    this.quotaTracker.dailyCount++;
    this.quotaTracker.monthlyCount++;
    
    console.log(`Gemini API使用量: 日間 ${this.quotaTracker.dailyCount}/${this.quotaTracker.maxDaily}, 月間 ${this.quotaTracker.monthlyCount}/${this.quotaTracker.maxMonthly}`);
  }

  /**
   * クォータ情報を取得
   */
  getQuotaInfo(): any {
    return {
      daily: {
        used: this.quotaTracker.dailyCount,
        limit: this.quotaTracker.maxDaily,
        remaining: this.quotaTracker.maxDaily - this.quotaTracker.dailyCount
      },
      monthly: {
        used: this.quotaTracker.monthlyCount,
        limit: this.quotaTracker.maxMonthly,
        remaining: this.quotaTracker.maxMonthly - this.quotaTracker.monthlyCount
      }
    };
  }

  /**
   * メッセージからコンテキストを構築
   */
  private buildContext(messages: ChatMessage[]): string {
    return messages
      .map(msg => `"${msg.content}"`)
      .join('\n');
  }

  /**
   * Gemini APIの応答をパース
   */
  private parseAnalysisResult(text: string): EmotionAnalysis {
    try {
      const lines = text.toLowerCase().split('\n');
      let emotion: EmotionType = 'neutral';
      let confidence = 0.7;

      for (const line of lines) {
        if (line.includes('emotion:')) {
          const emotionMatch = line.match(/emotion:\s*(positive|negative|angry|neutral)/);
          if (emotionMatch) {
            emotion = emotionMatch[1] as EmotionType;
          }
        }
        if (line.includes('confidence:')) {
          const confidenceMatch = line.match(/confidence:\s*([\d.]+)/);
          if (confidenceMatch) {
            confidence = Math.min(1.0, Math.max(0.0, parseFloat(confidenceMatch[1])));
          }
        }
      }

      return {
        emotion,
        confidence,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('分析結果パースエラー:', error);
      return this.createNeutralEmotion();
    }
  }

  /**
   * デフォルトの中立感情を作成
   */
  private createNeutralEmotion(): EmotionAnalysis {
    return {
      emotion: 'neutral',
      confidence: 0.6,
      timestamp: Date.now()
    };
  }

  /**
   * シンプルな感情分析（フォールバック用）
   */
  analyzeEmotionSimple(message: string): EmotionAnalysis {
    const text = message.toLowerCase();
    
    // ポジティブキーワード
    const positiveWords = ['嬉しい', '楽しい', '最高', 'ありがとう', '良い', 'いいね', '成功', '素晴らしい', '頑張', '😊', '😄', '🎉'];
    
    // ネガティブキーワード
    const negativeWords = ['悲しい', '辛い', '大変', '心配', '不安', '困る', '間に合う', '😢', '😞', '😰'];
    
    // 怒りキーワード（大幅に拡張）
    const angryWords = [
      'むかつく', '腹立つ', 'イライラ', '最悪', '😠', '💢', '怒',
      'いい加減', 'もう', 'うんざり', 'やめて', 'ふざけるな', 'バカ',
      'また', 'いつも', 'しつこい', 'ちゃんと', '勘弁', 'はぁ',
      '変更', '遅れ', 'キャンセル', '困る', '迷惑'
    ];

    // 感情パターンの検出（より高度な分析）
    let emotion: EmotionType = 'neutral';
    let confidence = 0.6;

    // 不満や怒りのパターンをチェック
    const frustratedPatterns = [
      /もう.*いい加減/,
      /また.*変更/,
      /いつも.*変わる/,
      /何度も/,
      /.*ください$/,  // 「してください」は怒りの文脈では不満の表現
      /勘弁.*して/
    ];

    // 怒りの強いパターンをチェック
    if (frustratedPatterns.some(pattern => pattern.test(text))) {
      emotion = 'angry';
      confidence = 0.9;
    } else if (angryWords.some(word => text.includes(word))) {
      emotion = 'angry';
      confidence = 0.8;
    } else if (positiveWords.some(word => text.includes(word))) {
      emotion = 'positive';
      confidence = 0.8;
    } else if (negativeWords.some(word => text.includes(word))) {
      emotion = 'negative';
      confidence = 0.8;
    }

    return {
      emotion,
      confidence,
      timestamp: Date.now()
    };
  }
}
