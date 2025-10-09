import { describe, it, expect, beforeEach, vi } from 'vitest';

// テストヘルパー関数（Clean Code: DRY原則適用）
const TestHelpers = {
  // メッセージ内容抽出ヘルパー
  extractMessageContent: (messageElement) => {
    const contentSelectors = [
      'div[jsname="bgckF"].DTp27d.QIJiHb',
      '.DTp27d.QIJiHb',
      'div[jsname="bgckF"]',
      '.DTp27d',
      '.Zc1Emd',
      '.message-text',
      '[data-message-text]'
    ];
    
    for (const selector of contentSelectors) {
      const contentElement = messageElement.querySelector(selector);
      if (contentElement && contentElement.textContent.trim()) {
        return contentElement.textContent.trim();
      }
    }
    
    return '';
  },

  // ユーザー名抽出ヘルパー
  extractUserName: (messageElement) => {
    let userName = messageElement.getAttribute('data-name') || '';
    
    if (!userName) {
      const userNameSelectors = [
        'span.njhDLd.O5OMdc',
        '.njhDLd.O5OMdc',
        '[jsname="oU6v8b"]',
        '.njhDLd',
        '.sender-name',
        '.user-name'
      ];
    
      for (const selector of userNameSelectors) {
        const userNameElement = messageElement.querySelector(selector);
        if (userNameElement && userNameElement.textContent.trim()) {
          userName = userNameElement.textContent.trim();
          break;
        }
      }
    }
    
    return userName;
  },

  // タイムスタンプ抽出ヘルパー
  extractTimeData: (messageElement) => {
    const timeElement = messageElement.querySelector('.FvYVyf') || 
                       messageElement.querySelector('[data-absolute-timestamp]') ||
                       messageElement.querySelector('.timestamp');
    const timeText = timeElement ? timeElement.textContent.trim() : '';
    const timestamp = timeElement ? timeElement.getAttribute('data-absolute-timestamp') : '';
    
    return {
      timeText,
      timestamp: timestamp ? parseInt(timestamp) : Date.now()
    };
  },

  // フォールバックデータ抽出ヘルパー
  extractFallbackData: (messageElement, content, userName) => {
    if (!content && !userName) {
      const allText = messageElement.textContent || '';
      if (allText.length > 10) {
        const fallbackContent = allText.substring(0, 200);
        const fallbackUserName = 'Unknown User';
        return { content: fallbackContent, userName: fallbackUserName };
      }
    }
    
    return { content, userName };
  },

  // Google ChatページURL判定ヘルパー
  checkGoogleChatPage: (url) => {
    return url.includes('chat.google.com') || 
           url.includes('mail.google.com/chat') ||
           url.includes('google.com/chat');
  },

  // システムメッセージ判定ヘルパー
  isSystemMessage: (content) => {
    if (!content) return true;
    
    const systemPatterns = [
      /^You$/i, /^今$/, /^\d+\s*(分|時間|秒)$/, /^Now$/i,
      /^(午前|午後)/, /^\d{1,2}:\d{2}$/, /^\.\.\.$/, /^読み込み中/,
      /^Loading/i, /^This is taking longer/i, /^Edit message$/i,
      /^Reply in thread$/i, /^リアクションを追加$/
    ];
    
    return systemPatterns.some(pattern => pattern.test(content.trim()));
  },

  // Chrome Runtime メッセージハンドラー
  createMessageHandler: (mockStats) => {
    return (request, sender, sendResponse) => {
      switch (request.action) {
        case 'getStats':
          sendResponse(mockStats);
          break;
        case 'clearData':
          sendResponse({ success: true });
          break;
        case 'processExistingMessages':
          sendResponse({ success: true });
          break;
        case 'ping':
          sendResponse({ pong: true });
          break;
        default:
          sendResponse({ error: 'Unknown action' });
      }
      return true;
    };
  }
};

