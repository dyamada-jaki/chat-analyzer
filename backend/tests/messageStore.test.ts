import { describe, it, expect, beforeEach } from 'vitest';
import { MessageStore } from '../src/services/messageStore.js';
import { ChatMessage, UserEmotionState } from '../src/types/index.js';

describe('MessageStore', () => {
  let messageStore: MessageStore;

  beforeEach(() => {
    messageStore = new MessageStore();
  });

  describe('addMessage', () => {
    it('メッセージを正常に追加できる', () => {
      const message: ChatMessage = {
        id: 'test-1',
        content: 'テストメッセージ',
        userName: 'テストユーザー',
        userId: 'user-1',
        timestamp: Date.now()
      };

      messageStore.addMessage(message);
      const recentMessages = messageStore.getRecentMessages();
      
      expect(recentMessages).toHaveLength(1);
      expect(recentMessages[0]).toEqual(message);
    });

    it('複数のメッセージを順序通りに保存する', () => {
      const messages: ChatMessage[] = [
        {
          id: 'test-1',
          content: 'メッセージ1',
          userName: 'ユーザー1',
          userId: 'user-1',
          timestamp: Date.now() - 1000
        },
        {
          id: 'test-2', 
          content: 'メッセージ2',
          userName: 'ユーザー2',
          userId: 'user-2',
          timestamp: Date.now()
        }
      ];

      messages.forEach(msg => messageStore.addMessage(msg));
      const recentMessages = messageStore.getRecentMessages();
      
      expect(recentMessages).toHaveLength(2);
      expect(recentMessages[0].id).toBe('test-1');
      expect(recentMessages[1].id).toBe('test-2');
    });
  });

  describe('getUserRecentMessages', () => {
    beforeEach(() => {
      const messages: ChatMessage[] = [
        {
          id: 'test-1',
          content: 'ユーザー1のメッセージ1',
          userName: 'ユーザー1',
          userId: 'user-1',
          timestamp: Date.now() - 2000
        },
        {
          id: 'test-2',
          content: 'ユーザー2のメッセージ',
          userName: 'ユーザー2', 
          userId: 'user-2',
          timestamp: Date.now() - 1000
        },
        {
          id: 'test-3',
          content: 'ユーザー1のメッセージ2',
          userName: 'ユーザー1',
          userId: 'user-1',
          timestamp: Date.now()
        }
      ];
      
      messages.forEach(msg => messageStore.addMessage(msg));
    });

    it('指定ユーザーのメッセージのみを取得する', () => {
      const user1Messages = messageStore.getUserRecentMessages('user-1');
      
      expect(user1Messages).toHaveLength(2);
      expect(user1Messages.every(msg => msg.userId === 'user-1')).toBe(true);
      expect(user1Messages[0].content).toBe('ユーザー1のメッセージ1');
      expect(user1Messages[1].content).toBe('ユーザー1のメッセージ2');
    });

    it('存在しないユーザーIDの場合は空配列を返す', () => {
      const messages = messageStore.getUserRecentMessages('nonexistent-user');
      expect(messages).toHaveLength(0);
    });
  });

  describe('updateUserEmotion', () => {
    it('ユーザー感情状態を正常に更新する', () => {
      const emotionState: UserEmotionState = {
        userId: 'user-1',
        userName: 'テストユーザー',
        currentEmotion: {
          emotion: 'positive',
          confidence: 0.8,
          reasoning: 'テスト理由'
        },
        lastUpdated: Date.now()
      };

      messageStore.updateUserEmotion(emotionState);
      const allEmotions = messageStore.getAllUserEmotions();
      
      expect(allEmotions).toHaveLength(1);
      expect(allEmotions[0]).toEqual(emotionState);
    });

    it('同一ユーザーの感情状態を上書き更新する', () => {
      const initialEmotion: UserEmotionState = {
        userId: 'user-1',
        userName: 'テストユーザー',
        currentEmotion: {
          emotion: 'neutral',
          confidence: 0.5,
          reasoning: '初期状態'
        },
        lastUpdated: Date.now() - 1000
      };

      const updatedEmotion: UserEmotionState = {
        userId: 'user-1',
        userName: 'テストユーザー',
        currentEmotion: {
          emotion: 'positive',
          confidence: 0.9,
          reasoning: '更新状態'
        },
        lastUpdated: Date.now()
      };

      messageStore.updateUserEmotion(initialEmotion);
      messageStore.updateUserEmotion(updatedEmotion);
      
      const allEmotions = messageStore.getAllUserEmotions();
      expect(allEmotions).toHaveLength(1);
      expect(allEmotions[0].currentEmotion.emotion).toBe('positive');
      expect(allEmotions[0].currentEmotion.confidence).toBe(0.9);
    });
  });

  describe('getStats', () => {
    it('統計情報を正常に取得する', () => {
      const message: ChatMessage = {
        id: 'test-1',
        content: 'テストメッセージ',
        userName: 'テストユーザー',
        userId: 'user-1',
        timestamp: Date.now()
      };

      const emotionState: UserEmotionState = {
        userId: 'user-1',
        userName: 'テストユーザー',
        currentEmotion: {
          emotion: 'positive',
          confidence: 0.8,
          reasoning: 'テスト'
        },
        lastUpdated: Date.now()
      };

      messageStore.addMessage(message);
      messageStore.updateUserEmotion(emotionState);

      const stats = messageStore.getStats();
      
      expect(stats.totalMessages).toBe(1);
      expect(stats.recentMessages).toBe(1);
      expect(stats.activeUsers).toBe(1);
      expect(stats.oldestMessageTime).toBe(message.timestamp);
    });

    it('空の状態で統計情報を取得する', () => {
      const stats = messageStore.getStats();
      
      expect(stats.totalMessages).toBe(0);
      expect(stats.recentMessages).toBe(0);
      expect(stats.activeUsers).toBe(0);
      expect(stats.oldestMessageTime).toBeNull();
    });
  });
});
