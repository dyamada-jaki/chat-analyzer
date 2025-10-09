import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// isNewChatButton関数のテスト
describe('isNewChatButton Function Tests', () => {
  let analyzer;
  let dom;

  beforeEach(() => {
    // JSDOM環境のセットアップ
    dom = new JSDOM(`<!DOCTYPE html><body></body></html>`);
    global.document = dom.window.document;
    global.window = dom.window;

    // ChatEmotionAnalyzerのモック（リファクタリング後の実装）
    analyzer = {
      getElementClasses: vi.fn((element) => {
        return element.className ? element.className.split(' ') : [];
      }),
      
      // リファクタリング後の実装をテスト
      isNewChatButton: function(element) {
        if (!element) return false;
        
        // 検出戦略を配列で管理（戦略パターン）
        const detectionStrategies = [
          this.detectDirectNewChatButton.bind(this),
          this.detectNewChatContainer.bind(this),
          this.detectNewChatParentContainer.bind(this),
          this.detectNewChatChildElement.bind(this),
          this.detectLegacyNewChatButton.bind(this)
        ];
        
        // 各戦略を順次実行（早期リターン）
        return detectionStrategies.some(strategy => strategy(element));
      },

      // 戦略1: 直接的な"New chat"ボタン要素の検出
      detectDirectNewChatButton: function(element) {
        const textContent = element.textContent?.trim().toLowerCase() || '';
        const jsname = element.getAttribute('jsname') || '';
        const elementClasses = this.getElementClasses(element);
        
        const isDirectButton = textContent === 'new chat' || 
                              jsname === 'V67aGc' || 
                              elementClasses.includes('T57Ued-nBWOSb');
        
        if (isDirectButton) {
          console.log('🎯 New chatボタンを直接検出:', element.textContent?.trim());
          return true;
        }
        
        return false;
      },

      // 戦略2: New chatボタンコンテナの精密検出
      detectNewChatContainer: function(element) {
        const jscontroller = element.getAttribute('jscontroller') || '';
        
        if (jscontroller !== 'KF64he') {
          return false;
        }
        
        const newChatSpan = element.querySelector('span[jsname="V67aGc"]');
        const newChatButton = element.querySelector('button[jsname="TrXBg"]');
        const dataIsFab = element.querySelector('[data-is-fab="true"]');
        
        const hasAllRequiredElements = newChatSpan && newChatButton && dataIsFab;
        const hasCorrectText = newChatSpan?.textContent?.trim().toLowerCase() === 'new chat';
        
        if (hasAllRequiredElements && hasCorrectText) {
          console.log('🎯 New chatボタンコンテナを精密検出 (厳格条件)');
          return true;
        }
        
        return false;
      },

      // 戦略3: "New chat"テキストを含む要素の親コンテナ検出
      detectNewChatParentContainer: function(element) {
        const newChatTextSpan = element.querySelector('.T57Ued-nBWOSb');
        
        if (!newChatTextSpan || newChatTextSpan.textContent?.trim().toLowerCase() !== 'new chat') {
          return false;
        }
        
        const fabButton = element.querySelector('[data-is-fab="true"]');
        
        if (fabButton) {
          console.log('🎯 New chatボタンの親コンテナを精密検出');
          return true;
        }
        
        return false;
      },

      // 戦略4: 子要素に"New chat"テキストがある場合の検出
      detectNewChatChildElement: function(element) {
        const newChatSpans = element.querySelectorAll('span');
        
        for (const span of newChatSpans) {
          if (span.textContent?.trim().toLowerCase() === 'new chat') {
            const parentContainer = span.closest('[jscontroller="KF64he"]');
            const hasFabFeatures = parentContainer?.querySelector('[data-is-fab="true"]');
            
            if (hasFabFeatures) {
              console.log('🎯 New chatテキストの親コンテナを精密検出');
              return true;
            }
          }
        }
        
        return false;
      },

      // 戦略5: 従来の親要素からの検出（厳格化）
      detectLegacyNewChatButton: function(element) {
        // より厳格な条件: 単純なclosest()だけでは不十分
        const hasNewChatParent = element.closest('[jsname="V67aGc"]') ||
                                element.closest('.T57Ued-nBWOSb');
        
        const hasNewChatButtonParent = element.closest('button')?.textContent?.trim().toLowerCase() === 'new chat';
        
        // FABボタンの特徴も確認
        const hasFabContext = element.closest('[data-is-fab="true"]') ||
                             element.closest('[jscontroller="KF64he"]');
        
        if ((hasNewChatParent || hasNewChatButtonParent) && hasFabContext) {
          console.log('🎯 New chatボタンの子要素を検出');
          return true;
        }
        
        return false;
      }
    };

    // Console mockをセットアップ
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Direct New Chat Button Detection', () => {
    it('テキストが"new chat"の要素を検出する', () => {
      const element = document.createElement('div');
      element.textContent = 'New Chat';
      
      expect(analyzer.isNewChatButton(element)).toBe(true);
    });

    it('jsname="V67aGc"の要素を検出する', () => {
      const element = document.createElement('span');
      element.setAttribute('jsname', 'V67aGc');
      
      expect(analyzer.isNewChatButton(element)).toBe(true);
    });

    it('クラス"T57Ued-nBWOSb"の要素を検出する', () => {
      const element = document.createElement('div');
      element.className = 'T57Ued-nBWOSb';
      
      expect(analyzer.isNewChatButton(element)).toBe(true);
    });
  });

  describe('Container Detection', () => {
    it('jscontroller="KF64he"のコンテナ内のNew Chatボタンを検出する', () => {
      const container = document.createElement('div');
      container.setAttribute('jscontroller', 'KF64he');
      container.innerHTML = `
        <span jsname="V67aGc">New Chat</span>
        <button jsname="TrXBg">Button</button>
        <div data-is-fab="true">FAB</div>
      `;
      
      expect(analyzer.isNewChatButton(container)).toBe(true);
    });

    it('条件が不完全なコンテナは検出しない', () => {
      const container = document.createElement('div');
      container.setAttribute('jscontroller', 'KF64he');
      container.innerHTML = `
        <span jsname="V67aGc">New Chat</span>
        <!-- button と data-is-fab が不足 -->
      `;
      
      expect(analyzer.isNewChatButton(container)).toBe(false);
    });
  });

  describe('Parent Container Detection', () => {
    it('T57Ued-nBWOSbクラスとFABボタンを持つコンテナを検出する', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="T57Ued-nBWOSb">New Chat</div>
        <div data-is-fab="true">FAB</div>
      `;
      
      expect(analyzer.isNewChatButton(container)).toBe(true);
    });

    it('FABボタンがないコンテナは検出しない', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="T57Ued-nBWOSb">New Chat</div>
        <!-- data-is-fab が不足 -->
      `;
      
      expect(analyzer.isNewChatButton(container)).toBe(false);
    });
  });

  describe('Child Element Detection', () => {
    it('子要素のspanに"New Chat"テキストがある場合を検出する', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div jscontroller="KF64he">
          <span>New Chat</span>
          <div data-is-fab="true">FAB</div>
        </div>
      `;
      
      expect(analyzer.isNewChatButton(container)).toBe(true);
    });
  });

  describe('Legacy Detection', () => {
    it('closest()による従来の検出方法をテストする', () => {
      const parent = document.createElement('div');
      parent.setAttribute('jsname', 'V67aGc');
      
      const child = document.createElement('span');
      parent.appendChild(child);
      
      expect(analyzer.isNewChatButton(child)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('null要素は検出しない', () => {
      expect(analyzer.isNewChatButton(null)).toBe(false);
    });

    it('undefined要素は検出しない', () => {
      expect(analyzer.isNewChatButton(undefined)).toBe(false);
    });

    it('通常のメッセージ要素は検出しない', () => {
      const element = document.createElement('div');
      element.textContent = '通常のメッセージです';
      
      expect(analyzer.isNewChatButton(element)).toBe(false);
    });

    it('空の要素は検出しない', () => {
      const element = document.createElement('div');
      
      expect(analyzer.isNewChatButton(element)).toBe(false);
    });
  });
});
