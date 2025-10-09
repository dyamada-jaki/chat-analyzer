// Popup script for Chat Emotion Analyzer

document.addEventListener('DOMContentLoaded', function() {
  // ポップアップ読み込み時に状態を更新
  updateStatus();

  // ステータス更新
  async function updateStatus() {
    try {
      const tab = await getCurrentTab();
      const isGoogleChat = checkGoogleChatPage(tab.url);
      
      if (isGoogleChat) {
        await updateGoogleChatStatus(tab);
      } else {
        updateNonChatStatus(tab);
      }
      
    } catch (error) {
      updateErrorStatus(error);
    }
  }

  // 現在のタブを取得
  async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  // Google Chatページかどうかを確認
  function checkGoogleChatPage(url) {
    return url.includes('chat.google.com') || 
           url.includes('mail.google.com/chat') ||
           url.includes('google.com/chat');
  }

  // Google Chatページの状態更新
  async function updateGoogleChatStatus(tab) {
    const statusElement = document.getElementById('status');
    const connectionElement = document.getElementById('connection-status');
    
    statusElement.textContent = '正常に動作中';
    statusElement.className = 'status working';
    
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStats' });
      updateStatsDisplay(response);
      updateConnectionStatus(connectionElement, response.backendConnected);
    } catch (error) {
      updateContentScriptError(connectionElement, error);
    }
  }

  // 統計情報の表示を更新
  function updateStatsDisplay(response) {
    document.getElementById('message-count').textContent = response.messageCount || 0;
    document.getElementById('positive-count').textContent = response.emotions?.positive || 0;
    document.getElementById('negative-count').textContent = response.emotions?.negative || 0;
    document.getElementById('angry-count').textContent = response.emotions?.angry || 0;
    document.getElementById('neutral-count').textContent = response.emotions?.neutral || 0;
  }

  // 接続状況の更新
  function updateConnectionStatus(connectionElement, backendConnected) {
    if (backendConnected) {
      connectionElement.textContent = 'バックエンドに接続済み';
      connectionElement.className = 'connection connected';
    } else {
      connectionElement.textContent = 'バックエンド未接続（ローカル分析使用）';
      connectionElement.className = 'connection disconnected';
    }
  }

  // Content script通信エラーの処理
  function updateContentScriptError(connectionElement, error) {
    console.log('Content scriptと通信できません:', error);
    connectionElement.textContent = 'Content script未読み込み';
    connectionElement.className = 'connection disconnected';
  }

  // Google Chat以外のページの状態更新
  function updateNonChatStatus(tab) {
    const statusElement = document.getElementById('status');
    const connectionElement = document.getElementById('connection-status');
    
    statusElement.textContent = 'Google Chatではありません';
    statusElement.className = 'status not-chat';
    connectionElement.textContent = '対象外のページ';
    connectionElement.className = 'connection disconnected';
    
    if (tab.url) {
      statusElement.textContent = `対象外: ${new URL(tab.url).hostname}`;
    }
  }

  // エラー状態の更新
  function updateErrorStatus(error) {
    console.error('ステータス更新エラー:', error);
    document.getElementById('status').textContent = 'エラーが発生しました';
    document.getElementById('status').className = 'status error';
  }

  // データをクリア
  async function clearData() {
    try {
      const tab = await getCurrentTab();
      
      if (checkGoogleChatPage(tab.url)) {
        await chrome.tabs.sendMessage(tab.id, { action: 'clearData' });
        setTimeout(updateStatus, 500);
        console.log('✅ データをクリアしました。');
      }
    } catch (error) {
      console.error('データクリアエラー:', error);
    }
  }

  // 既存メッセージ再処理
  async function processExistingMessages() {
    try {
      const tab = await getCurrentTab();
      
      if (checkGoogleChatPage(tab.url)) {
        await chrome.tabs.sendMessage(tab.id, { action: 'processExistingMessages' });
        setTimeout(updateStatus, 1000);
        console.log('✅ 既存メッセージの再処理を開始しました。コンソールを確認してください。');
      }
    } catch (error) {
      console.error('既存メッセージ再処理エラー:', error);
    }
  }

  // イベントリスナーの設定
  document.getElementById('refresh-btn').addEventListener('click', updateStatus);
  document.getElementById('clear-btn').addEventListener('click', clearData);
  document.getElementById('process-existing-messages-btn').addEventListener('click', processExistingMessages);

  // 初期状態更新
  updateStatus();
});