// Google Chat Emotion Analyzer - Background Script (Service Worker)

console.log('🔧 Background script初期化');

// インストール時の処理
chrome.runtime.onInstalled.addListener((details) => {
  console.log('📦 拡張機能がインストールされました:', details.reason);
  
  if (details.reason === 'install') {
    // 初回インストール時
    console.log('🎉 初回インストールを検出');
    
    // Google Chatタブが開いているかチェック
    chrome.tabs.query({ url: "*://chat.google.com/*" }, (tabs) => {
      if (tabs.length > 0) {
        console.log(`✅ Google Chatタブ ${tabs.length}個を検出`);
        tabs.forEach(tab => {
          // Content scriptを再注入（必要に応じて）
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          }).catch(err => console.log('Content script注入スキップ:', err.message));
        });
      } else {
        console.log('⚠️ Google Chatタブが見つかりません');
      }
    });
  }

  // コンテキストメニューの作成（オプション機能なのでスキップ）
  console.log('ℹ️ コンテキストメニュー機能はスキップしました');
});

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Background scriptがメッセージを受信:', request);
  
  if (request.action === 'logActivity') {
    console.log('📊 Activity log:', request.data);
  }
  
  // 応答を送信
  sendResponse({ success: true });
});

// タブ更新時の処理
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('chat.google.com')) {
    console.log('🔄 Google Chatタブが更新されました:', tab.url);
    
    // Content scriptの状態確認（必要に応じて）
    chrome.tabs.sendMessage(tabId, { action: 'ping' }).catch(() => {
      console.log('Content scriptが応答しません - 正常です（初回読み込み時）');
    });
  }
});

// アクションボタンクリック時の処理
chrome.action.onClicked.addListener((tab) => {
  console.log('🖱️ 拡張機能アイコンがクリックされました');
  
  if (tab.url && tab.url.includes('chat.google.com')) {
    // Content scriptに統計表示を依頼
    chrome.tabs.sendMessage(tab.id, { action: 'showStats' }).catch(err => {
      console.log('Content scriptへのメッセージ送信失敗:', err.message);
    });
  } else {
    console.log('⚠️ Google Chat以外のページです:', tab.url);
  }
});

// コンテキストメニュー機能は無効化（エラー回避のため）
console.log('ℹ️ コンテキストメニュー機能は無効化されています');

console.log('✅ Background script初期化完了');