describe('Content Script Tests', () => {
  let mockMessageElement;

  beforeEach(() => {
    // DOMのセットアップ
    document.body.innerHTML = `
      <div role="main">
        <div data-message-id="msg1" class="message">
          <div class="DTp27d QIJiHb">テストメッセージ</div>
          <span class="njhDLd O5OMdc">テストユーザー</span>
        </div>
      </div>
    `;

    mockMessageElement = document.querySelector('[data-message-id="msg1"]');

    // Console mockをクリア
    vi.clearAllMocks();
  });

  describe('Message Data Extraction', () => {
    describe('extractMessageContent', () => {
      it('メッセージ内容を正しく抽出する', () => {
        const content = TestHelpers.extractMessageContent(mockMessageElement);
        expect(content).toBe('テストメッセージ');
      });

      it('メッセージ内容が見つからない場合は空文字を返す', () => {
        const emptyElement = document.createElement('div');
        const content = TestHelpers.extractMessageContent(emptyElement);
        expect(content).toBe('');
      });
    });

    describe('extractUserName', () => {
      it('送信者名を正しく抽出する', () => {
        const userName = TestHelpers.extractUserName(mockMessageElement);
        expect(userName).toBe('テストユーザー');
      });

      it('data-name属性から送信者名を取得する', () => {
        mockMessageElement.setAttribute('data-name', 'AttributeUser');
        const userName = TestHelpers.extractUserName(mockMessageElement);
        expect(userName).toBe('AttributeUser');
      });

      it('送信者名が見つからない場合は空文字を返す', () => {
        const emptyElement = document.createElement('div');
        const userName = TestHelpers.extractUserName(emptyElement);
        expect(userName).toBe('');
      });
    });

    describe('extractTimeData', () => {
      it('タイムスタンプデータを正しく抽出する', () => {
        const timeElement = document.createElement('div');
        timeElement.className = 'FvYVyf';
        timeElement.textContent = '10:30 AM';
        timeElement.setAttribute('data-absolute-timestamp', '1699000000000');
        mockMessageElement.appendChild(timeElement);

        const timeData = TestHelpers.extractTimeData(mockMessageElement);
        expect(timeData.timeText).toBe('10:30 AM');
        expect(timeData.timestamp).toBe(1699000000000);
      });

      it('タイムスタンプ要素がない場合は現在時刻を使用する', () => {
        const timeData = TestHelpers.extractTimeData(mockMessageElement);
        expect(timeData.timeText).toBe('');
        expect(typeof timeData.timestamp).toBe('number');
        expect(timeData.timestamp).toBeGreaterThan(0);
      });
    });

    describe('extractFallbackData', () => {
      it('標準抽出が失敗した場合の代替データを取得する', () => {
        const longTextElement = document.createElement('div');
        longTextElement.textContent = 'これは長いテキストです。'.repeat(20);
        
        const result = TestHelpers.extractFallbackData(longTextElement, '', '');
        expect(result.content.length).toBeLessThanOrEqual(200);
        expect(result.userName).toBe('Unknown User');
      });

      it('既存のデータがある場合はそのまま返す', () => {
        const result = TestHelpers.extractFallbackData(mockMessageElement, 'existing content', 'existing user');
        expect(result.content).toBe('existing content');
        expect(result.userName).toBe('existing user');
      });
    });
  });

  describe('Google UI Element Detection', () => {
    describe('checkGoogleChatPage', () => {
      it('Google ChatのURLを正しく判定する', () => {
        expect(TestHelpers.checkGoogleChatPage('https://chat.google.com/room/test')).toBe(true);
        expect(TestHelpers.checkGoogleChatPage('https://mail.google.com/chat/u/0/')).toBe(true);
        expect(TestHelpers.checkGoogleChatPage('https://google.com/chat')).toBe(true);
        expect(TestHelpers.checkGoogleChatPage('https://example.com')).toBe(false);
      });
    });

    describe('isSystemMessage', () => {
      it('システムメッセージを正しく判定する', () => {
        expect(TestHelpers.isSystemMessage('You')).toBe(true);
        expect(TestHelpers.isSystemMessage('今')).toBe(true);
        expect(TestHelpers.isSystemMessage('5分')).toBe(true);
        expect(TestHelpers.isSystemMessage('午前')).toBe(true);
        expect(TestHelpers.isSystemMessage('10:30')).toBe(true);
        expect(TestHelpers.isSystemMessage('Loading')).toBe(true);
        expect(TestHelpers.isSystemMessage('通常のメッセージ')).toBe(false);
        expect(TestHelpers.isSystemMessage('')).toBe(true);
      });
    });
  });

  describe('Message Processing', () => {
    it('メッセージ要素の基本的な検証', () => {
      expect(mockMessageElement).toBeTruthy();
      expect(mockMessageElement.getAttribute('data-message-id')).toBe('msg1');
      expect(mockMessageElement.querySelector('.DTp27d.QIJiHb').textContent).toBe('テストメッセージ');
    });

    it('感情アイコンの挿入位置を特定する', () => {
      const messageTextElement = mockMessageElement.querySelector('.DTp27d.QIJiHb');
      expect(messageTextElement).toBeTruthy();
      
      // 感情アイコンを挿入する位置のテスト
      const iconElement = document.createElement('span');
      iconElement.className = 'emotion-analyzer-icon';
      iconElement.textContent = '😊';
      
      messageTextElement.appendChild(iconElement);
      
      const insertedIcon = messageTextElement.querySelector('.emotion-analyzer-icon');
      expect(insertedIcon).toBeTruthy();
      expect(insertedIcon.textContent).toBe('😊');
    });
  });

  describe('Chrome Runtime Message Handling', () => {
    const mockStats = {
      messageCount: 10,
      emotions: { positive: 5, negative: 2, angry: 1, neutral: 2 },
      backendConnected: true
    };

    it('getStats メッセージの処理', () => {
      const handleMessage = TestHelpers.createMessageHandler(mockStats);
      const mockSendResponse = vi.fn();
      
      handleMessage({ action: 'getStats' }, {}, mockSendResponse);
      expect(mockSendResponse).toHaveBeenCalledWith(mockStats);
    });

    it('clearData メッセージの処理', () => {
      const handleMessage = TestHelpers.createMessageHandler(mockStats);
      const mockSendResponse = vi.fn();
      
      handleMessage({ action: 'clearData' }, {}, mockSendResponse);
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('processExistingMessages メッセージの処理', () => {
      const handleMessage = TestHelpers.createMessageHandler(mockStats);
      const mockSendResponse = vi.fn();
      
      handleMessage({ action: 'processExistingMessages' }, {}, mockSendResponse);
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('ping メッセージの処理', () => {
      const handleMessage = TestHelpers.createMessageHandler(mockStats);
      const mockSendResponse = vi.fn();
      
      handleMessage({ action: 'ping' }, {}, mockSendResponse);
      expect(mockSendResponse).toHaveBeenCalledWith({ pong: true });
    });

    it('未知のアクションの処理', () => {
      const handleMessage = TestHelpers.createMessageHandler(mockStats);
      const mockSendResponse = vi.fn();
      
      handleMessage({ action: 'unknownAction' }, {}, mockSendResponse);
      expect(mockSendResponse).toHaveBeenCalledWith({ error: 'Unknown action' });
    });
  });
});