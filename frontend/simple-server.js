import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5175;

// COOP/COEPヘッダーを設定
app.use((req, res, next) => {
  // Cross-Origin-Opener-Policy を緩和
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // CORS ヘッダー
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  next();
});

// 静的ファイルを配信
app.use(express.static(path.join(__dirname, 'dist')));

// SPA用のフォールバック
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Frontend server running on http://localhost:${PORT}`);
  console.log(`📡 COOP headers configured for OAuth compatibility`);
});
