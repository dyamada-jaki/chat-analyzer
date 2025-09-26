# 📋 開発ルール・環境構成ドキュメント

## プロジェクト概要
- **プロジェクト名：** Chat Analyzer
- **アプリケーション種別：** GoogleChat感情分析SPA
- **目的：** Google Chatの会話内容を表示し、各メッセージの感情を判別して可視化する

## 🛠️ 技術スタック

### フロントエンド
- **フレームワーク：** Vue 3 (Composition API)
- **言語：** TypeScript
- **ビルドツール：** Vite
- **パッケージマネージャー：** pnpm

### UI・スタイリング
- **CSS フレームワーク：** Tailwind CSS
- **コンポーネントライブラリ：** Headless UI for Vue
- **アイコン：** Heroicons
- **感情表示UI：** 画面右側の固定エリア（可愛いデザイン）

### テスト・品質管理
- **ユニットテスト：** Vitest
- **コンポーネントテスト：** Vue Testing Library
- **E2Eテスト：** Playwright
- **静的コード解析：** ESLint + Prettier
- **Vue固有ルール：** Vue ESLint Plugin
- **TypeScript解析：** TypeScript ESLint

### バックエンド
- **サーバー：** Node.js/Express
- **リアルタイム通信：** WebSocket
- **認証：** Google OAuth 2.0

### API・外部サービス
- **チャットデータ取得：** Google Chat API
- **感情分析：** Google Gemini API

### 開発環境
- **コンテナ化：** Docker + Docker Compose
- **IDE統合：** Dev Container（VSCode）
- **環境統一：** 全サービスをコンテナで実行

## 🎨 UIデザイン仕様

### 感情表示デザイン
- **表示方式：** 画面右側の固定エリアに表示
- **デザインテイスト：** 可愛らしく親しみやすい
- **感情別カラーリング：**
  - 😊 嬉しい/ポジティブ → 明るい緑色系
  - 😢 悲しい/ネガティブ → 青色系
  - 😡 怒り/不満 → 赤色系
  - 😐 中立 → グレー系
- **アニメーション：** ふわっと出現、ホバーで詳細表示

### レスポンシブ対応
- **対象デバイス：** デスクトップ、タブレット、スマートフォン
- **ブレークポイント：** Tailwind CSS標準

## 🧪 テスト戦略

### テストレベル
1. **ユニットテスト（Vitest）**
   - 個別関数・メソッドのテスト
   - カバレッジ目標：80%以上

2. **コンポーネントテスト（Vue Testing Library）**
   - Vueコンポーネントの動作テスト
   - ユーザーインタラクションのテスト

3. **E2Eテスト（Playwright）**
   - エンドツーエンドのユーザーフローテスト
   - 主要機能の動作確認

### テスト実行タイミング
- 開発時：`pnpm test:watch`
- コミット前：全テスト実行
- CI/CD：自動実行

## 📁 プロジェクト構造

```
chat-analyzer/
├── .devcontainer/         # Dev Container設定
│   ├── devcontainer.json
│   └── Dockerfile
├── frontend/              # Vue.js フロントエンド
│   ├── src/
│   │   ├── components/    # Vueコンポーネント
│   │   ├── composables/   # Composition API関数
│   │   ├── services/      # API通信・外部サービス
│   │   ├── types/         # TypeScript型定義
│   │   ├── utils/         # ユーティリティ関数
│   │   └── assets/        # 静的ファイル
│   ├── tests/
│   │   ├── unit/          # ユニットテスト
│   │   ├── component/     # コンポーネントテスト
│   │   └── e2e/           # E2Eテスト
│   └── Dockerfile
├── backend/               # Node.js/Express バックエンド
│   ├── src/
│   │   ├── routes/        # API ルート
│   │   ├── services/      # ビジネスロジック
│   │   ├── middleware/    # ミドルウェア
│   │   ├── types/         # TypeScript型定義
│   │   └── utils/         # ユーティリティ関数
│   ├── tests/
│   └── Dockerfile
├── docs/                  # ドキュメント
├── docker-compose.yml     # マルチコンテナ構成
└── config files           # 設定ファイル群
```

## 🔧 開発環境セットアップ

### 必須要件
- Docker & Docker Compose
- Visual Studio Code + Dev Containers拡張
- Git

### Dev Container セットアップ手順
```bash
# リポジトリクローン
git clone <repository-url>
cd chat-analyzer

# VSCodeでDev Containerを開く
code .
# Command Palette > "Dev Containers: Reopen in Container"

# コンテナ内で全サービス起動
docker-compose up

# フロントエンド: http://localhost:3000
# バックエンド: http://localhost:8000
```

### ローカル開発（コンテナなし）
```bash
# フロントエンド
cd frontend
pnpm install
pnpm dev

# バックエンド
cd backend
pnpm install
pnpm dev
```

## 📝 コーディング規約

### TypeScript
- 厳格な型チェックを有効化
- `any`型の使用禁止
- インターフェースを活用した型安全性の確保

### Vue.js
- Composition APIを使用
- `<script setup>`構文を採用
- プロパティ・イベントの型定義必須

### ファイル命名規則
- コンポーネント：PascalCase（例：`ChatMessage.vue`）
- ファイル：kebab-case（例：`emotion-analyzer.ts`）
- 定数：SCREAMING_SNAKE_CASE

### コミット規約
- Conventional Commits形式を採用
- 例：`feat: add emotion analysis feature`

## 🔒 セキュリティ・プライバシー

### API キー管理
- 環境変数（`.env`）での管理
- 本番環境とは別の開発用キーを使用
- GitHubへのキー流出防止

### データ取り扱い
- チャットデータの適切な取り扱い
- 感情分析結果の一時的な保存のみ
- ユーザーのプライバシー保護

## 🚀 デプロイメント

### 対象環境
- **開発環境：** ローカル開発サーバー
- **ステージング環境：** Vercel/Netlify
- **本番環境：** Vercel/Netlify

### ビルド・デプロイ
```bash
# ビルド
pnpm build

# プレビュー
pnpm preview

# テスト実行
pnpm test
pnpm test:e2e
```

## 📊 パフォーマンス目標

- **First Contentful Paint：** 1.5秒以下
- **Largest Contentful Paint：** 2.5秒以下
- **Time to Interactive：** 3秒以下
- **Bundle Size：** 500KB以下（gzip圧縮後）

---

**作成日：** 2025年9月18日  
**最終更新：** 2025年9月18日  
**バージョン：** 1.0.0
