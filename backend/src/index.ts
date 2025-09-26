import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketManager } from './services/websocketManager.js';
import webhookRoutes, { setWebSocketManager } from './routes/webhook.js';
import apiRoutes from './routes/api.js';
import authRoutes from './routes/auth.js';
import chatSpacesRoutes from './routes/chat-spaces.js';

// Express アプリケーションを作成
const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェアの設定
app.use(cors({
  origin: [
    'https://chat.google.com',
    'https://mail.google.com',
    'http://localhost:5175', 
    'http://localhost:3000', 
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// リクエストログ
app.use((req, res, next) => {
  console.log(`📞 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// ルートの設定
app.use('/api/webhook', webhookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatSpacesRoutes);
app.use('/api', apiRoutes);

// ルートエンドポイント
app.get('/', (req, res) => {
  res.json({
    name: 'Chat Analyzer Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      webhooks: '/api/webhook',
      api: '/api',
      websocket: `ws://localhost:${PORT}`
    }
  });
});

// 404 ハンドラー
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// エラーハンドラー
app.use((err: any, req: any, res: any, next: any) => {
  console.error('❌ サーバーエラー:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// HTTPサーバーを作成
const server = createServer(app);

// WebSocketマネージャーを初期化
const wsManager = new WebSocketManager(server);
setWebSocketManager(wsManager);

// サーバーを起動
server.listen(PORT, () => {
  console.log('🚀━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 Chat Analyzer Backend Server');
  console.log('🚀━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🌐 HTTP Server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket Server: ws://localhost:${PORT}`);
  console.log('📡 API Endpoints:');
  console.log(`   - GET  /api/health`);
  console.log(`   - GET  /api/emotions`);
  console.log(`   - GET  /api/messages`);
  console.log(`   - POST /api/webhook/google-chat`);
  console.log(`   - POST /api/webhook/test-message`);
  console.log('🚀━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ サーバーが正常に起動しました！');
});

// プロセス終了時のクリーンアップ
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM受信 - サーバーを停止中...');
  wsManager.close();
  server.close(() => {
    console.log('✅ サーバーが正常に停止しました');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT受信 - サーバーを停止中...');
  wsManager.close();
  server.close(() => {
    console.log('✅ サーバーが正常に停止しました');
    process.exit(0);
  });
});
