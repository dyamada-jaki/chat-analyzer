<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
// import { googleTokenLogin } from 'vue3-google-login'; // 現在は未使用

// Emits定義
const emit = defineEmits<{
  authStateChange: [isAuthenticated: boolean]
}>()

// ユーザー状態管理
const user = ref<any>(null);
const isLoading = ref(false);

// 認証状態の計算プロパティ
const isAuthenticated = computed(() => !!user.value);

// 認証状態の変更を監視
watch(isAuthenticated, (newValue) => {
  console.log('🔔 GoogleAuth 認証状態変更:', newValue)
  emit('authStateChange', newValue)
}, { immediate: true })

// Google OAuth設定
const GOOGLE_CLIENT_ID = "55163924640-q2se3apg7cgig7ob7as6622gltr3r8fa.apps.googleusercontent.com";


// ログアウト処理
const logout = () => {
  user.value = null;
  console.log('🚪 ログアウトしました');
};

    // テストログイン（デバッグ用）
    const testLogin = () => {
      console.log('🧪 テストログイン実行中...');
      user.value = {
        id: 'test-user-123',
        name: 'テストユーザー',
        email: 'test@example.com',
        picture: 'https://via.placeholder.com/40',
        token: 'test-token'
      };
      console.log('✅ テストログイン完了:', user.value);
      console.log('🎉 isAuthenticated:', isAuthenticated.value);
    };

    // 手動認証開始（ポップアップ通信方式）
    const initiateManualAuth = () => {
      console.log('🚀 手動認証開始...');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(window.location.origin)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/chat.messages.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email')}&` +
        `access_type=offline&` +
        `prompt=consent`;

      console.log('🔗 認証URL:', authUrl);

      // ポップアップで認証開始
      const popup = window.open(authUrl, 'googleAuth', 'width=500,height=600,scrollbars=yes,resizable=yes');

      // ポップアップからのメッセージを監視
      const messageHandler = (event: MessageEvent) => {
        // セキュリティチェック: 送信元が同じドメインかチェック
        if (event.origin !== window.location.origin) {
          console.log('🚫 異なるドメインからのメッセージを無視:', event.origin);
          return;
        }

        if (event.data && event.data.type === 'GOOGLE_AUTH_CODE') {
          console.log('✅ ポップアップから認証コード受信:', event.data.code);
          
          // 認証コードを処理
          exchangeCodeForToken(event.data.code);
          
          // ポップアップを閉じる
          if (popup && !popup.closed) {
            popup.close();
          }
          
          // メッセージリスナーを削除
          window.removeEventListener('message', messageHandler);
        }
      };

      // メッセージイベントリスナーを追加
      window.addEventListener('message', messageHandler);

      // ポップアップの状態を監視（手動で閉じられた場合）
      const popupChecker = setInterval(() => {
        if (popup && popup.closed) {
          console.log('🚪 ポップアップが閉じられました');
          window.removeEventListener('message', messageHandler);
          clearInterval(popupChecker);
        }
      }, 1000);
    };

    // 認証コードをアクセストークンに交換
    const exchangeCodeForToken = async (authCode: string) => {
      try {
        console.log('🔄 アクセストークン取得中...');
        
        const response = await fetch('http://localhost:3001/api/auth/exchange-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code: authCode })
        });
        
        const data = await response.json();
        
        if (data.success) {
          user.value = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            picture: data.user.picture,
            token: data.access_token // 実際のアクセストークン
          };
          console.log('🎉 手動認証完了:', user.value);
        } else {
          throw new Error(data.error || 'Token exchange failed');
        }
        
      } catch (error) {
        console.error('❌ アクセストークン取得エラー:', error);
        alert(`認証に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
      }
    };


// 感情分析テスト機能（手動入力方式）
const testEmotionAnalysis = async () => {
  try {
    console.log('🧪 感情分析テスト開始...');

    // サンプルメッセージで感情分析をテスト
    const testMessages = [
      { userName: '田中', content: 'おはようございます！今日は良い天気ですね。' },
      { userName: '山田', content: 'このプロジェクト、本当に大変です。期限に間に合うか心配です。' },
      { userName: '佐藤', content: 'みんなで頑張りましょう！きっと成功します。' },
      { userName: '鈴木', content: 'また会議の時間が変更になりました。もういい加減にしてください。' }
    ];

    for (const message of testMessages) {
      const response = await fetch('http://localhost:3001/api/webhook/test-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: message.content,
          userName: message.userName,
          userId: `user_${message.userName}`
        })
      });

      const data = await response.json();
      console.log(`✅ ${message.userName}: ${message.content}`);
      console.log(`📊 感情分析結果: ${data.emotion?.emotion} (${data.emotion?.confidence}%)`);
    }

    console.log('🎉 感情分析テスト完了！');
    alert('感情分析テストが完了しました。ブラウザのConsoleでログを確認してください。');

  } catch (error) {
    console.error('❌ 感情分析テストエラー:', error);
    alert('感情分析テストでエラーが発生しました。');
  }
};

// Google Chat APIテスト機能（新しいスペースID用）
const testGoogleChatAPI = async () => {
  if (!user.value?.token) {
    alert('認証が必要です。先にログインしてください。');
    return;
  }

  try {
    console.log('🧪 Google Chat API テスト開始（新しいスペース）...');

    const response = await fetch('http://localhost:3001/api/chat/test-space/AAQA2_lvzVk', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.value.token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('📡 Google Chat API レスポンス:', data);

    if (data.success) {
      if (data.testMode) {
        console.log('✅ テストモード: アクセストークンでのAPI呼び出しが可能');
      } else {
        console.log('🎉 本格APIアクセス成功:', data.spaceInfo);
      }
      alert('Google Chat APIテストが成功しました！Consoleでログを確認してください。');
    } else {
      console.log('❌ API呼び出し失敗:', data.error);
      alert(`API呼び出しが失敗しました: ${data.error}`);
    }

    return data;
  } catch (error) {
    console.error('❌ Google Chat API テストエラー:', error);
    alert('Google Chat APIテストでエラーが発生しました。');
    return null;
  }
};

// チャットメッセージ取得機能（直接アクセス）
const fetchChatMessages = async () => {
  if (!user.value?.token) {
    alert('認証が必要です。先にログインしてください。');
    return;
  }

  try {
    console.log('📥 チャットメッセージ取得開始...');
    const spaceId = 'AAQA2_lvzVk';
    console.log(`🎯 ターゲットスペース: ${spaceId}`);

    // 直接メッセージ取得
    const response = await fetch(`http://localhost:3001/api/chat/spaces/${spaceId}/messages?pageSize=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.value.token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('📨 メッセージ取得レスポンス:', data);

    if (data.success) {
      console.log(`✅ ${data.messageCount}件のメッセージを取得成功`);
      data.messages.forEach((msg: any, index: number) => {
        console.log(`💬 ${index + 1}. ${msg.userName}: ${msg.content}`);
      });
      alert(`${data.messageCount}件のメッセージを取得しました！Consoleで確認してください。`);
    } else {
      console.log('❌ メッセージ取得失敗:', data.error);
      console.log('📋 詳細情報:', data.details);
      
      // Google Chat API制限の場合は詳細説明
      if (data.error?.includes('Forbidden') || data.error?.includes('Not Found')) {
        console.log('⚠️ 考えられる原因:');
        console.log('1. スペースへのアクセス権限がない');
        console.log('2. スペースIDが間違っている');
        console.log('3. Google Workspace管理者権限が必要');
        console.log('4. ボット招待が必要な可能性');
        alert(`メッセージ取得が失敗しました: ${data.error}\n\n考えられる原因:\n• スペースへのアクセス権限がない\n• Google Workspace管理者権限が必要\n• スペースIDの確認が必要`);
      } else {
        alert(`メッセージ取得が失敗しました: ${data.error}`);
      }
    }

    return data;
  } catch (error) {
    console.error('❌ メッセージ取得エラー:', error);
    alert('メッセージ取得でエラーが発生しました。');
    return null;
  }
};

