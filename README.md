# Google Chat Emotion Analyzer

**リアルタイムでGoogle Chatの感情分析を行うChrome拡張機能とWebアプリケーション**

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.15.0-brightgreen)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue)

## 🎯 概要

Google Chat内でのメッセージをリアルタイムで感情分析し、各参加者の感情状態を視覚的に表示するアプリケーションです。

### ✨ 主な機能

- **📱 Chrome拡張機能**: Gmail統合ChatとスタンドアロンGoogle Chatに対応
- **🧠 リアルタイム感情分析**: Googleの Gemini API とフォールバック機能
- **👥 マルチユーザー対応**: チャット参加者全員の感情状態を表示
- **📊 感情カテゴリ**: 😊 Positive、😢 Negative、😠 Angry、😐 Neutral
- **⚡ リアルタイム更新**: メッセージ投稿と同時に感情分析結果を表示

## 🏗️ アーキテクチャ

### フロントエンド
- **Vue 3** + TypeScript + Vite
- **Tailwind CSS** でスタイリング
- **Google OAuth 2.0** 認証

### バックエンド  
- **Node.js** + Express + TypeScript
- **WebSocket** でリアルタイム通信
- **Google AI Generative Language API** (Gemini)

### Chrome拡張機能
- **Manifest V3** 対応
- **Content Scripts** でDOM監視
- **MutationObserver** でリアルタイム検出

## 🚀 セットアップ

### 必要な環境
- **Node.js** >= 20.15.0
- **pnpm** (推奨)
- **Chrome** ブラウザ
- **Google Cloud Console** アカウント

### 1. リポジトリのクローン
\`\`\`bash
git clone <repository-url>
cd chat-analyzer
\`\`\`

### 2. 依存関係のインストール

#### フロントエンド
\`\`\`bash
cd frontend
pnpm install
\`\`\`

#### バックエンド
\`\`\`bash
cd backend
pnpm install
\`\`\`

### 3. 環境変数の設定

#### Google Cloud Console設定
1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. 以下のAPIを有効化:
   - Google Chat API
   - Google AI Generative Language API
3. OAuth 2.0認証情報を作成
4. スコープを追加:
   - `https://www.googleapis.com/auth/chat.messages.readonly`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`

#### 環境変数ファイル
\`\`\`bash
# backend/.env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GEMINI_API_KEY=your_gemini_api_key
\`\`\`

### 4. 開発サーバーの起動

#### バックエンド
\`\`\`bash
cd backend
npm run dev
\`\`\`

#### フロントエンド
\`\`\`bash
cd frontend
pnpm run dev
\`\`\`

### 5. Chrome拡張機能のインストール

1. Chromeで `chrome://extensions/` を開く
2. 「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `chrome-extension/` フォルダを選択

## 📖 使用方法

### Webアプリケーション
1. ブラウザで `http://localhost:5173` にアクセス
2. Googleアカウントでログイン
3. チャット機能と感情分析をテスト

### Chrome拡張機能
1. Gmail (`mail.google.com`) でChatを開く
2. 拡張機能アイコンをクリックして状態確認
3. メッセージを送信すると自動で感情分析が実行

## 🧪 テスト

### フロントエンド
\`\`\`bash
cd frontend
pnpm run test          # ユニットテスト
pnpm run test:e2e       # E2Eテスト
\`\`\`

### バックエンド
\`\`\`bash
cd backend
npm test
\`\`\`

## 📁 プロジェクト構成

\`\`\`
chat-analyzer/
├── frontend/                   # Vue.js フロントエンド
│   ├── src/
│   │   ├── components/        # Vue コンポーネント
│   │   ├── services/          # API サービス
│   │   └── types/             # TypeScript 型定義
│   ├── dist/                  # ビルド出力
│   └── package.json
├── backend/                   # Node.js バックエンド
│   ├── src/
│   │   ├── routes/           # Express ルート
│   │   ├── services/         # ビジネスロジック
│   │   └── types/            # TypeScript 型定義
│   └── package.json
├── chrome-extension/          # Chrome拡張機能
│   ├── manifest.json         # 拡張機能設定
│   ├── content.js           # コンテンツスクリプト
│   ├── popup.html           # ポップアップUI
│   └── background.js        # バックグラウンドスクリプト
├── DEVELOPMENT_RULES.md      # 開発ルール
├── APPLICATION_SPEC.md       # アプリケーション仕様
└── chat.log                 # 開発履歴
\`\`\`

## 🔧 技術スタック

- **フロントエンド**: Vue 3, TypeScript, Vite, Tailwind CSS
- **バックエンド**: Node.js, Express, TypeScript, WebSocket
- **認証**: Google OAuth 2.0
- **感情分析**: Google Gemini API + フォールバック
- **テスト**: Vitest, Vue Testing Library, Playwright
- **コード品質**: ESLint, Prettier

## 🐛 既知の問題

1. **Gmail統合Chat**: iframe内での動作のため、初期ロードに時間がかかる場合があります
2. **感情分析精度**: フォールバック機能は基本的なキーワードマッチングを使用
3. **API制限**: Gemini APIの使用量制限に注意

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 📞 サポート

問題や質問がある場合は、[Issues](../../issues) セクションで報告してください。

---

**開発者**: Daisuke Yamada  
**プロジェクト開始**: 2025年9月
