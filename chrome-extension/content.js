// Google Chat Emotion Analyzer - Content Script
console.log('🚀 Chat Emotion Analyzer が起動しました！');
console.log('🌐 現在のURL:', window.location.href);
console.log('🎯 ドメイン:', window.location.hostname);
console.log('🖼️ フレーム:', window.self === window.top ? 'メインフレーム' : 'iframe内');
console.log('📏 フレームサイズ:', window.innerWidth + 'x' + window.innerHeight);

class ChatEmotionAnalyzer {
  constructor() {
    this.processedMessages = new Set();
    this.emotionMap = new Map();
    this.backendUrl = 'http://localhost:3001';
    
    this.init();
  }

  init() {
    console.log('🔍 Google Chatメッセージの監視を開始...');
    console.log('📍 初期化開始 - URL:', window.location.href);
    
    // DOM要素のデバッグ調査
    this.debugDOMStructure();
    
    // 既存のメッセージを処理
    this.processExistingMessages();
    
    // 新しいメッセージの監視を開始
    console.log('🎯 startMessageMonitoring() を呼び出し中...');
    this.startMessageMonitoring();
    console.log('🎯 startMessageMonitoring() 呼び出し完了');
    
    // バックエンド接続テスト
    this.testBackendConnection();
    
    console.log('✅ 初期化完了 - observer:', typeof this.observer);
  }