// リアルタイム感情分析開始機能
const startRealtimeAnalysis = async () => {
  if (!user.value?.token) {
    alert('認証が必要です。先にログインしてください。');
    return;
  }

  try {
    console.log('🔄 リアルタイム感情分析開始...');

    const spaceId = 'AAQA2_lvzVk';
    const response = await fetch(`http://localhost:3001/api/chat/spaces/${spaceId}/start-monitoring`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.value.token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('🎯 感情分析結果:', data);

    if (data.success) {
      console.log(`✅ ${data.messageCount}件のメッセージを感情分析完了`);
      data.processedMessages.forEach((msg: any, index: number) => {
        console.log(`😊 ${index + 1}. ${msg.userName}: ${msg.content}`);
        console.log(`   → 感情: ${msg.emotion.emotion} (${Math.round(msg.emotion.confidence * 100)}%)`);
      });
      alert(`${data.messageCount}件のメッセージの感情分析が完了しました！`);
    } else {
      console.log('❌ 感情分析失敗:', data.error);
      alert(`感情分析が失敗しました: ${data.error}`);
    }

    return data;
  } catch (error) {
    console.error('❌ 感情分析エラー:', error);
    alert('感情分析でエラーが発生しました。');
    return null;
  }
};

// ページロード時に認証コードをチェック
onMounted(() => {
  console.log('🔍 ページロード時の認証コードチェック...');
  const urlParams = new URLSearchParams(window.location.search);
  const authCode = urlParams.get('code');
  
  if (authCode) {
    console.log('✅ ページロード時に認証コード検出:', authCode);
    
    // ポップアップの場合は親画面に送信
    if (window.opener) {
      console.log('📤 ポップアップから親画面に認証コードを送信');
      try {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_CODE',
          code: authCode
        }, window.location.origin);
        
        // ポップアップを閉じる
        window.close();
      } catch (error) {
        console.error('❌ 親画面への送信エラー:', error);
        // エラーの場合は直接処理
        exchangeCodeForToken(authCode);
      }
    } else {
      // メイン画面の場合は直接処理
      exchangeCodeForToken(authCode);
    }
    
    // URLからcodeパラメータを削除
    window.history.replaceState({}, document.title, window.location.pathname);
  }
});


