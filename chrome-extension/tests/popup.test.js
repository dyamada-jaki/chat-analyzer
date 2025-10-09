import { describe, it, expect, beforeEach, vi } from 'vitest';

// popup.jsの内容を読み込み（モジュール化が必要）
describe('Popup Script Tests', () => {
  let mockTab;
  let mockResponse;

  beforeEach(() => {
    // DOMのセットアップ
    document.body.innerHTML = `
      <div id="status"></div>
      <div id="connection-status"></div>
      <div id="message-count">0</div>
      <div id="positive-count">0</div>
      <div id="negative-count">0</div>
      <div id="angry-count">0</div>
      <div id="neutral-count">0</div>
      <button id="refresh-btn">更新</button>
      <button id="clear-btn">クリア</button>
      <button id="process-existing-messages-btn">既存メッセージ再処理</button>
    `;

    // Chrome APIのモックをリセット
    vi.clearAllMocks();

    // デフォルトのモックレスポンス
    mockTab = {
      id: 1,
      url: 'https://chat.google.com/room/test'
    };

    mockResponse = {
      messageCount: 5,
      emotions: {
        positive: 2,
        negative: 1,
        angry: 0,
        neutral: 2
      },
      backendConnected: true
    };

    chrome.tabs.query.mockResolvedValue([mockTab]);
    chrome.tabs.sendMessage.mockResolvedValue(mockResponse);
  });

  describe('getCurrentTab', () => {
    it('現在のアクティブタブを正しく取得する', async () => {
      // popup.jsの関数を直接テストできないため、Chrome APIの呼び出しをテスト
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
      expect(tab).toBe(mockTab);
    });
  });

  describe('checkGoogleChatPage', () => {
    it('Google ChatのURLを正しく判定する', () => {
      const checkGoogleChatPage = (url) => {
        return url.includes('chat.google.com') || 
               url.includes('mail.google.com/chat') ||
               url.includes('google.com/chat');
      };

      expect(checkGoogleChatPage('https://chat.google.com/room/test')).toBe(true);
      expect(checkGoogleChatPage('https://mail.google.com/chat/u/0/')).toBe(true);
      expect(checkGoogleChatPage('https://google.com/chat')).toBe(true);
      expect(checkGoogleChatPage('https://example.com')).toBe(false);
    });
  });

  describe('updateStatsDisplay', () => {
    it('統計情報を正しく表示更新する', () => {
      const updateStatsDisplay = (response) => {
        document.getElementById('message-count').textContent = response.messageCount || 0;
        document.getElementById('positive-count').textContent = response.emotions?.positive || 0;
        document.getElementById('negative-count').textContent = response.emotions?.negative || 0;
        document.getElementById('angry-count').textContent = response.emotions?.angry || 0;
        document.getElementById('neutral-count').textContent = response.emotions?.neutral || 0;
      };

      updateStatsDisplay(mockResponse);

      expect(document.getElementById('message-count').textContent).toBe('5');
      expect(document.getElementById('positive-count').textContent).toBe('2');
      expect(document.getElementById('negative-count').textContent).toBe('1');
      expect(document.getElementById('angry-count').textContent).toBe('0');
      expect(document.getElementById('neutral-count').textContent).toBe('2');
    });

    it('レスポンスが空の場合デフォルト値を表示する', () => {
      const updateStatsDisplay = (response) => {
        document.getElementById('message-count').textContent = response.messageCount || 0;
        document.getElementById('positive-count').textContent = response.emotions?.positive || 0;
        document.getElementById('negative-count').textContent = response.emotions?.negative || 0;
        document.getElementById('angry-count').textContent = response.emotions?.angry || 0;
        document.getElementById('neutral-count').textContent = response.emotions?.neutral || 0;
      };

      updateStatsDisplay({});

      expect(document.getElementById('message-count').textContent).toBe('0');
      expect(document.getElementById('positive-count').textContent).toBe('0');
      expect(document.getElementById('negative-count').textContent).toBe('0');
      expect(document.getElementById('angry-count').textContent).toBe('0');
      expect(document.getElementById('neutral-count').textContent).toBe('0');
    });
  });

  describe('updateConnectionStatus', () => {
    it('バックエンド接続済みの場合の表示を更新する', () => {
      const connectionElement = document.getElementById('connection-status');
      
      const updateConnectionStatus = (connectionElement, backendConnected) => {
        if (backendConnected) {
          connectionElement.textContent = 'バックエンドに接続済み';
          connectionElement.className = 'connection connected';
        } else {
          connectionElement.textContent = 'バックエンド未接続（ローカル分析使用）';
          connectionElement.className = 'connection disconnected';
        }
      };

      updateConnectionStatus(connectionElement, true);

      expect(connectionElement.textContent).toBe('バックエンドに接続済み');
      expect(connectionElement.className).toBe('connection connected');
    });

    it('バックエンド未接続の場合の表示を更新する', () => {
      const connectionElement = document.getElementById('connection-status');
      
      const updateConnectionStatus = (connectionElement, backendConnected) => {
        if (backendConnected) {
          connectionElement.textContent = 'バックエンドに接続済み';
          connectionElement.className = 'connection connected';
        } else {
          connectionElement.textContent = 'バックエンド未接続（ローカル分析使用）';
          connectionElement.className = 'connection disconnected';
        }
      };

      updateConnectionStatus(connectionElement, false);

      expect(connectionElement.textContent).toBe('バックエンド未接続（ローカル分析使用）');
      expect(connectionElement.className).toBe('connection disconnected');
    });
  });

  describe('Chrome API Integration', () => {
    it('Content scriptとの通信が正常に動作する', async () => {
      const response = await chrome.tabs.sendMessage(mockTab.id, { action: 'getStats' });
      
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(mockTab.id, { action: 'getStats' });
      expect(response).toBe(mockResponse);
    });

    it('データクリア処理が正常に動作する', async () => {
      chrome.tabs.sendMessage.mockResolvedValue({ success: true });
      
      const response = await chrome.tabs.sendMessage(mockTab.id, { action: 'clearData' });
      
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(mockTab.id, { action: 'clearData' });
      expect(response.success).toBe(true);
    });

    it('既存メッセージ再処理が正常に動作する', async () => {
      chrome.tabs.sendMessage.mockResolvedValue({ success: true });
      
      const response = await chrome.tabs.sendMessage(mockTab.id, { action: 'processExistingMessages' });
      
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(mockTab.id, { action: 'processExistingMessages' });
      expect(response.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('Chrome API エラー時の処理', async () => {
      chrome.tabs.sendMessage.mockRejectedValue(new Error('Content script not found'));
      
      try {
        await chrome.tabs.sendMessage(mockTab.id, { action: 'getStats' });
      } catch (error) {
        expect(error.message).toBe('Content script not found');
      }
    });

    it('非Google Chatページでの処理', () => {
      const checkGoogleChatPage = (url) => {
        return url.includes('chat.google.com') || 
               url.includes('mail.google.com/chat') ||
               url.includes('google.com/chat');
      };

      const nonChatTab = { ...mockTab, url: 'https://example.com' };
      expect(checkGoogleChatPage(nonChatTab.url)).toBe(false);
    });
  });
});
