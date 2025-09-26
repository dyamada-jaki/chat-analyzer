// Google Chat Emotion Analyzer - Popup Script

document.addEventListener('DOMContentLoaded', function() {
  console.log('🔧 Popup初期化中...');
  
  // 要素の取得
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const messageCount = document.getElementById('message-count');
  const backendStatus = document.getElementById('backend-status');
  const refreshBtn = document.getElementById('refresh-btn');
  const clearBtn = document.getElementById('clear-btn');
  const debugBtn = document.getElementById('debug-btn');
  const reanalyzeBtn = document.getElementById('reanalyze-btn');
  
  const positiveCount = document.getElementById('positive-count');
  const negativeCount = document.getElementById('negative-count');
  const angryCount = document.getElementById('angry-count');
  const neutralCount = document.getElementById('neutral-count');

  // 初期化
  updateStatus();
  
  // イベントリスナー
  refreshBtn.addEventListener('click', updateStatus);
  clearBtn.addEventListener('click', clearData);
  debugBtn.addEventListener('click', runDebug);
  reanalyzeBtn.addEventListener('click', forceReanalyze);

  // ステータス更新
  async function updateStatus() {
    try {
      // アクティブタブを取得
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Google Chat URLの詳細チェック
      const isGoogleChat = tab.url.includes('chat.google.com') || 
                          tab.url.includes('mail.google.com/chat') ||
                          tab.url.includes('google.com/chat');
      
      console.log('🔍 URL確認:', tab.url);
      console.log('🎯 Google Chat判定:', isGoogleChat);
      
      if (!isGoogleChat) {
        updateUI({
          isActive: false,
          statusText: `Google Chatではありません (${tab.url})`,
          messageCount: 0,
          backendConnected: false,
          emotions: {}
        });
        return;
      }

      // Content scriptからデータを取得
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStats' });
      
      if (response) {
        updateUI({
          isActive: true,
          statusText: '正常に動作中',
          messageCount: response.messageCount || 0,
          backendConnected: response.backendConnected || false,
          emotions: response.emotions || {}
        });
      } else {
        updateUI({
          isActive: false,
          statusText: 'Content scriptが見つかりません',
          messageCount: 0,
          backendConnected: false,
          emotions: {}
        });
      }
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      updateUI({
        isActive: false,
        statusText: 'エラーが発生しました',
        messageCount: 0,
        backendConnected: false,
        emotions: {}
      });
    }
  }

  // UI更新
  function updateUI(data) {
    // ステータス表示
    statusDot.className = `status-dot ${data.isActive ? 'active' : 'inactive'}`;
    statusText.textContent = data.statusText;
    messageCount.textContent = data.messageCount;
    backendStatus.textContent = data.backendConnected ? '接続済み' : '未接続';

    // 感情統計
    const emotions = data.emotions;
    positiveCount.textContent = emotions.positive || 0;
    negativeCount.textContent = emotions.negative || 0;
    angryCount.textContent = emotions.angry || 0;
    neutralCount.textContent = emotions.neutral || 0;
  }

  // データクリア
  async function clearData() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const isGoogleChat = tab.url.includes('chat.google.com') || 
                          tab.url.includes('mail.google.com/chat') ||
                          tab.url.includes('google.com/chat');
      
      if (isGoogleChat) {
        await chrome.tabs.sendMessage(tab.id, { action: 'clearData' });
        setTimeout(updateStatus, 500); // 少し待ってから更新
      }
    } catch (error) {
      console.error('データクリアエラー:', error);
    }
  }

  // 詳細デバッグ実行
  async function runDebug() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const isGoogleChat = tab.url.includes('chat.google.com') || 
                          tab.url.includes('mail.google.com/chat') ||
                          tab.url.includes('google.com/chat');
      
      if (isGoogleChat) {
        await chrome.tabs.sendMessage(tab.id, { action: 'runDebug' });
        console.log('✅ 詳細デバッグを実行しました。Consoleを確認してください。');
      }
    } catch (error) {
      console.error('デバッグ実行エラー:', error);
    }
  }

  // 強制再分析実行
  async function forceReanalyze() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const isGoogleChat = tab.url.includes('chat.google.com') || 
                          tab.url.includes('mail.google.com/chat') ||
                          tab.url.includes('google.com/chat');
      
      if (isGoogleChat) {
        await chrome.tabs.sendMessage(tab.id, { action: 'forceReanalyze' });
        setTimeout(updateStatus, 1000); // 1秒後に更新
        console.log('✅ 強制再分析を実行しました。');
      }
    } catch (error) {
      console.error('再分析実行エラー:', error);
    }
  }

  // メッセージ検索（新機能）
  async function findMessages() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const isGoogleChat = tab.url.includes('chat.google.com') || 
                          tab.url.includes('mail.google.com/chat') ||
                          tab.url.includes('google.com/chat');
      
      if (isGoogleChat) {
        await chrome.tabs.sendMessage(tab.id, { action: 'findMessages' });
        console.log('✅ メッセージ要素検索を実行しました。コンソールを確認してください。');
      }
    } catch (error) {
      console.error('メッセージ検索エラー:', error);
    }
  }

  // MutationObserverテスト（新機能）
  async function testMutationObserver() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const isGoogleChat = tab.url.includes('chat.google.com') || 
                          tab.url.includes('mail.google.com/chat') ||
                          tab.url.includes('google.com/chat');
      
      if (isGoogleChat) {
        await chrome.tabs.sendMessage(tab.id, { action: 'testMutationObserver' });
        console.log('✅ MutationObserverテストを実行しました。');
      }
    } catch (error) {
      console.error('MutationObserverテストエラー:', error);
    }
  }

  // イベントリスナーの設定
  document.getElementById('refresh-btn').addEventListener('click', updateStatus);
  document.getElementById('clear-btn').addEventListener('click', clearData);
  document.getElementById('debug-btn').addEventListener('click', runDebug);
  document.getElementById('reanalyze-btn').addEventListener('click', forceReanalyze);
  document.getElementById('find-messages-btn').addEventListener('click', findMessages);
  document.getElementById('test-mutation-btn').addEventListener('click', testMutationObserver);
  document.getElementById('debug-all-changes-btn').addEventListener('click', debugAllChanges);
  document.getElementById('investigate-structure-btn').addEventListener('click', investigateStructure);

  // 構造調査（新機能）
  async function investigateStructure() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const isGoogleChat = tab.url.includes('chat.google.com') || 
                          tab.url.includes('mail.google.com/chat') ||
                          tab.url.includes('google.com/chat');
      
      if (isGoogleChat) {
        await chrome.tabs.sendMessage(tab.id, { action: 'investigateStructure' });
        console.log('✅ 構造調査を実行しました。Shadow DOM、iframe、仮想DOM構造を調査中...');
      }
    } catch (error) {
      console.error('構造調査エラー:', error);
    }
  }

  // 全DOM変更監視（新機能）
  async function debugAllChanges() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const isGoogleChat = tab.url.includes('chat.google.com') || 
                          tab.url.includes('mail.google.com/chat') ||
                          tab.url.includes('google.com/chat');
      
      if (isGoogleChat) {
        await chrome.tabs.sendMessage(tab.id, { action: 'debugAllChanges' });
        console.log('✅ 全DOM変更監視を開始しました。メッセージを送信してください。');
      }
    } catch (error) {
      console.error('全DOM変更監視エラー:', error);
    }
  }

  // 定期的にステータスを更新
  setInterval(updateStatus, 5000);
});
