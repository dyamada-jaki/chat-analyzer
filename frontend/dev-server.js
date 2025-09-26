import express from 'express';
import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createDevServer() {
  const app = express();
  
  try {
    // Vite dev server を作成
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    
    // Vite middleware を使用
    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);
    
    const port = 5174;
    
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 開発サーバーが起動しました: http://localhost:${port}`);
      console.log(`🌐 ネットワーク: http://0.0.0.0:${port}`);
    });
    
  } catch (error) {
    console.error('❌ 開発サーバーの起動に失敗:', error);
    process.exit(1);
  }
}

createDevServer();
