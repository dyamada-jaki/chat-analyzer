<script setup lang="ts">
import { ref } from 'vue'
import GoogleAuth from './components/GoogleAuth.vue'

const messages = ref([
  {
    id: '1',
    content: 'おはようございます！今日の会議の資料、準備できました。',
    sender: '田中',
    timestamp: '09:30',
    emotion: { icon: '😊', label: 'ポジティブ', confidence: 92 }
  }
])

const newMessage = ref('')
const authRef = ref<InstanceType<typeof GoogleAuth>>()
const isAuthenticated = ref(false)

// 認証状態を直接管理
const handleAuthStateChange = (authState: boolean) => {
  console.log('🔄 認証状態変更:', authState)
  isAuthenticated.value = authState
}

const sendMessage = () => {
  if (newMessage.value.trim()) {
    const message = {
      id: Date.now().toString(),
      content: newMessage.value,
      sender: 'あなた',
      timestamp: new Date().toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'}),
      emotion: { icon: '😊', label: 'ポジティブ', confidence: 80 }
    }
    messages.value.push(message)
    newMessage.value = ''
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100">
    <div class="container mx-auto px-4 py-6 max-w-7xl">
      <!-- ヘッダー -->
      <header class="glass bg-white/80 border border-white/20 rounded-2xl shadow-xl p-6 mb-6">
        <!-- 統一されたGoogleAuth管理 -->
        <GoogleAuth 
          ref="authRef" 
          @auth-state-change="handleAuthStateChange" 
        />
      </header>

      <!-- メインコンテンツ（認証後のみ表示） -->
      <div v-if="isAuthenticated" class="flex flex-col lg:flex-row gap-6">
        <!-- チャットエリア（左側） -->
        <div class="flex-1 lg:w-2/3">
          <div class="glass bg-white/70 border border-white/30 rounded-2xl shadow-xl p-6 h-[600px] flex flex-col">
            <h2 class="text-xl font-bold text-gray-800 flex items-center space-x-2 mb-4">
              <span>💭</span>
              <span>チャット会議室</span>
            </h2>

            <!-- メッセージ表示エリア -->
            <div class="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar">
              <div v-for="message in messages" :key="message.id" class="flex items-start space-x-3">
                <div class="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {{ message.sender.charAt(0) }}
                </div>
                <div class="flex-1 max-w-xs">
                  <div class="bg-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                    <p class="text-gray-800">{{ message.content }}</p>
                  </div>
                  <div class="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                    <span>{{ message.timestamp }}</span>
                    <span>•</span>
                    <span class="flex items-center space-x-1">
                      <span>{{ message.emotion.icon }}</span>
                      <span>{{ message.emotion.label }} ({{ message.emotion.confidence }}%)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- メッセージ入力エリア -->
            <div class="border-t border-gray-200 pt-4">
              <div class="flex items-center space-x-3">
                <div class="flex-1 relative">
                  <input
                    v-model="newMessage"
                    @keypress.enter="sendMessage"
                    type="text"
                    placeholder="メッセージを入力してください..."
                    class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button 
                  @click="sendMessage"
                  class="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  送信
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 感情モニターサイドバー（右側） -->
        <div class="lg:w-1/3">
          <div class="glass bg-white/70 border border-white/30 rounded-2xl shadow-xl p-6 h-[600px] flex flex-col">
            <div class="mb-6">
              <h2 class="text-xl font-bold text-gray-800 flex items-center space-x-2 mb-2">
                <span>😄</span>
                <span>感情モニター</span>
              </h2>
              <p class="text-sm text-gray-600">安定版構成で動作中</p>
            </div>

            <!-- 互換性確認 -->
            <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
              <h3 class="font-semibold text-gray-800 mb-3 text-center">動作環境確認</h3>
              <div class="grid grid-cols-2 gap-3">
                <div class="text-center p-2 bg-white rounded-lg shadow-sm">
                  <div class="text-lg font-bold text-green-600">Vue 3.4</div>
                  <div class="text-xs text-gray-600">安定版</div>
                </div>
                <div class="text-center p-2 bg-white rounded-lg shadow-sm">
                  <div class="text-lg font-bold text-blue-600">Vite 5.4</div>
                  <div class="text-xs text-gray-600">Node 20対応</div>
                </div>
                <div class="text-center p-2 bg-white rounded-lg shadow-sm">
                  <div class="text-lg font-bold text-purple-600">TW 3.4</div>
                  <div class="text-xs text-gray-600">Tailwind</div>
                </div>
                <div class="text-center p-2 bg-white rounded-lg shadow-sm">
                  <div class="text-lg font-bold text-orange-600">TS 5.5</div>
                  <div class="text-xs text-gray-600">TypeScript</div>
                </div>
              </div>
              
              <!-- 動作状況 -->
              <div class="mt-4 pt-3 border-t border-gray-300">
                <div class="text-center">
                  <div class="text-sm font-medium text-gray-700">システム状態</div>
                  <div class="text-lg font-bold text-green-600 flex items-center justify-center space-x-2 mt-1">
                    <span>✅</span>
                    <span>正常動作</span>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">Node.js 20.15.0 互換</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- フッター -->
      <footer class="mt-6 text-center">
        <p class="text-gray-600 text-sm">
          🚀 Chat Emotion Analyzer - 安定版構成
        </p>
        <p class="text-gray-500 text-xs mt-1">
          Vue 3.4 + Vite 5.4 + Tailwind 3.4 + TypeScript 5.5 (Node.js 20.15.0 対応)
        </p>
      </footer>
    </div>
  </div>
</template>