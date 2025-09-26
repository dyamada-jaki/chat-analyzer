import { watch } from 'fs';
import { exec } from 'child_process';
import express from 'express';
import path from 'path';

console.log('🚀 開発環境を起動中...');

// 初回ビルド
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ 初回ビルドエラー:', error);
    return;
  }
  console.log('✅ 初回ビルド完了');
  
  // ファイル監視を開始
  console.log('👁️  ファイル変更を監視中...');
  
  let building = false;
  
  // srcディレクトリを監視
  watch('./src', { recursive: true }, (eventType, filename) => {
    if (filename && !building) {
      building = true;
      console.log(`📝 ${filename} が変更されました。再ビルド中...`);
      
      exec('npm run build', (error, stdout, stderr) => {
        building = false;
        if (error) {
          console.error('❌ ビルドエラー:', error);
        } else {
          console.log('✅ 再ビルド完了');
        }
      });
    }
  });
});

// 静的ファイルサーバー
const app = express();
app.use(express.static('./dist'));

// SPAのためのフォールバック
app.get('*', (req, res) => {
  res.sendFile(path.resolve('./dist/index.html'));
});

const port = 5174;
app.listen(port, '0.0.0.0', () => {
  console.log(`🌐 開発サーバー: http://localhost:${port}`);
  console.log(`📱 ネットワーク: http://0.0.0.0:${port}`);
  console.log(`🔄 ファイル変更時に自動再ビルドします`);
});