// 親コンポーネントに認証状態を公開
defineExpose({
  user,
  isAuthenticated,
  logout,
  testEmotionAnalysis,
  testGoogleChatAPI,
  fetchChatMessages,
  startRealtimeAnalysis
});
</script>

<template>
  <div class="google-auth-container w-full">
    <!-- 認証前：ログインボタン -->
    <div v-if="!isAuthenticated" class="login-section">
      <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 max-w-md mx-auto">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Googleアカウントでログイン</h2>
          <p class="text-gray-600">チャット感情分析を開始するには、Googleアカウントでログインしてください</p>
        </div>
        
        <!-- ローディング中 -->
        <div v-if="isLoading" class="text-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">認証中...</p>
        </div>
        
        <!-- Googleログインボタン -->
        <div v-else class="space-y-4">
          <!-- COOPエラー回避のため、iframe方式を試行 -->
          <div class="text-center">
            <button
              @click="initiateManualAuth"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-medium transition-colors duration-200 flex items-center justify-center space-x-3 shadow-sm"
            >
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Googleでログイン（手動認証）</span>
            </button>
            <p class="text-xs text-gray-500 mt-2">
              新しいタブでGoogle認証を行います
            </p>
          </div>
          
          <!-- カスタムログインボタン（フォールバック） -->
          <div class="mt-4">
            <button
              @click="testLogin"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-medium transition-colors duration-200 flex items-center justify-center space-x-3 shadow-sm"
            >
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>テストログイン（デバッグ用）</span>
            </button>
          </div>
          
          <p class="text-xs text-gray-500 text-center">
            ログインすることで、利用規約とプライバシーポリシーに同意したものとみなされます
          </p>
        </div>
      </div>
    </div>

    <!-- 認証後：統合ヘッダー -->
    <div v-else class="authenticated-header w-full">
      <div class="flex items-center justify-between w-full">
        <!-- 左側：アプリ情報 -->
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span class="text-2xl">💬</span>
          </div>
          <div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Chat Emotion Analyzer
            </h1>
            <p class="text-gray-600 text-sm">Vue 3 + Node.js 認証済み</p>
          </div>
        </div>
        
        <!-- 右側：ユーザー情報 -->
        <div class="flex items-center space-x-4">
          <!-- 接続状態 -->
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-sm font-medium text-gray-700">オンライン</span>
          </div>
          
          <!-- ユーザー情報 -->
          <div class="flex items-center space-x-3 bg-white/50 rounded-lg px-4 py-2">
            <img 
              :src="user.picture" 
              :alt="user.name"
              class="w-8 h-8 rounded-full border-2 border-white shadow-sm"
            >
            <div class="text-right">
              <h3 class="font-semibold text-gray-800 text-sm">{{ user.name }}</h3>
              <p class="text-xs text-gray-600">{{ user.email }}</p>
            </div>
          </div>
          
              <!-- 感情分析テストボタン -->
              <button
                @click="testEmotionAnalysis"
                class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>感情分析テスト</span>
              </button>

              <!-- Google Chat APIテストボタン -->
              <button
                @click="testGoogleChatAPI"
                class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Chat APIテスト</span>
              </button>

              <!-- チャット取得ボタン -->
              <button
                @click="fetchChatMessages"
                class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <span>チャット取得</span>
              </button>

              <!-- リアルタイム分析ボタン -->
              <button
                @click="startRealtimeAnalysis"
                class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>リアルタイム分析</span>
              </button>

          
          <!-- ログアウトボタン -->
          <button
            @click="logout"
            class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>ログアウト</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.google-auth-container {
  width: 100%;
}

/* アニメーション */
.login-section,
.user-info-section {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
