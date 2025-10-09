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
    
    // New chatボタンコンテナのクリーンアップ
    this.cleanupNewChatButtons();
    
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

  // New chatボタンコンテナから既存の感情アイコンを削除（精密化）
  cleanupNewChatButtons() {
    console.log('🧹 New chatボタンコンテナのクリーンアップを開始（精密版）');
    
    // より精密な検索: 真のNew Chatボタンコンテナのみ対象
    const potentialContainers = document.querySelectorAll('[jscontroller="KF64he"]');
    let cleanedCount = 0;
    
    potentialContainers.forEach(container => {
      if (this.isNewChatButton(container)) {
        const existingIcons = container.querySelectorAll('.emotion-analyzer-icon');
        if (existingIcons.length > 0) {
          console.log(`🗑️ 真のNew chatボタンコンテナから${existingIcons.length}個の感情アイコンを削除`);
          existingIcons.forEach(icon => icon.remove());
          cleanedCount += existingIcons.length;
        }
      }
    });
    
    console.log(`✅ New chatボタンコンテナのクリーンアップ完了 (${cleanedCount}個削除)`);
  }

  // DOM構造をデバッグ調査
  debugDOMStructure() {
    console.log('🔬 DOM構造デバッグ開始...');
    
    // 想定セレクタの確認
    const dataIdElements = document.querySelectorAll('[data-id]');
    console.log(`🎯 [data-id]要素数: ${dataIdElements.length}`);
    
    // メッセージテキストセレクタの確認
    const messageTextElements = document.querySelectorAll('.DTp27d.QIJiHb');
    console.log(`💬 .DTp27d.QIJiHb要素数: ${messageTextElements.length}`);
    
    // 送信者名セレクタの確認
    const userNameElements = document.querySelectorAll('.njhDLd.O5OMdc');
    console.log(`👤 .njhDLd.O5OMdc要素数: ${userNameElements.length}`);
  }

  // 既存のメッセージを処理
  processExistingMessages() {
    console.log('📋 既存メッセージの処理を開始...');
    
    const gmailMessageSelectors = [
      'div[data-message-id]',
      'div[data-member-id*="user/human/"]',
      'div[data-name]',
      'div.AflJR',
      'div[jsname="o7uNDd"]',
      '[data-id]',
      'div[role="row"]',
      'div[role="group"]'
    ];
    
    let totalFound = 0;
    
    for (const selector of gmailMessageSelectors) {
      const messages = document.querySelectorAll(selector);
      console.log(`🔍 ${selector}: ${messages.length}件`);
      
      if (messages.length > 0 && selector !== '[data-id]') {
        const validMessages = Array.from(messages).filter(el => 
          el.tagName !== 'SCRIPT' && 
          el.textContent?.trim().length > 10 && 
          !el.textContent.includes('window.WIZ_global_data') && 
          !this.isButtonElement(el) &&
          (this.isDefinitelyMessageElement(el) || 
           (!this.isGoogleUIElement(el) && this.isInMessageContainer(el)))
        );
        
        console.log(`✅ ${selector}で有効なメッセージ候補: ${validMessages.length}件`);
        
        if (validMessages.length > 0) {
          console.log(`📝 ${selector}で${validMessages.length}件の既存メッセージを処理開始...`);
          validMessages.forEach((messageElement, i) => {
            console.log(`📝 処理中[${i}]: ${messageElement.tagName} - ${messageElement.textContent?.substring(0, 50)}...`);
            this.processMessage(messageElement, `existing-${selector}`);
          });
          totalFound += validMessages.length;
          break;
        }
      }
    }
    
    console.log(`📝 既存メッセージ総数: ${totalFound}件`);
    
    if (totalFound === 0) {
      console.log('⚠️ 既存メッセージが見つからないため、より広範囲に探索します...');
      this.exploreAllElements();
    } else {
      console.log(`✅ 既存メッセージ処理完了: ${totalFound}件のメッセージを処理しました`);
    }
  }

  // 新しいメッセージの監視
  startMessageMonitoring() {
    console.log('🚀 startMessageMonitoring() 開始...');
    
    try {
      const observer = new MutationObserver((mutations) => {
        this.handleMutations(mutations);
      });

      const chatContainer = this.getChatContainer();
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

  // DOM変更の処理
  handleMutations(mutations) {
    console.log(`🔄 DOM変更検出: ${mutations.length}件の変更`);
    
    mutations.forEach((mutation, index) => {
      console.log(`🔍 変更[${index}]: タイプ=${mutation.type}, ターゲット=${mutation.target.tagName}`);
      
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          this.processAddedNode(node);
        }
      });
    });
  }

  // 追加されたノードの処理
  processAddedNode(node) {
    console.log(`🆕 新しいノード追加: ${node.tagName}, クラス=[${Array.from(node.classList || []).join(', ')}]`);
    
    // 早期リターンでネストを減らす
    if (!this.shouldProcessNode(node)) {
      return;
    }

    // 直接マッチング
    if (this.tryDirectMatching(node)) {
      return;
    }

    // 子要素検索
    this.tryChildElementMatching(node);
  }

  // ノードを処理すべきかどうかの判定
  shouldProcessNode(node) {
    if (this.isDefinitelyMessageElement(node)) {
      console.log('✅ 確実なメッセージ要素を検出:', node.className || node.tagName);
      return true;
    }
    
    if (this.isGoogleUIElement(node)) {
      console.log('🚫 Google UI要素を検出して無視:', node.className || node.tagName);
      return false;
    }
    
    if (!this.isInMessageContainer(node)) {
      console.log('🚫 メッセージコンテナ外を検出して無視:', node.className || node.tagName);
      return false;
    }
    
    return true;
  }

  // 直接マッチングを試行
  tryDirectMatching(node) {
    const gmailSelectors = [
      '[data-message-id]',
      '[data-name]', 
      '[jsname="bgckF"]',
      '.DTp27d.QIJiHb',
      '.AflJR',
      '[data-id]'
    ];
    
    for (const selector of gmailSelectors) {
      if (this.matchesSelector(node, selector)) {
        console.log(`💬 新しいメッセージを検出（直接-${selector}）:`, node);
        this.processMessage(node, `realtime-direct-${selector}`);
        return true;
      }
    }
    
    return false;
  }

  // セレクターマッチングの判定
  matchesSelector(node, selector) {
    return node.matches && 
           node.matches(selector) && 
           !this.isButtonElement(node) && 
           (this.isDefinitelyMessageElement(node) || 
            (!this.isGoogleUIElement(node) && this.isInMessageContainer(node)));
  }

  // 子要素マッチングを試行
  tryChildElementMatching(node) {
    const prioritySelectors = ['[jsname="bgckF"]', '.DTp27d.QIJiHb'];
    
    for (const selector of prioritySelectors) {
      if (this.processChildElements(node, selector)) {
        break;
      }
    }
  }

  // 子要素の処理
  processChildElements(node, selector) {
    const messageElements = node.querySelectorAll ? node.querySelectorAll(selector) : [];
    let foundMessageText = false;
    
    messageElements.forEach(msgEl => {
      if (this.isValidMessageElement(msgEl)) {
        console.log(`💬 子要素から新しいメッセージを検出 (${selector}):`, msgEl);
        this.processMessage(msgEl, `realtime-child-${selector}`);
        foundMessageText = true;
      }
    });
    
    return foundMessageText;
  }

  // 有効なメッセージ要素かどうかの判定
  isValidMessageElement(element) {
    return !this.isButtonElement(element) && 
           (this.isDefinitelyMessageElement(element) || 
            (!this.isGoogleUIElement(element) && this.isInMessageContainer(element)));
  }

  // チャットコンテナの取得
  getChatContainer() {
    return document.querySelector('[role="main"]') || document.body;
  }

  // ボタン要素かどうかを判定
  isButtonElement(element) {
    if (!element) return true;
    
    if (element.tagName === 'BUTTON') {
      return true;
    }
    
    const buttonDataIds = ['edit', 'replyToThread', 'reply', 'react', 'menu', 'more'];
    const dataId = element.getAttribute('data-id');
    if (dataId && buttonDataIds.includes(dataId)) {
      return true;
    }
    
    const role = element.getAttribute('role');
    if (role === 'button') {
      return true;
    }
    
    const className = element.className || '';
    if (className.includes('pYTkkf') || className.includes('button') || className.includes('btn')) {
      return true;
    }
    
    return false;
  }

  // 全要素を探索（最後の手段）
  exploreAllElements() {
    console.log('🔍 全要素探索を開始（Gmail統合Chat用）...');
    
    const allDivs = document.querySelectorAll('div');
    const potentialMessages = Array.from(allDivs).filter(div => {
      const text = div.textContent?.trim();
      return text && 
             text.length > 10 && 
             text.length < 500 &&
             !text.includes('window.WIZ_global_data') &&
             !text.includes('DOCTYPE') &&
             div.children.length < 20;
    });
    
    console.log(`🔍 潜在的メッセージ要素: ${potentialMessages.length}件`);
    
    if (potentialMessages.length > 0) {
      console.log('⚡ 上位5件を強制処理...');
      potentialMessages.slice(0, 5).forEach((messageElement, i) => {
        this.processMessage(messageElement, 'exploreAll');
      });
    }
  }

  // メッセージ処理
  processMessage(messageElement, sourceSelector = 'unknown') {
    if (!this.isInMessageContainer(messageElement)) {
      console.log('⚠️ メッセージコンテナ外の要素をスキップ');
      return;
    }
    
    const dataId = messageElement.getAttribute('data-id');
    const messageText = messageElement.textContent?.trim() || '';
    const uniqueKey = dataId || `${messageText.substring(0, 50)}_${messageElement.tagName}`;
    
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
      
      const messageData = this.extractMessageData(messageElement);
      
      if (this.isValidMessage(messageData)) {
        console.log('💬 メッセージ抽出成功:', messageData);
        
        this.processedMessages.add(uniqueKey);
        this.analyzeEmotion(messageData, messageElement);
        
      } else {
        console.log('⚠️ メッセージ抽出失敗:', {
          hasContent: !!messageData.content,
          hasUserName: !!messageData.userName,
          contentLength: messageData.content?.length || 0,
          isSystemMessage: this.isSystemMessage(messageData.content)
        });
      }
    } catch (error) {
      console.error('❌ メッセージ処理エラー:', error);
    }
  }

  // メッセージコンテナ内の要素かチェック
  isInMessageContainer(element) {
    if (this.isDefinitelyMessageElement(element)) {
      console.log('✅ 確実なメッセージ要素を検出:', element.className);
      return true;
    }
    
    if (this.isGoogleUIElement(element)) {
      console.log('⚠️ Google UI要素を検出して除外:', element.className);
      return false;
    }
    
    const messageContainerSelectors = [
      '[role="main"]',
      '.nF6pT',
      '.bzJiD',
      '.Tm1pwc',
      '.yqoUIf'
    ];
    
    for (const selector of messageContainerSelectors) {
      if (element.closest(selector)) {
        return true;
      }
    }
    
    return true;
  }

  // 安全なクラス名取得ヘルパー
  getElementClasses(element) {
    if (!element || !element.className) return '';
    return typeof element.className === 'string' ? 
           element.className : 
           element.className.toString();
  }

  // 確実にメッセージ要素かどうかを判定
  isDefinitelyMessageElement(element) {
    if (!element) return false;
    
    try {
      const messageTextClasses = [
        'DTp27d QIJiHb',
        'DTp27d QIJiHb Zc1Emd',
        'yqoUIf',
        'nF6pT'
      ];
      
      const elementClasses = this.getElementClasses(element);
      
      for (const messageClass of messageTextClasses) {
        if (elementClasses.includes(messageClass)) {
          return true;
        }
      }
    
      if (element.getAttribute('jsname') === 'bgckF' && 
          elementClasses.includes('DTp27d')) {
        return true;
      }
      
      if (element.hasAttribute('data-message-id')) {
        return true;
      }
      
      if (element.hasAttribute('data-name') && 
          !elementClasses.includes('nH') &&
          !elementClasses.includes('tVu25')) {
        return true;
      }
      
      const textContent = element.textContent?.trim() || '';
      if (textContent.length > 5 && 
          textContent.length < 1000 && 
          !this.isSystemMessage(textContent) &&
          !elementClasses.includes('nH') &&
          !elementClasses.includes('tVu25') &&
          (element.closest('[role="main"]') || 
           element.closest('.nF6pT') || 
           element.closest('.yqoUIf'))) {
          return true;
        }
        
        return false;
    } catch (error) {
      console.error('❌ isDefinitelyMessageElement エラー:', error);
      return false;
    }
  }

  // "New chat"ボタンコンテナの特定検出（精密化）
  isNewChatButton(element) {
    if (!element) return false;
    
    const textContent = element.textContent?.trim().toLowerCase() || '';
    const jsname = element.getAttribute('jsname') || '';
    const jscontroller = element.getAttribute('jscontroller') || '';
    const elementClasses = this.getElementClasses(element);
    
    // 1. 直接的な"New chat"ボタン要素の検出
    if (textContent === 'new chat' || 
        jsname === 'V67aGc' || 
        elementClasses.includes('T57Ued-nBWOSb')) {
      console.log('🎯 New chatボタンを直接検出:', element.textContent?.trim());
      return true;
    }
    
    // 2. New chatボタンコンテナの精密検出（厳格化）
    if (jscontroller === 'KF64he') {
      const newChatSpan = element.querySelector('span[jsname="V67aGc"]');
      const newChatButton = element.querySelector('button[jsname="TrXBg"]');
      const dataIsFab = element.querySelector('[data-is-fab="true"]');
      
      // より厳密な条件: 複数の特徴が揃った場合のみNew Chatボタンと判定
      if (newChatSpan && newChatButton && dataIsFab && 
          newChatSpan.textContent?.trim().toLowerCase() === 'new chat') {
        console.log('🎯 New chatボタンコンテナを精密検出 (厳格条件)');
        return true;
      }
    }
    
    // 3. "New chat"テキストを含む要素の親コンテナ検出（条件追加）
    const newChatTextSpan = element.querySelector('.T57Ued-nBWOSb');
    if (newChatTextSpan && newChatTextSpan.textContent?.trim().toLowerCase() === 'new chat') {
      // さらに、FABボタンの特徴があることを確認
      const fabButton = element.querySelector('[data-is-fab="true"]');
      if (fabButton) {
        console.log('🎯 New chatボタンの親コンテナを精密検出');
        return true;
      }
    }
    
    // 4. 子要素に"New chat"テキストがある場合（条件強化）
    const newChatSpans = element.querySelectorAll('span');
    for (const span of newChatSpans) {
      if (span.textContent?.trim().toLowerCase() === 'new chat') {
        // New chatテキストがあっても、FABボタンの特徴がない場合は除外しない
        const parentContainer = span.closest('[jscontroller="KF64he"]');
        const hasFabFeatures = parentContainer?.querySelector('[data-is-fab="true"]');
        if (hasFabFeatures) {
          console.log('🎯 New chatテキストの親コンテナを精密検出');
          return true;
        }
      }
    }
    
    // 5. 従来の親要素からの検出（変更なし）
    if (element.closest('[jsname="V67aGc"]') ||
        element.closest('.T57Ued-nBWOSb') ||
        element.closest('button')?.textContent?.trim().toLowerCase() === 'new chat') {
      console.log('🎯 New chatボタンの子要素を検出');
      return true;
    }
    
    return false;
  }

  // Google UI要素かどうかを判定
  isGoogleUIElement(element) {
    if (!element) return false;
    
    try {
      if (this.isDefinitelyMessageElement(element)) {
        return false;
      }

      // New chatボタンの特定除外
      if (this.isNewChatButton(element)) {
        console.log('🚫 New chatボタンを特定除外');
        return true;
      }
    
      const googleClassPatterns = [
        /^gb_/, /^pGxpHc/, /^pYTkkf/, /^Ewn2Sd/, /^lJradf/, 
        /^gstl_/, /^gsib_/, /^RBHQF/, /^T57Ued/, /^SXdXAb/,
        /^OiePBf/, /^pnsM6e/, /^VpAp7d/, /^ne2Ple/, /^G01np/,
        /^tVu25/, /^vI8oZc/, /^nH$/, /^aeH$/, /^aeF$/, /^aeG$/,
        /^bGI$/, /^Tm$/, /^AO$/, /^w-asV$/, /^bbg$/
      ];
      
      const elementClasses = this.getElementClasses(element);
      
      if (elementClasses.includes('DTp27d') || 
          elementClasses.includes('QIJiHb') || 
          element.getAttribute('jsname') === 'bgckF') {
        return false;
      }
      
      for (const pattern of googleClassPatterns) {
        if (pattern.test(elementClasses)) {
          return true;
        }
      }
      
      const role = element.getAttribute('role');
      if (role && ['banner', 'navigation', 'toolbar', 'menubar', 'button', 'alert', 'contentinfo'].includes(role)) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ isGoogleUIElement エラー:', error);
      return false;
    }
  }

  // メッセージの有効性をチェック
  isValidMessage(messageData) {
    return messageData.content && 
           messageData.content.trim() && 
           messageData.content.length > 2 && 
           messageData.userName &&
           !this.isSystemMessage(messageData.content);
  }

  // システムメッセージかどうかを判定
  isSystemMessage(content) {
    if (!content) return true;
    
    const systemPatterns = [
      /^You$/i, /^今$/, /^\d+\s*(分|時間|秒)$/, /^Now$/i,
      /^午前|午後/, /^\d{1,2}:\d{2}$/, /^\.\.\.$/, /^読み込み中/,
      /^Loading/i, /^This is taking longer/i, /^Edit message$/i,
      /^Reply in thread$/i, /^リアクションを追加$/
    ];
    
    return systemPatterns.some(pattern => pattern.test(content.trim()));
  }

  // メッセージデータ抽出
  extractMessageData(messageElement) {
    const messageId = messageElement.getAttribute('data-id');
    const userId = messageElement.getAttribute('data-user-id');
    
    console.log('🔍 メッセージ要素を解析中:', {
      messageId,
      userId,
      elementClasses: Array.from(messageElement.classList),
      elementTag: messageElement.tagName
    });
    
    let content = '';
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
        content = contentElement.textContent.trim();
        console.log(`✅ メッセージ内容を取得 (${selector}):`, content.substring(0, 50));
        break;
      }
    }
    
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
          console.log(`✅ 送信者名を取得 (${selector}):`, userName);
          break;
        }
      }
    } else {
      console.log(`✅ 送信者名を取得 (data-name):`, userName);
    }
    
    const timeElement = messageElement.querySelector('.FvYVyf') || 
                       messageElement.querySelector('[data-absolute-timestamp]') ||
                       messageElement.querySelector('.timestamp');
    const timeText = timeElement ? timeElement.textContent.trim() : '';
    const timestamp = timeElement ? timeElement.getAttribute('data-absolute-timestamp') : '';
    
    if (!content && !userName) {
      console.log('⚠️ 標準セレクタで取得失敗、代替手段を試行');
      
      const allText = messageElement.textContent || '';
      if (allText.length > 10) {
        content = allText.substring(0, 200);
        userName = 'Unknown User';
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
        
        this.displayEmotionIcon(messageElement, emotion, confidence);
        
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
      console.log('🔄 ローカル感情分析にフォールバック');
      this.fallbackEmotionAnalysis(messageData, messageElement);
    }
  }

  // 感情アイコンを表示
  displayEmotionIcon(messageElement, emotion, confidence) {
    console.log(`🎨 感情アイコン表示開始: ${emotion} (${confidence}%)`);
    
    const parentContainer = messageElement.closest('[data-id]') || messageElement;
    const existingIcons = parentContainer.querySelectorAll('.emotion-analyzer-icon');
    if (existingIcons.length > 0) {
      console.log(`🗑️ 既存アイコン ${existingIcons.length}個を削除`);
      existingIcons.forEach(icon => icon.remove());
    }

    const emotionIcons = {
      'positive': '😊',
      'negative': '😢', 
      'angry': '😠',
      'neutral': '😐'
    };

    const emotionColors = {
      'positive': '#10B981',
      'negative': '#3B82F6',
      'angry': '#EF4444',
      'neutral': '#6B7280'
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

    const opacity = Math.max(0.6, confidence / 100);
    
    const iconElement = document.createElement('span');
    iconElement.className = 'emotion-analyzer-icon';
    
    iconElement.innerHTML = `
      <span class="emotion-icon-container" style="
        display: inline-flex;
        align-items: center;
        margin-left: 6px;
        margin-top: 2px;
        padding: 3px 6px;
        background: linear-gradient(135deg, ${color}15, ${color}25);
        border: 1px solid ${color}40;
        border-radius: 16px;
        font-size: 14px;
        color: ${color};
        font-weight: 600;
        cursor: help;
        opacity: ${opacity};
        transition: opacity 0.2s ease;
        backdrop-filter: blur(4px);
        box-shadow: 0 2px 4px ${color}20, 0 1px 2px ${color}10;
        vertical-align: baseline;
        white-space: nowrap;
      " title="感情分析: ${label} (確信度: ${confidence}%)">
        <span class="emotion-emoji" style="
          margin-right: 4px;
          font-size: 16px;
          vertical-align: baseline;
        ">${icon}</span>
        <span class="emotion-confidence" style="
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          opacity: 0.8;
          vertical-align: baseline;
        ">${confidence}%</span>
      </span>
    `;

    const container = iconElement.querySelector('.emotion-icon-container');
    container.addEventListener('mouseenter', () => {
      container.style.opacity = '1';
      container.style.boxShadow = `0 2px 6px ${color}30`;
    });
    
    container.addEventListener('mouseleave', () => {
      container.style.opacity = opacity.toString();
      container.style.boxShadow = `0 1px 2px ${color}20`;
    });

    this.insertEmotionIcon(messageElement, iconElement);
    
    console.log(`✨ 感情アイコン表示完了: ${label} ${icon}`);
  }

  // 感情アイコンの最適な挿入位置を決定
  insertEmotionIcon(messageElement, iconElement) {
    const messageContainer = messageElement.closest('[data-id]') || messageElement;
    
    // New chatボタンコンテナの場合は挿入を拒否
    if (this.isNewChatButton(messageContainer)) {
      console.log('🚫 New chatボタンコンテナのため感情アイコン挿入を拒否');
      
      // 既存の感情アイコンがあれば削除
      const existingIcons = messageContainer.querySelectorAll('.emotion-analyzer-icon');
      if (existingIcons.length > 0) {
        console.log(`🗑️ New chatボタンコンテナから${existingIcons.length}個の既存アイコンを削除`);
        existingIcons.forEach(icon => icon.remove());
      }
      
      return;
    }
    
    // 優先順位1: メッセージテキスト要素の直後（DIV外部配置）
    const messageTextElement = messageContainer.querySelector('.DTp27d.QIJiHb, [jsname="bgckF"]');
    if (messageTextElement) {
      messageTextElement.insertAdjacentElement('afterend', iconElement);
      console.log('📍 アイコン挿入位置: メッセージテキストDIVの直後（リンク干渉回避）');
      return;
    }
    
    // 優先順位2: ユーザー名要素の直後
    const userNameElement = messageContainer.querySelector('.njhDLd.O5OMdc, [data-name]');
    if (userNameElement && userNameElement.parentNode) {
      userNameElement.parentNode.insertBefore(iconElement, userNameElement.nextSibling);
      console.log('📍 アイコン挿入位置: ユーザー名の直後');
      return;
    }
    
    // 優先順位3: コンテンツコンテナ内の末尾
    const contentContainer = messageContainer.querySelector('.yqoUIf, .AflJR');
    if (contentContainer) {
      contentContainer.appendChild(iconElement);
      console.log('📍 アイコン挿入位置: コンテンツコンテナの末尾');
      return;
    }
    
    // 優先順位4: メッセージ全体のテキストノードの直後
    const textNodes = Array.from(messageContainer.childNodes).filter(node => 
      node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 5
    );
    if (textNodes.length > 0) {
      const lastTextNode = textNodes[textNodes.length - 1];
      lastTextNode.parentNode.insertBefore(iconElement, lastTextNode.nextSibling);
      console.log('📍 アイコン挿入位置: テキストノードの直後');
      return;
    }
    
    // フォールバック: メッセージコンテナの末尾
    messageContainer.appendChild(iconElement);
    console.log('📍 アイコン挿入位置: メッセージコンテナの末尾（フォールバック）');
  }

  // フォールバック感情分析
  fallbackEmotionAnalysis(messageData, messageElement) {
    const text = messageData.content.toLowerCase();
    let emotion = 'neutral';
    let confidence = 0.6;

    const positiveWords = ['嬉しい', '楽しい', '最高', 'ありがとう', '良い', 'いいね', '😊', '😄'];
    const negativeWords = ['悲しい', '辛い', '大変', '心配', '不安', '😢', '😞'];
    const angryWords = ['むかつく', '腹立つ', 'イライラ', '最悪', '😠', 'やる気', 'API', '使えない', 'もういい加減にしてください', 'うんざり', '面倒', '困る'];

    const frustratedPatterns = [
      /もう.*にして.*/, /いい加減.*/, /.*うんざり.*/, /.*面倒.*/, /.*困る.*/
    ];

    if (angryWords.some(word => text.includes(word)) || 
        frustratedPatterns.some(pattern => pattern.test(text))) {
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
  } else if (request.action === 'processExistingMessages') {
    window.chatEmotionAnalyzer.processExistingMessages();
    sendResponse({ success: true });
  } else if (request.action === 'ping') {
    sendResponse({ pong: true });
  }
  
  return true; // 非同期レスポンスを示す
});