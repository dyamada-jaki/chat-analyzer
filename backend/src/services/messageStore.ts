import { ChatMessage, UserEmotionState } from '../types/index.js';

/**
 * メッセージとユーザー感情状態をメモリ内で管理するクラス
 * 過去10分間のデータのみ保持
 */
export class MessageStore {
  private messages: ChatMessage[] = [];
  private userEmotions: Map<string, UserEmotionState> = new Map();
  private readonly RETENTION_TIME = 10 * 60 * 1000; // 10分間（ミリ秒）

  /**
   * 新しいメッセージを追加
   */
  addMessage(message: ChatMessage): void {
    this.messages.push(message);
    this.cleanOldData();
  }

  /**
   * 過去10分間のメッセージを取得
   */
  getRecentMessages(): ChatMessage[] {
    const cutoffTime = Date.now() - this.RETENTION_TIME;
    return this.messages.filter(msg => msg.timestamp > cutoffTime);
  }

  /**
   * 特定ユーザーの過去10分間のメッセージを取得
   */
  getUserRecentMessages(userId: string): ChatMessage[] {
    return this.getRecentMessages().filter(msg => msg.userId === userId);
  }

  /**
   * ユーザーの感情状態を更新
   */
  updateUserEmotion(emotionState: UserEmotionState): void {
    this.userEmotions.set(emotionState.userId, emotionState);
    this.cleanOldEmotions();
  }

  /**
   * 全ユーザーの現在の感情状態を取得
   */
  getAllUserEmotions(): UserEmotionState[] {
    this.cleanOldEmotions();
    return Array.from(this.userEmotions.values());
  }

  /**
   * 特定ユーザーの感情状態を取得
   */
  getUserEmotion(userId: string): UserEmotionState | undefined {
    const emotion = this.userEmotions.get(userId);
    if (emotion && this.isEmotionValid(emotion)) {
      return emotion;
    }
    return undefined;
  }

  /**
   * 古いデータをクリーンアップ（10分以上前のデータを削除）
   */
  private cleanOldData(): void {
    const cutoffTime = Date.now() - this.RETENTION_TIME;
    this.messages = this.messages.filter(msg => msg.timestamp > cutoffTime);
  }

  /**
   * 古い感情データをクリーンアップ
   */
  private cleanOldEmotions(): void {
    const cutoffTime = Date.now() - this.RETENTION_TIME;
    for (const [userId, emotion] of this.userEmotions.entries()) {
      if (emotion.lastUpdated < cutoffTime) {
        this.userEmotions.delete(userId);
      }
    }
  }

  /**
   * 感情データが有効期限内かチェック
   */
  private isEmotionValid(emotion: UserEmotionState): boolean {
    const cutoffTime = Date.now() - this.RETENTION_TIME;
    return emotion.lastUpdated > cutoffTime;
  }

  /**
   * 統計情報を取得
   */
  getStats() {
    return {
      totalMessages: this.messages.length,
      recentMessages: this.getRecentMessages().length,
      activeUsers: this.userEmotions.size,
      oldestMessageTime: this.messages.length > 0 ? 
        Math.min(...this.messages.map(m => m.timestamp)) : null
    };
  }
}

// シングルトンインスタンス
export const messageStore = new MessageStore();
