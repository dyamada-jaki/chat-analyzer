// Popup script for Chat Emotion Analyzer

document.addEventListener('DOMContentLoaded', function() {
  // ポップアップ読み込み時に状態を更新
  updateStatus();

  // ステータス更新
  async function updateStatus() {
    try {
      // 現在のタブ取得
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Google Chatページかどうかを確認
      const isGoogleChat = tab.url.includes('chat.google.com') || 
                          tab.url.includes('mail.google.com/chat') ||
                          tab.url.includes('google.com/chat');
      
      const statusElement = document.getElementById('status');
      const connectionElement = document.getElementById('connection-status');
      
      if (isGoogleChat) {
        statusElement.textContent = '正常に動作中';
        statusElement.className = 'status working';
        
        // Content scriptからの統計情報を取得
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStats' });
          
          // メッセージ数を更新
          document.getElementById('message-count').textContent = response.messageCount || 0;
          
          // 感情カウントを更新
          document.getElementById('positive-count').textContent = response.emotions?.positive || 0;
          document.getElementById('negative-count').textContent = response.emotions?.negative || 0;
          document.getElementById('angry-count').textContent = response.emotions?.angry || 0;
          document.getElementById('neutral-count').textContent = response.emotions?.neutral || 0;
          
          // バックエンド接続状況を更新
          if (response.backendConnected) {
            connectionElement.textContent = 'バックエンドに接続済み';
            connectionElement.className = 'connection connected';
          } else {
            connectionElement.textContent = 'バックエンド未接続（ローカル分析使用）';
            connectionElement.className = 'connection disconnected';
          }
          
        } catch (error) {
          console.log('Content scriptと通信できません:', error);
          connectionElement.textContent = 'Content script未読み込み';
          connectionElement.className = 'connection disconnected';
        }
        
      } else {
        statusElement.textContent = 'Google Chatではありません';
        statusElement.className = 'status not-chat';
        connectionElement.textContent = '対象外のページ';
        connectionElement.className = 'connection disconnected';
        
        // 実際のURLを表示
        if (tab.url) {
          statusElement.textContent = `対象外: ${new URL(tab.url).hostname}`;
        }
      }
      
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      document.getElementById('status').textContent = 'エラーが発生しました';
      document.getElementById('status').className = 'status error';
    }
  }

  // データをクリア
  async function clearData() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const isGoogleChat = tab.url.includes('chat.google.com') || 
                          tab.url.includes('mail.google.com/chat') ||
                          tab.url.includes('google.com/chat');
      
      if (isGoogleChat) {
        await chrome.tabs.sendMessage(tab.id, { action: 'clearData' });
        setTimeout(updateStatus, 500); // 0.5秒後に更新
        console.log('✅ データをクリアしました。');
      }
    } catch (error) {
      console.error('データクリアエラー:', error);
    }
  }

  // 既存メッセージ再処理
  async function processExistingMessages() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const isGoogleChat = tab.url.includes('chat.google.com') || 
                          tab.url.includes('mail.google.com/chat') ||
                          tab.url.includes('google.com/chat');
      
      if (isGoogleChat) {
        await chrome.tabs.sendMessage(tab.id, { action: 'processExistingMessages' });
        setTimeout(updateStatus, 1000); // 1秒後に更新
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