  // DOM構造をデバッグ調査
  debugDOMStructure() {
    console.log('🔬 DOM構造デバッグ開始...');
    
    // 想定セレクタの確認
    const dataIdElements = document.querySelectorAll('[data-id]');
    console.log(`🎯 [data-id]要素数: ${dataIdElements.length}`);
    
    // [data-id]要素の詳細分析（自動実行）
    if (dataIdElements.length > 0) {
      console.log('📋 [data-id]要素の詳細分析:');
      dataIdElements.forEach((el, i) => {
        if (i < 3) { // 最大3件まで詳細表示
          console.log(`  [${i}] タグ: ${el.tagName}, data-id: ${el.getAttribute('data-id')}`);
          console.log(`      クラス: ${Array.from(el.classList).join(', ')}`);
          console.log(`      テキスト: ${el.textContent?.substring(0, 100)}...`);
          
          // 子要素のテキスト要素を探索
          const textElements = el.querySelectorAll('*');
          let foundText = false;
          textElements.forEach((child, childIndex) => {
            if (childIndex < 10 && child.textContent?.trim() && child.textContent.trim().length > 5) {
              console.log(`        子[${childIndex}] ${child.tagName}.${Array.from(child.classList).join('.')}: ${child.textContent.trim().substring(0, 50)}...`);
              foundText = true;
            }
          });
          
          if (!foundText) {
            console.log('        テキスト含有子要素なし');
          }
        }
      });
    }
    
    // メッセージテキストセレクタの確認
    const messageTextElements = document.querySelectorAll('.DTp27d.QIJiHb');
    console.log(`💬 .DTp27d.QIJiHb要素数: ${messageTextElements.length}`);
    
    // 送信者名セレクタの確認
    const userNameElements = document.querySelectorAll('.njhDLd.O5OMdc');
    console.log(`👤 .njhDLd.O5OMdc要素数: ${userNameElements.length}`);
    
    // 代替セレクタもテスト
    const altMessageSelectors = [
      '[role="article"]',
      '[role="listitem"]', 
      '.nF6pT',
      '.bpTBMe',
      '.AnmYv',
      '[data-message-id]',
      '.message',
      '.chat-message'
    ];
    
    altMessageSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      console.log(`🔍 ${selector}: ${elements.length}件`);
    });
    
    // Gmail統合Chat特有の要素も探索
    const gmailChatSelectors = [
      'div[data-topic-id]',
      'div[jsname]',
      'div[jscontroller]',
      '.dsoUjb',
      '.McQwEc',
      '[jsname="bgckF"]',
      '[jsname="oU6v8b"]',
      'div[role="presentation"]',
      'div[aria-label]'
    ];
    
    gmailChatSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      console.log(`📱 ${selector}: ${elements.length}件`);
      if (elements.length > 0 && elements.length < 10) {
        elements.forEach((el, i) => {
          const text = el.textContent?.trim();
          if (text && text.length > 10) {
            console.log(`   ${i}: ${text.substring(0, 50)}...`);
          }
        });
      }
    });
  }

  // 既存のメッセージを処理
  processExistingMessages() {
    // Gmail統合Chat用の正確なセレクタ（実際のDOM構造に基づく）
    const gmailMessageSelectors = [
      'div[data-message-id]',                    // メッセージID付きの要素
      'div[data-member-id*="user/human/"]',      // ユーザー情報付きの要素  
      'div[data-name]',                          // ユーザー名付きの要素
      'div.AflJR',                              // メッセージコンテナの最上位クラス
      'div[jsname="o7uNDd"]',                   // メッセージ本体のコンテナ
      '[data-id]',                              // 従来（念のため）
      'div[role="row"]',                        // Gmail style（念のため）
      'div[role="group"]'                       // Chat group（念のため）
    ];
    
    let totalFound = 0;
    
    for (const selector of gmailMessageSelectors) {
      const messages = document.querySelectorAll(selector);
      console.log(`🔍 ${selector}: ${messages.length}件`);
      
      if (messages.length > 0 && selector !== '[data-id]') {
        // SCRIPTタグ以外の要素を処理
        const validMessages = Array.from(messages).filter(el => 
          el.tagName !== 'SCRIPT' && 
          el.textContent?.trim().length > 10 && 
          !el.textContent.includes('window.WIZ_global_data') && 
          !this.isButtonElement(el) &&
          !this.isGoogleUIElement(el) &&
          this.isInMessageContainer(el)
        );
        
        console.log(`✅ ${selector}で有効なメッセージ候補: ${validMessages.length}件`);
        
        if (validMessages.length > 0) {
          validMessages.forEach((messageElement, i) => {
            if (i < 5) { // 最大5件まで処理
              console.log(`📝 処理中[${i}]: ${messageElement.tagName} - ${messageElement.textContent?.substring(0, 50)}...`);
              this.processMessage(messageElement, selector);
            }
          });
          totalFound += validMessages.length;
          break; // 有効なセレクタが見つかったら他は試行しない
        }
      }
    }
    
    console.log(`📝 既存メッセージ総数: ${totalFound}件`);
    
    // 全てのセレクタで見つからない場合は、より広範囲に探索
    if (totalFound === 0) {
      this.exploreAllElements();
    }
  }

  // 新しいメッセージの監視
  startMessageMonitoring() {
    console.log('🚀 startMessageMonitoring() 開始...');
    
    try {
      const observer = new MutationObserver((mutations) => {
      console.log(`🔄 DOM変更検出: ${mutations.length}件の変更`);
      
      mutations.forEach((mutation, index) => {
        console.log(`🔍 変更[${index}]: タイプ=${mutation.type}, ターゲット=${mutation.target.tagName}`);
        
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            console.log(`🆕 新しいノード追加: ${node.tagName}, クラス=[${Array.from(node.classList || []).join(', ')}]`);
            
            // Google UI要素チェック
            if (this.isGoogleUIElement(node)) {
              console.log('🚫 Google UI要素を検出して無視:', node.className || node.tagName);
              return;
            }
            
            // メッセージコンテナ外チェック
            if (!this.isInMessageContainer(node)) {
              console.log('🚫 メッセージコンテナ外を検出して無視:', node.className || node.tagName);
              return;
            }
            
            // Gmail Chat専用セレクタで検索
            const gmailSelectors = [
              '[data-message-id]',
              '[data-name]', 
              '[jsname="bgckF"]',
              '.DTp27d.QIJiHb',
              '.AflJR',
              '[data-id]'
            ];
            
            // ノード自体をチェック（ボタン要素とGoogle UI要素を除外）
            for (const selector of gmailSelectors) {
              if (node.matches && node.matches(selector) && 
                  !this.isButtonElement(node) && 
                  !this.isGoogleUIElement(node)) {
                console.log(`💬 新しいメッセージを検出（直接-${selector}）:`, node);
                this.processMessage(node, `realtime-direct-${selector}`);
                break; // 最初にマッチしたセレクタのみ処理
              }
            }
            
            // 子要素もチェック（ボタン要素とGoogle UI要素を除外、メッセージテキスト要素のみ優先）
            const prioritySelectors = ['[jsname="bgckF"]', '.DTp27d.QIJiHb'];
            let foundMessageText = false;
            
            for (const selector of prioritySelectors) {
              const messageElements = node.querySelectorAll ? node.querySelectorAll(selector) : [];
              messageElements.forEach(msgEl => {
                if (!this.isButtonElement(msgEl) && 
                    !this.isGoogleUIElement(msgEl) &&
                    this.isInMessageContainer(msgEl)) {
                  console.log(`💬 子要素から新しいメッセージを検出 (${selector}):`, msgEl);
                  this.processMessage(msgEl, `realtime-child-${selector}`);
                  foundMessageText = true;
                }
              });
              if (foundMessageText) break; // メッセージテキストが見つかったら他のセレクタは処理しない
            }
            
            // メッセージテキストが見つからない場合のみ、他のセレクタを試行
            if (!foundMessageText) {
              const fallbackSelectors = gmailSelectors.filter(s => !prioritySelectors.includes(s));
              for (const selector of fallbackSelectors) {
                const messageElements = node.querySelectorAll ? node.querySelectorAll(selector) : [];
                messageElements.forEach(msgEl => {
                  if (!this.isButtonElement(msgEl) && 
                      !this.isGoogleUIElement(msgEl) &&
                      this.isInMessageContainer(msgEl)) {
                    console.log(`💬 子要素から新しいメッセージを検出 (${selector}):`, msgEl);
                    this.processMessage(msgEl, `realtime-child-${selector}`);
                  }
                });
              }
            }
          }
        });
      });
    });

      // Google Chatのメインコンテナを監視
      const chatContainer = document.querySelector('[role="main"]') || document.body;
      console.log('📍 監視対象コンテナ:', chatContainer.tagName, chatContainer.className);
      
      observer.observe(chatContainer, {
        childList: true,
        subtree: true
      });

      this.observer = observer;
      console.log('✅ MutationObserver設定完了:', typeof this.observer);
      console.log('👀 リアルタイムメッセージ監視を開始');
      
    } catch (error) {
      console.error('❌ startMessageMonitoring() エラー:', error);
      this.observer = null;
    }
  }

  // ボタン要素かどうかを判定
  isButtonElement(element) {
    if (!element) return true;
    
    // BUTTON タグは除外
    if (element.tagName === 'BUTTON') {
      return true;
    }
    
    // ボタン関連のdata-id値を除外
    const buttonDataIds = ['edit', 'replyToThread', 'reply', 'react', 'menu', 'more'];
    const dataId = element.getAttribute('data-id');
    if (dataId && buttonDataIds.includes(dataId)) {
      return true;
    }
    
    // ボタン関連のrole属性を除外
    const role = element.getAttribute('role');
    if (role === 'button') {
      return true;
    }
    
    // ボタン関連のクラス名を除外
    const className = element.className || '';
    if (className.includes('pYTkkf') || className.includes('button') || className.includes('btn')) {
      return true;
    }
    
    return false;
  }

  // 全要素を探索（最後の手段）
  exploreAllElements() {
    console.log('🔍 全要素探索を開始（Gmail統合Chat用）...');
    
    // テキストを含む全DIV要素を探索
    const allDivs = document.querySelectorAll('div');
    const potentialMessages = Array.from(allDivs).filter(div => {
      const text = div.textContent?.trim();
      return text && 
             text.length > 10 && 
             text.length < 500 && // 長すぎるテキストは除外
             !text.includes('window.WIZ_global_data') &&
             !text.includes('DOCTYPE') &&
             div.children.length < 20; // 子要素が多すぎるのは除外
    });
    
    console.log(`🔍 潜在的メッセージ要素: ${potentialMessages.length}件`);
    
    // 上位10件の詳細を表示
    potentialMessages.slice(0, 10).forEach((element, i) => {
      console.log(`🔍 候補[${i}]:`, {
        tagName: element.tagName,
        classList: Array.from(element.classList).slice(0, 3), // 最初の3クラスのみ
        textLength: element.textContent?.length,
        textPreview: element.textContent?.trim().substring(0, 80),
        children: element.children.length
      });
    });
    
    // 上位5件を強制的にメッセージとして処理
    if (potentialMessages.length > 0) {
      console.log('⚡ 上位5件を強制処理...');
      potentialMessages.slice(0, 5).forEach((messageElement, i) => {
        this.processMessage(messageElement, 'exploreAll');
      });
    }
  }

  // メッセージ処理
  processMessage(messageElement, sourceSelector = 'unknown') {
    // 要素がメッセージコンテナ内にあるかチェック
    if (!this.isInMessageContainer(messageElement)) {
      console.log('⚠️ メッセージコンテナ外の要素をスキップ');
      return;
    }
    
    // より確実なユニークID生成
    const dataId = messageElement.getAttribute('data-id');
    const messageText = messageElement.textContent?.trim() || '';
    const uniqueKey = dataId || `${messageText.substring(0, 50)}_${messageElement.tagName}`;
    
    // 既に処理済みの場合はスキップ
    if (this.processedMessages.has(uniqueKey)) {
      console.log(`⏭️ 既に処理済みメッセージをスキップ: ${uniqueKey.substring(0, 30)}...`);
      return;
    }

    try {
      console.log(`🔍 メッセージ処理開始 (${sourceSelector}):`, {
        tagName: messageElement.tagName,
        uniqueKey: uniqueKey.substring(0, 30) + '...',
        classList: Array.from(messageElement.classList).slice(0, 3)
      });
      
      // メッセージ情報を抽出
      const messageData = this.extractMessageData(messageElement);
      
      // メッセージの有効性をより厳格にチェック
      if (this.isValidMessage(messageData)) {
        console.log('💬 メッセージ抽出成功:', messageData);
        
        // 処理済みとしてマーク（感情分析前に実行して重複を防ぐ）
        this.processedMessages.add(uniqueKey);
        
        // バックエンドに感情分析を依頼
        this.analyzeEmotion(messageData, messageElement);
        
      } else {
        console.log('⚠️ メッセージ抽出失敗:', {
          hasContent: !!messageData.content,
          hasUserName: !!messageData.userName,
          contentLength: messageData.content?.length || 0,
          isSystemMessage: this.isSystemMessage(messageData.content),
          isUIElement: this.isUIElement(messageData.content)
        });
      }
    } catch (error) {
      console.error('❌ メッセージ処理エラー:', error);
    }
  }

  // メッセージコンテナ内の要素かチェック
  isInMessageContainer(element) {
    // 最初に明確に除外すべき要素をチェック
    if (this.isGoogleUIElement(element)) {
      console.log('⚠️ Google UI要素を検出して除外:', element.className);
      return false;
    }
    
    // チャットメッセージエリアを示すセレクタ
    const messageContainerSelectors = [
      '[role="main"]',           // メインコンテンツエリア
      '.nF6pT',                  // Google Chatメッセージコンテナ
      '.bzJiD',                  // チャットストリーム
      '.Tm1pwc',                 // メッセージリスト
      '.yqoUIf'                  // メッセージ要素
    ];
    
    for (const selector of messageContainerSelectors) {
      if (element.closest(selector)) {
        return true;
      }
    }
    
    // URLベースでの追加チェック
    const isGmailChat = window.location.hostname.includes('mail.google.com') && 
                       window.location.pathname.includes('chat');
    const isStandaloneChat = window.location.hostname.includes('chat.google.com');
    
    if (!(isGmailChat || isStandaloneChat)) {
      return false;
    }
    
    // ナビゲーション・ヘッダー要素を除外（強化版）
    const excludeContainers = [
      'header[role="banner"]',   // ヘッダー（明示的）
      '[role="banner"]',         // ヘッダー
      '[role="navigation"]',     // ナビゲーション
      '[role="toolbar"]',        // ツールバー
      '[role="menubar"]',        // メニューバー
      '.gb_pc',                  // Googleバー
      '.nH',                     // Gmailヘッダー
      '[data-action-button]',    // アクションボタン
      '.Z0LcW',                  // サイドバー
      '[role="complementary"]',  // 補助コンテンツ
      '#gb',                     // Google Bar ID
      '.pGxpHc'                  // 外側コンテナ
    ];
    
    for (const selector of excludeContainers) {
      if (element.closest(selector)) {
        console.log(`🚫 除外対象コンテナを検出 (${selector}):`, element);
        return false;
      }
    }
    
    return true;
  }

  // Google UI要素かどうかを判定
  isGoogleUIElement(element) {
    if (!element) return false;
    
    // Google特有のクラス名パターン
    const googleClassPatterns = [
      /^gb_/,         // Google Bar: gb_Ha, gb_ub, gb_zd 等
      /^pGxpHc/,      // 外側コンテナ
      /^QhgNnf/,      // メニュー項目
      /^bMWlzf/,      // ボタン要素
      /^pYTkkf/,      // 設定ボタン
      /^Ewn2Sd/,      // Support ボタン
      /^lJradf/,      // ステータス要素
      /^gstl_/,       // 検索関連
      /^gsib_/,       // 検索ボックス
      /^RBHQF/        // その他のGoogle UI
    ];
    
    const elementClasses = element.className || '';
    
    // クラス名での判定
    for (const pattern of googleClassPatterns) {
      if (pattern.test(elementClasses)) {
        return true;
      }
    }
    
    // role属性での判定
    const role = element.getAttribute('role');
    if (role && ['banner', 'navigation', 'toolbar', 'menubar', 'button'].includes(role)) {
      return true;
    }
    
    // ng-non-bindable 属性（Angular関連のGoogle UI）
    if (element.hasAttribute('ng-non-bindable')) {
      return true;
    }
    
    // header タグで id="gb" の場合
    if (element.tagName === 'HEADER' && element.id === 'gb') {
      return true;
    }
    
    return false;
  }

  // メッセージの有効性をチェック
  isValidMessage(messageData) {
    return messageData.content && 
           messageData.content.trim() && 
           messageData.content.length > 2 && 
           messageData.userName &&
           !this.isSystemMessage(messageData.content) &&
           !this.isUIElement(messageData.content);
  }

  // UI要素かどうかを判定
  isUIElement(content) {
    if (!content) return true;
    
    const uiPatterns = [
      /^New Chat$/i,
      /^Settings$/i,
      /^設定$/,
      /^Menu$/i,
      /^メニュー$/,
      /^Search$/i,
      /^検索$/,
      /^More$/i,
      /^その他$/,
      /^Close$/i,
      /^閉じる$/,
      /^Back$/i,
      /^戻る$/,
      /^Next$/i,
      /^次へ$/,
      /^Cancel$/i,
      /^キャンセル$/,
      /^Send$/i,
      /^送信$/,
      /^Share$/i,
      /^共有$/,
      /^Delete$/i,
      /^削除$/,
      /^Archive$/i,
      /^アーカイブ$/,
      /^Mute$/i,
      /^ミュート$/
    ];
    
    return uiPatterns.some(pattern => pattern.test(content.trim()));
  }

  // システムメッセージかどうかを判定
  isSystemMessage(content) {
    if (!content) return true;
    
    const systemPatterns = [
      /^You$/i,
      /^今$/,
      /^\d+\s*(分|時間|秒)$/,
      /^Now$/i,
      /^午前|午後/,
      /^\d{1,2}:\d{2}$/,
      /^\.\.\.$/,
      /^読み込み中/,
      /^Loading/i,
      /^This is taking longer/i,
      /^Edit message$/i,
      /^Reply in thread$/i,
      /^リアクションを追加$/
    ];
    
    return systemPatterns.some(pattern => pattern.test(content.trim()));
  }

  // メッセージデータ抽出
  extractMessageData(messageElement) {
    const messageId = messageElement.getAttribute('data-id');
    const userId = messageElement.getAttribute('data-user-id');
    
    // Gmail統合Chat用の代替セレクタ
    const isGmailChat = window.location.hostname === 'mail.google.com';
    
    console.log('🔍 メッセージ要素を解析中:', {
      messageId,
      userId,
      isGmailChat,
      elementClasses: Array.from(messageElement.classList),
      elementTag: messageElement.tagName
    });
    
    // メッセージ内容を取得（Gmail Chat専用セレクタ優先）
    let content = '';
    const contentSelectors = [
      'div[jsname="bgckF"].DTp27d.QIJiHb',  // Gmail Chat完全一致
      '.DTp27d.QIJiHb',                     // 標準Google Chat
      'div[jsname="bgckF"]',                // Gmail Chat jsname
      '.DTp27d',                            // 部分一致
      '.Zc1Emd',                            // 代替1
      '.message-text',                      // 汎用
      '[data-message-text]'                 // 属性ベース
    ];
    
    for (const selector of contentSelectors) {
      const contentElement = messageElement.querySelector(selector);
      if (contentElement && contentElement.textContent.trim()) {
        content = contentElement.textContent.trim();
        console.log(`✅ メッセージ内容を取得 (${selector}):`, content.substring(0, 50));
        break;
      }
    }
    
    // 送信者名を取得（Gmail Chat専用セレクタ優先）
    let userName = messageElement.getAttribute('data-name') || '';
    
    if (!userName) {
      const userNameSelectors = [
        'span.njhDLd.O5OMdc',                 // Gmail Chat完全一致
        '.njhDLd.O5OMdc',                     // 標準Google Chat
        '[jsname="oU6v8b"]',                  // Gmail統合Chat jsname
        '.njhDLd',                            // 部分一致
        '.sender-name',                       // 汎用
        '.user-name'                          // 汎用
      ];
    
      for (const selector of userNameSelectors) {
        const userNameElement = messageElement.querySelector(selector);
        if (userNameElement && userNameElement.textContent.trim()) {
          userName = userNameElement.textContent.trim();
          console.log(`✅ 送信者名を取得 (${selector}):`, userName);
          break;
        }
      }
    } else {
      console.log(`✅ 送信者名を取得 (data-name):`, userName);
    }
    
    // タイムスタンプを取得
    const timeElement = messageElement.querySelector('.FvYVyf') || 
                       messageElement.querySelector('[data-absolute-timestamp]') ||
                       messageElement.querySelector('.timestamp');
    const timeText = timeElement ? timeElement.textContent.trim() : '';
    const timestamp = timeElement ? timeElement.getAttribute('data-absolute-timestamp') : '';
    
    // 代替データ抽出（要素が見つからない場合）
    if (!content && !userName) {
      console.log('⚠️ 標準セレクタで取得失敗、代替手段を試行');
      
      // 要素全体のテキストから推測
      const allText = messageElement.textContent || '';
      if (allText.length > 10) {
        content = allText.substring(0, 200); // 最初の200文字を仮のコンテンツに
        userName = 'Unknown User'; // デフォルト送信者名
        console.log('🔄 代替抽出:', { content: content.substring(0, 50), userName });
      }
    }
    
    return {
      messageId,
      userId,
      userName,
      content,
      timeText,
      timestamp: timestamp ? parseInt(timestamp) : Date.now()
    };
  }

  // 感情分析をバックエンドに依頼
  async analyzeEmotion(messageData, messageElement) {
    try {
      console.log('🧠 感情分析を開始:', messageData.content);
      
      // バックエンドに3秒のタイムアウトを設定
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${this.backendUrl}/api/webhook/test-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: messageData.content,
          userName: messageData.userName,
          userId: messageData.userId
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const result = await response.json();
      
      if (result.success && result.emotion) {
        const emotion = result.emotion.emotion;
        const confidence = Math.round(result.emotion.confidence * 100);
        
        console.log(`📊 感情分析結果 (バックエンド): ${emotion} (${confidence}%)`);
        
        // 感情アイコンを表示
        this.displayEmotionIcon(messageElement, emotion, confidence);
        
        // 感情データを保存
        this.emotionMap.set(messageData.messageId, {
          emotion,
          confidence,
          messageData
        });
      } else {
        throw new Error('バックエンドから有効な感情分析結果が返されませんでした');
      }
    } catch (error) {
      console.error('❌ 感情分析エラー:', error.message);
      // 確実にフォールバック分析を実行
      console.log('🔄 ローカル感情分析にフォールバック');
      this.fallbackEmotionAnalysis(messageData, messageElement);
    }
  }

  // 感情アイコンを表示
  displayEmotionIcon(messageElement, emotion, confidence) {
    console.log(`🎨 感情アイコン表示開始: ${emotion} (${confidence}%)`);
    
    // メッセージ要素の階層全体で既存アイコンをチェック
    const parentContainer = messageElement.closest('[data-id]') || messageElement;
    const existingIcons = parentContainer.querySelectorAll('.emotion-analyzer-icon');
    if (existingIcons.length > 0) {
      console.log(`🗑️ 既存アイコン ${existingIcons.length}個を削除`);
      existingIcons.forEach(icon => icon.remove());
    }

    // 感情アイコンマッピング（より豊富な絵文字）
    const emotionIcons = {
      'positive': '😊',
      'negative': '😢', 
      'angry': '😠',
      'neutral': '😐'
    };

    // 美しいカラーパレット
    const emotionColors = {
      'positive': '#10B981', // emerald-500
      'negative': '#3B82F6', // blue-500  
      'angry': '#EF4444',    // red-500
      'neutral': '#6B7280'   // gray-500
    };

    const emotionLabels = {
      'positive': 'ポジティブ',
      'negative': 'ネガティブ',
      'angry': '怒り・不満',
      'neutral': 'ニュートラル'
    };

    const icon = emotionIcons[emotion] || '😐';
    const color = emotionColors[emotion] || '#6B7280';
    const label = emotionLabels[emotion] || 'ニュートラル';

    // 信頼度に応じた透明度
    const opacity = Math.max(0.6, confidence / 100);
    
    // アイコン要素を作成
    const iconElement = document.createElement('div');
    iconElement.className = 'emotion-analyzer-icon';
    
    // 高品質なスタイリング
    iconElement.innerHTML = `
      <div class="emotion-icon-container" style="
        display: inline-flex;
        align-items: center;
        margin-left: 8px;
        padding: 4px 8px;
        background: linear-gradient(135deg, ${color}15, ${color}25);
        border: 1px solid ${color}40;
        border-radius: 16px;
        font-size: 14px;
        color: ${color};
        font-weight: 600;
        cursor: help;
        opacity: ${opacity};
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(4px);
        box-shadow: 0 2px 4px ${color}20, 0 1px 2px ${color}10;
        transform: scale(0);
        animation: emotionPopIn 0.5s ease-out forwards;
      " title="感情分析: ${label} (確信度: ${confidence}%)">
        <span class="emotion-emoji" style="
          margin-right: 4px;
          font-size: 16px;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
          animation: emotionPulse 2s ease-in-out infinite;
        ">${icon}</span>
        <span class="emotion-confidence" style="
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          opacity: 0.8;
        ">${confidence}%</span>
      </div>
    `;

    // ホバーエフェクトのイベントリスナー
    const container = iconElement.querySelector('.emotion-icon-container');
    container.addEventListener('mouseenter', () => {
      container.style.transform = 'scale(1.05)';
      container.style.boxShadow = `0 4px 12px ${color}30, 0 2px 4px ${color}20`;
    });
    
    container.addEventListener('mouseleave', () => {
      container.style.transform = 'scale(1)';
      container.style.boxShadow = `0 2px 4px ${color}20, 0 1px 2px ${color}10`;
    });

    // 最適な挿入位置を見つける
    this.insertEmotionIcon(messageElement, iconElement);
    
    console.log(`✨ 感情アイコン表示完了: ${label} ${icon}`);
  }

  // 感情アイコンの最適な挿入位置を決定
  insertEmotionIcon(messageElement, iconElement) {
    // メッセージ全体のコンテナを取得
    const messageContainer = messageElement.closest('[data-id]') || messageElement;
    
    // 優先順位1: メッセージテキストの直後
    const messageTextElement = messageContainer.querySelector('.DTp27d.QIJiHb, [jsname="bgckF"]');
    if (messageTextElement && messageTextElement.parentNode) {
      messageTextElement.appendChild(iconElement);
      console.log('📍 アイコン挿入位置: メッセージテキスト内の末尾');
      return;
    }
    
    // 優先順位2: ユーザー名要素の直後
    const userNameElement = messageContainer.querySelector('.njhDLd.O5OMdc, [data-name]');
    if (userNameElement && userNameElement.parentNode) {
      userNameElement.parentNode.insertBefore(iconElement, userNameElement.nextSibling);
      console.log('📍 アイコン挿入位置: ユーザー名の後');
      return;
    }
    
    // 優先順位3: メッセージコンテナの末尾
    const contentContainer = messageContainer.querySelector('.yqoUIf, .AflJR');
    if (contentContainer) {
      contentContainer.appendChild(iconElement);
      console.log('📍 アイコン挿入位置: コンテンツコンテナの末尾');
      return;
    }
    
    // フォールバック: メッセージ要素の末尾
    messageContainer.appendChild(iconElement);
    console.log('📍 アイコン挿入位置: メッセージコンテナの末尾（フォールバック）');
  }

  // フォールバック感情分析
  fallbackEmotionAnalysis(messageData, messageElement) {
    const text = messageData.content.toLowerCase();
    let emotion = 'neutral';
    let confidence = 0.6;

    // 簡単なキーワードベース分析
    const positiveWords = ['嬉しい', '楽しい', '最高', 'ありがとう', '良い', 'いいね', '😊', '😄'];
    const negativeWords = ['悲しい', '辛い', '大変', '心配', '不安', '😢', '😞'];
    const angryWords = ['むかつく', '腹立つ', 'イライラ', '最悪', '😠', 'やる気', 'API', '使えない'];

    if (angryWords.some(word => text.includes(word))) {
      emotion = 'angry';
      confidence = 0.8;
    } else if (positiveWords.some(word => text.includes(word))) {
      emotion = 'positive';
      confidence = 0.7;
    } else if (negativeWords.some(word => text.includes(word))) {
      emotion = 'negative';
      confidence = 0.7;
    }

    console.log(`🤖 ローカル感情分析: ${emotion} (${Math.round(confidence * 100)}%)`);
    this.displayEmotionIcon(messageElement, emotion, Math.round(confidence * 100));
  }

  // バックエンド接続テスト
  async testBackendConnection() {
    try {
      const response = await fetch(`${this.backendUrl}/`);
      const data = await response.json();
      
      if (data.name === 'Chat Analyzer Backend') {
        console.log('✅ バックエンド接続成功:', data.name);
      } else {
        console.log('⚠️ バックエンド応答異常:', data);
      }
    } catch (error) {
      console.log('❌ バックエンド未接続 - ローカル分析を使用:', error.message);
    }
  }

  // 統計情報を表示
  showStats() {
    console.log('📊 感情分析統計:');
    console.log(`処理済みメッセージ数: ${this.processedMessages.size}`);
    console.log(`感情データ: ${this.emotionMap.size}`);
    
    const emotions = Array.from(this.emotionMap.values()).map(data => data.emotion);
    const emotionCounts = emotions.reduce((acc, emotion) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {});
    
    console.log('感情分布:', emotionCounts);
    return {
      messageCount: this.processedMessages.size,
      emotionCount: this.emotionMap.size,
      emotions: emotionCounts
    };
  }

  // データクリア
  clearData() {
    this.processedMessages.clear();
    this.emotionMap.clear();
    
    // 画面上のアイコンも削除
    document.querySelectorAll('.emotion-analyzer-icon').forEach(el => el.remove());
    
    console.log('🗑️ 全データをクリアしました');
  }

  // バックエンド接続状態を確認
  async checkBackendConnection() {
    try {
      const response = await fetch(`${this.backendUrl}/`, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // 手動デバッグ用ヘルパー関数
  debugManual() {
    console.log('🔧 手動デバッグ実行中...');
    this.debugDOMStructure();
    
    // 現在のページの基本情報
    console.log('📍 現在のページ情報:');
    console.log('  URL:', window.location.href);
    console.log('  タイトル:', document.title);
    console.log('  Ready State:', document.readyState);
    
    return {
      processed: this.processedMessages.size,
      emotions: this.emotionMap.size,
      url: window.location.href
    };
  }

  // DOM要素の詳細調査
  inspectElements(selector) {
    const elements = document.querySelectorAll(selector);
    console.log(`🔍 ${selector} の詳細調査 (${elements.length}件):`);
    
    elements.forEach((el, i) => {
      if (i < 5) { // 最大5件まで表示
        console.log(`  [${i}]:`, {
          tagName: el.tagName,
          classList: Array.from(el.classList),
          attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`),
          textContent: el.textContent?.substring(0, 100) + '...',
          innerHTML: el.innerHTML?.substring(0, 200) + '...'
        });
      }
    });
    
    return elements.length;
  }
}

// グローバルアクセス用（単一インスタンス）
let chatEmotionAnalyzer = null;

// DOM読み込み完了後に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    chatEmotionAnalyzer = new ChatEmotionAnalyzer();
    window.chatEmotionAnalyzer = chatEmotionAnalyzer;
  });
} else {
  chatEmotionAnalyzer = new ChatEmotionAnalyzer();
  window.chatEmotionAnalyzer = chatEmotionAnalyzer;
}

// デバッグ用のグローバル関数
window.debugChatAnalyzer = () => window.chatEmotionAnalyzer.debugManual();
window.inspectElements = (selector) => window.chatEmotionAnalyzer.inspectElements(selector);

// 新機能: Gmail Chat実際のメッセージ要素を検索
window.findMessageElements = () => {
  console.log('🔍 Gmail Chat: 実際のメッセージ要素を検索中...');
  
  // 一般的なメッセージ候補セレクタ
  const candidates = [
    'div[data-message-id]',
    'div[role="listitem"]',
    'div[role="row"]', 
    '[jsname*="message"]',
    '[data-testid*="message"]',
    '.message',
    '.chat-message',
    '[aria-label*="メッセージ"]',
    '[aria-label*="message"]',
    '[data-id]:not(script)',
    'div[jscontroller]',
    'div[jsdata]'
  ];

  candidates.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`✅ "${selector}": ${elements.length}件`);
      elements.forEach((el, i) => {
        if (i < 3) { // 最初の3件のみ表示
          console.log(`  [${i}] テキスト: "${el.textContent?.slice(0, 80)}"`);
          console.log(`      クラス: [${Array.from(el.classList).join(', ')}]`);
        }
      });
    }
  });

  // 特定の文字列を含む要素を検索
  console.log('\n🔍 特定テキストを含む要素を検索...');
  const allDivs = document.querySelectorAll('div');
  const messageElements = Array.from(allDivs).filter(div => {
    const text = div.textContent?.trim();
    return text && 
           text.length > 5 && 
           text.length < 500 &&
           !text.includes('This is taking longer') &&
           !text.includes('Using NaN%') &&
           !text.includes('Powered by Google') &&
           /[あ-ん]|[ア-ン]|[一-龯]|[a-zA-Z]/.test(text); // 日本語または英語を含む
  });

  console.log(`💬 メッセージ候補: ${messageElements.length}件`);
  messageElements.slice(0, 10).forEach((el, i) => {
    console.log(`[${i}] "${el.textContent?.slice(0, 80)}"`);
    console.log(`    クラス: [${Array.from(el.classList).join(', ')}]`);
    console.log(`    HTML:`, el.outerHTML.slice(0, 200) + '...');
    console.log(`    親要素クラス: [${Array.from(el.parentElement?.classList || []).join(', ')}]`);
    console.log('---');
  });

  return messageElements;
};

// MutationObserverテスト機能
window.testMutationObserver = () => {
  console.log('🧪 MutationObserverテスト開始...');
  
  // 1. MutationObserverの存在確認
  console.log('MutationObserver存在確認:', typeof window.chatEmotionAnalyzer?.observer);
  
  // 2. 手動でテスト要素を作成
  console.log('🔧 テスト要素を作成中...');
  const testDiv = document.createElement('div');
  testDiv.className = 'DTp27d QIJiHb Zc1Emd';
  testDiv.textContent = '🧪 MutationObserverテストメッセージです！';
  testDiv.setAttribute('data-message-id', 'test-mutation-123');
  testDiv.setAttribute('data-name', 'Test User');
  testDiv.setAttribute('jsname', 'bgckF');
  testDiv.id = 'test-mutation-element';
  
  console.log('📝 テスト要素の詳細:', {
    tagName: testDiv.tagName,
    className: testDiv.className,
    textContent: testDiv.textContent,
    attributes: {
      'data-message-id': testDiv.getAttribute('data-message-id'),
      'data-name': testDiv.getAttribute('data-name'),
      'jsname': testDiv.getAttribute('jsname')
    }
  });
  
  // 3. DOMに追加（MutationObserverが反応するはず）
  console.log('➕ テスト要素をDOMに追加...');
  document.body.appendChild(testDiv);
  
  // 4. 3秒後に削除
  setTimeout(() => {
    console.log('🗑️ テスト要素を削除...');
    const element = document.getElementById('test-mutation-element');
    if (element) {
      document.body.removeChild(element);
      console.log('✅ テスト要素削除完了');
    }
  }, 3000);
  
  // 5. 統計情報を表示
  setTimeout(() => {
    if (window.chatEmotionAnalyzer) {
      const stats = window.chatEmotionAnalyzer.showStats();
      console.log('📊 テスト後の統計:', stats);
    }
  }, 1000);
  
  console.log('🧪 MutationObserverテスト完了。3秒後に要素が削除されます。');
};

// 全DOM変更監視機能（デバッグ用）
window.debugAllChanges = () => {
  console.log('🔍 全DOM変更監視を開始します...');
  console.log('📝 この後メッセージを送信してください。すべてのDOM変更がログ出力されます。');
  
  // 既存のMutationObserverを一時的に置き換え
  if (window.chatEmotionAnalyzer?.observer) {
    window.chatEmotionAnalyzer.observer.disconnect();
    console.log('🔄 既存のMutationObserverを停止しました');
  }
  
  // 全変更を監視する新しいObserver
  const debugObserver = new MutationObserver((mutations) => {
    console.log(`🚨 全DOM変更検出: ${mutations.length}件の変更`);
    
    mutations.forEach((mutation, index) => {
      console.log(`📋 変更[${index}]:`, {
        type: mutation.type,
        target: mutation.target.tagName,
        targetClass: Array.from(mutation.target.classList || []).join(' '),
        addedNodes: mutation.addedNodes.length,
        removedNodes: mutation.removedNodes.length,
        attributeName: mutation.attributeName,
        oldValue: mutation.oldValue
      });
      
      // 追加されたノードの詳細
      mutation.addedNodes.forEach((node, nodeIndex) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          console.log(`  ➕ 追加ノード[${nodeIndex}]:`, {
            tagName: node.tagName,
            className: node.className,
            id: node.id,
            textContent: node.textContent?.slice(0, 100),
            attributes: Array.from(node.attributes || []).map(attr => `${attr.name}="${attr.value}"`).slice(0, 5)
          });
          
          // メッセージ関連の要素かチェック
          const isMessageRelated = 
            node.textContent?.length > 5 ||
            node.className?.includes('message') ||
            node.className?.includes('DTp27d') ||
            node.hasAttribute('data-message-id') ||
            node.hasAttribute('data-name') ||
            node.hasAttribute('jsname');
            
          if (isMessageRelated) {
            console.log(`    🎯 メッセージ関連の可能性: ${node.tagName}.${node.className}`);
          }
        }
      });
    });
  });
  
  // 全ページを監視（最大限の設定）
  debugObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    characterData: true,
    characterDataOldValue: true
  });
  
  // 30秒後に自動停止
  setTimeout(() => {
    debugObserver.disconnect();
    console.log('⏰ 全DOM変更監視を30秒で自動停止しました');
    
    // 元のMutationObserverを再開
    if (window.chatEmotionAnalyzer) {
      window.chatEmotionAnalyzer.startMessageMonitoring();
      console.log('🔄 通常のMutationObserverを再開しました');
    }
  }, 30000);
  
  console.log('✅ 全DOM変更監視開始完了。30秒間すべての変更をログ出力します。');
};

// Gmail Chat構造調査機能
window.investigateStructure = () => {
  console.log('🔍 Gmail Chat構造調査を開始...');
  
  // 1. Shadow DOM検出
  console.log('👻 Shadow DOM検出中...');
  function findShadowRoots(element = document.body, depth = 0) {
    const shadowRoots = [];
    const maxDepth = 10;
    
    if (depth > maxDepth) return shadowRoots;
    
    // 現在の要素にShadow Rootがあるかチェック
    if (element.shadowRoot) {
      console.log(`  🌟 Shadow Root発見: ${element.tagName}.${element.className}`);
      shadowRoots.push({
        host: element,
        shadowRoot: element.shadowRoot,
        innerHTML: element.shadowRoot.innerHTML.slice(0, 200)
      });
      
      // Shadow Root内も調査
      const innerShadows = findShadowRoots(element.shadowRoot, depth + 1);
      shadowRoots.push(...innerShadows);
    }
    
    // 子要素も調査
    for (const child of element.children || []) {
      const childShadows = findShadowRoots(child, depth + 1);
      shadowRoots.push(...childShadows);
    }
    
    return shadowRoots;
  }
  
  const shadowRoots = findShadowRoots();
  console.log(`📊 Shadow Root検出結果: ${shadowRoots.length}個`);
  shadowRoots.forEach((sr, i) => {
    console.log(`  [${i}] ホスト:`, sr.host);
    console.log(`      内容:`, sr.innerHTML);
  });
  
  // 2. iframe検出
  console.log('🖼️ iframe検出中...');
  const iframes = document.querySelectorAll('iframe');
  console.log(`📊 iframe検出結果: ${iframes.length}個`);
  iframes.forEach((iframe, i) => {
    console.log(`  [${i}] src: ${iframe.src}`);
    console.log(`      クラス: ${iframe.className}`);
    console.log(`      ID: ${iframe.id}`);
    
    try {
      // Cross-origin制限があるため、try-catch
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        console.log(`      内容: ${doc.body?.innerHTML?.slice(0, 100)}...`);
      } else {
        console.log('      内容: アクセス不可（Cross-origin制限）');
      }
    } catch (e) {
      console.log('      内容: アクセス不可（セキュリティ制限）');
    }
  });
  
  // 3. Google Chat特有の要素検出
  console.log('💬 Google Chat要素検出中...');
  const chatElements = {
    'Google Chat App': document.querySelectorAll('[data-app-name*="chat"], [jsname*="chat"], .chat-app'),
    'メッセージコンテナ': document.querySelectorAll('[role="main"], [role="log"], .messages, .chat-messages'),
    'React/Vue Root': document.querySelectorAll('[data-reactroot], #app, [data-v-]'),
    'Angular要素': document.querySelectorAll('[ng-app], [data-ng-app], [ng-controller]'),
    'Web Components': document.querySelectorAll('*[is], *:defined'),
    'JavaScript管理要素': document.querySelectorAll('[data-testid], [data-cy], [data-automation-id]')
  };
  
  Object.entries(chatElements).forEach(([name, elements]) => {
    if (elements.length > 0) {
      console.log(`✅ ${name}: ${elements.length}個`);
      elements.forEach((el, i) => {
        if (i < 3) { // 最初の3個のみ表示
          console.log(`    [${i}] ${el.tagName}.${el.className}`);
        }
      });
    } else {
      console.log(`❌ ${name}: 見つからず`);
    }
  });
  
  // 4. 動的コンテンツ検出
  console.log('⚡ 動的コンテンツ検出中...');
  const dynamicElements = document.querySelectorAll('[data-lazy], [data-loading], [data-dynamic]');
  console.log(`📊 動的要素: ${dynamicElements.length}個`);
  
  // 5. Event Listener検出
  console.log('🎧 Event Listener検出中...');
  const elementsWithEvents = [];
  document.querySelectorAll('*').forEach(el => {
    if (el._events || el.onclick || el.onkeydown) {
      elementsWithEvents.push(el);
    }
  });
  console.log(`📊 イベント付き要素: ${elementsWithEvents.length}個`);
  
  // 6. CSS Transform/Animation検出
  console.log('🎨 CSS Transform/Animation要素検出中...');
  const animatedElements = document.querySelectorAll('*');
  const transformElements = Array.from(animatedElements).filter(el => {
    const style = getComputedStyle(el);
    return style.transform !== 'none' || 
           style.animation !== 'none' || 
           style.transition !== 'none' ||
           style.opacity !== '1';
  });
  console.log(`📊 アニメーション要素: ${transformElements.length}個`);
  
  console.log('✅ 構造調査完了！');
  console.log('💡 結論: Shadow DOM、iframe、または動的読み込みの可能性を調査してください。');
};

// Chrome extension メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Content scriptがメッセージを受信:', request);
  
  if (request.action === 'getStats') {
    const stats = window.chatEmotionAnalyzer.showStats();
    const backendConnected = window.chatEmotionAnalyzer.checkBackendConnection();
    
    sendResponse({
      messageCount: stats.messageCount,
      emotionCount: stats.emotionCount,
      emotions: stats.emotions,
      backendConnected: backendConnected
    });
  } else if (request.action === 'clearData') {
    window.chatEmotionAnalyzer.clearData();
    sendResponse({ success: true });
  } else if (request.action === 'showStats') {
    window.chatEmotionAnalyzer.showStats();
    sendResponse({ success: true });
  } else if (request.action === 'runDebug') {
    window.chatEmotionAnalyzer.debugManual();
    sendResponse({ success: true });
  } else if (request.action === 'forceReanalyze') {
    window.chatEmotionAnalyzer.debugDOMStructure();
    window.chatEmotionAnalyzer.processExistingMessages();
    sendResponse({ success: true });
  } else if (request.action === 'findMessages') {
    window.findMessageElements();
    sendResponse({ success: true });
  } else if (request.action === 'testMutationObserver') {
    window.testMutationObserver();
    sendResponse({ success: true });
  } else if (request.action === 'debugAllChanges') {
    window.debugAllChanges();
    sendResponse({ success: true });
  } else if (request.action === 'investigateStructure') {
    window.investigateStructure();
    sendResponse({ success: true });
  } else if (request.action === 'ping') {
    sendResponse({ pong: true });
  }
  
  return true; // 非同期レスポンスを示す
});
