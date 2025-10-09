import { EmotionAnalysis, EmotionType } from '../types/index.js';

/**
 * HuggingFace Inference APIを使用した感情分析サービス
 * 月間30,000リクエストまで無料
 */
export class HuggingFaceEmotionAnalyzer {
  private apiKey: string;
  private baseUrl = 'https://api-inference.huggingface.co/models';
  
  // 日本語対応感情分析モデル
  private models = {
    japanese: 'cl-tohoku/bert-base-japanese-sentiment',
    multilingual: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
    fallback: 'nlptown/bert-base-multilingual-uncased-sentiment'
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * HuggingFace APIで感情分析
   */
  async analyzeEmotion(text: string): Promise<EmotionAnalysis> {
    try {
      const response = await this.queryModel(this.models.japanese, text);
      return this.parseHuggingFaceResult(response);
    } catch (error) {
      console.error('HuggingFace API エラー:', error);
      // フォールバックモデルを試行
      try {
        const response = await this.queryModel(this.models.multilingual, text);
        return this.parseHuggingFaceResult(response);
      } catch (fallbackError) {
        return this.createNeutralEmotion();
      }
    }
  }

  /**
   * HuggingFace Inference API呼び出し
   */
  private async queryModel(modelName: string, text: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${modelName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * HuggingFaceの結果をChat Analyzer形式に変換
   */
  private parseHuggingFaceResult(result: any[]): EmotionAnalysis {
    if (!result || result.length === 0) {
      return this.createNeutralEmotion();
    }

    // HuggingFaceは信頼度順でソートされた結果を返す
    const topResult = result[0];
    const emotion = this.mapHuggingFaceEmotion(topResult.label);
    const confidence = topResult.score;

    return {
      emotion,
      confidence: Math.round(confidence * 100) / 100,
      timestamp: Date.now()
    };
  }

  /**
   * HuggingFaceのラベルをChat Analyzer形式にマッピング
   */
  private mapHuggingFaceEmotion(label: string): EmotionType {
    const normalizedLabel = label.toLowerCase();
    
    // 日本語モデルのラベル
    if (normalizedLabel.includes('positive') || normalizedLabel.includes('ポジティブ')) {
      return 'positive';
    }
    if (normalizedLabel.includes('negative') || normalizedLabel.includes('ネガティブ')) {
      return 'negative';
    }
    
    // 英語モデルのラベル
    if (normalizedLabel.includes('joy') || normalizedLabel.includes('happiness')) {
      return 'positive';
    }
    if (normalizedLabel.includes('anger') || normalizedLabel.includes('angry')) {
      return 'angry';
    }
    if (normalizedLabel.includes('sadness') || normalizedLabel.includes('fear')) {
      return 'negative';
    }
    
    return 'neutral';
  }

  /**
   * ニュートラル感情を作成
   */
  private createNeutralEmotion(): EmotionAnalysis {
    return {
      emotion: 'neutral',
      confidence: 0.6,
      timestamp: Date.now()
    };
  }

  /**
   * API使用量チェック（月間30,000リクエスト制限）
   */
  async checkQuota(): Promise<boolean> {
    // 実装: ローカルストレージまたはDBで使用量追跡
    // 月間30,000リクエスト以内かチェック
    return true; // 簡易実装
  }
}
