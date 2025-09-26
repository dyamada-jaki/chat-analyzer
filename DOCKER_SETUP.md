# 🐳 Docker & Dev Container セットアップガイド

## 概要
Chat Analyzerプロジェクトは完全にコンテナ化された開発環境を提供します。Dev Container（VSCode）を使用することで、チーム全体で統一された開発環境を実現できます。

## 🏗️ アーキテクチャ

### コンテナ構成
```
┌─────────────────────────────────────────────────┐
│ Dev Container (VSCode統合環境)                   │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ Frontend    │ │ Backend     │ │ Database    │ │
│ │ Vue 3       │ │ Node.js     │ │ PostgreSQL  │ │
│ │ Vite        │ │ Express     │ │ (Optional)  │ │
│ │ :3000       │ │ :8000       │ │ :5432       │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────┘
```

### サービス一覧
- **Frontend**: Vue 3 + TypeScript + Vite (ポート: 3000)
- **Backend**: Node.js + Express + TypeScript (ポート: 8000)
- **Database**: PostgreSQL (ポート: 5432) ※将来的に使用予定
- **Redis**: セッション管理・キャッシュ (ポート: 6379) ※将来的に使用予定

## 📋 事前準備

### 必須ソフトウェア
- **Docker Desktop**: [インストールガイド](https://docs.docker.com/desktop/)
- **Visual Studio Code**: [ダウンロード](https://code.visualstudio.com/)
- **Dev Containers拡張**: [マーケットプレイス](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### 推奨拡張機能
- Vue Language Features (Volar)
- TypeScript Hero
- Prettier - Code formatter
- ESLint
- Docker

## 🚀 セットアップ手順

### 1. リポジトリのクローン
```bash
git clone <repository-url> chat-analyzer
cd chat-analyzer
```

### 2. VSCodeでDev Containerを開く
```bash
# VSCodeでプロジェクトを開く
code .

# Command Palette (Cmd/Ctrl + Shift + P) で以下を実行:
# "Dev Containers: Reopen in Container"
```

### 3. 初回セットアップ（コンテナ内で実行）
```bash
# フロントエンドの依存関係インストール
cd frontend
pnpm install

# バックエンドの依存関係インストール
cd ../backend
pnpm install

# 環境変数設定
cp .env.example .env
# .envファイルを編集してAPI키を設定
```

### 4. 開発サーバーの起動
```bash
# プロジェクトルートで全サービス起動
docker-compose up

# または個別起動
cd frontend && pnpm dev  # フロントエンド
cd backend && pnpm dev   # バックエンド
```

### 5. 動作確認
- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8000
- **APIドキュメント**: http://localhost:8000/docs (予定)

## 🗂️ ファイル構成

### 主要な設定ファイル
```
chat-analyzer/
├── .devcontainer/
│   ├── devcontainer.json      # Dev Container設定
│   ├── Dockerfile.dev         # 開発用Docker設定
│   └── docker-compose.yml     # 開発環境構成
├── docker-compose.yml         # 本番用構成
├── docker-compose.dev.yml     # 開発用構成
└── README.md
```

### 環境変数ファイル
```bash
# backend/.env
GOOGLE_CHAT_API_KEY=your_api_key
GEMINI_API_KEY=your_gemini_key
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
DATABASE_URL=postgresql://user:pass@db:5432/chatanalyzer
REDIS_URL=redis://redis:6379
```

## 🧪 テスト実行

### コンテナ内でのテスト
```bash
# フロントエンドテスト
cd frontend
pnpm test          # ユニットテスト
pnpm test:e2e      # E2Eテスト

# バックエンドテスト
cd backend
pnpm test          # ユニットテスト
pnpm test:int      # 統合テスト
```

### テストデータベース
```bash
# テスト用DBコンテナ起動
docker-compose -f docker-compose.test.yml up -d

# テスト実行
pnpm test:db
```

## 🔧 開発ワークフロー

### 日常的な開発
1. VSCodeでDev Containerを開く
2. `docker-compose up`で全サービス起動
3. コード変更（ホットリロード対応）
4. ブラウザで動作確認
5. テスト実行
6. Git commit & push

### 新機能開発
1. feature ブランチ作成
2. Dev Container環境で開発
3. テスト作成・実行
4. コードレビュー
5. main ブランチにマージ

## 🐞 トラブルシューティング

### よくある問題と解決方法

**1. コンテナが起動しない**
```bash
# Docker Desktopが起動しているか確認
docker --version

# イメージの再ビルド
docker-compose build --no-cache
```

**2. ポートが使用中**
```bash
# ポート使用状況確認
lsof -i :3000
lsof -i :8000

# プロセス終了
kill -9 <PID>
```

**3. 依存関係の問題**
```bash
# node_modulesを削除して再インストール
rm -rf frontend/node_modules backend/node_modules
docker-compose build --no-cache
```

**4. 環境変数が読み込まれない**
```bash
# .envファイルの存在確認
ls -la backend/.env

# コンテナ内の環境変数確認
docker-compose exec backend env
```

## 📝 カスタマイズ

### ポート変更
`docker-compose.yml`でポート設定を変更できます：
```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # 3001番ポートで起動
```

### 新しいサービス追加
```yaml
# docker-compose.ymlに追加
services:
  newservice:
    build: ./newservice
    ports:
      - "9000:9000"
    environment:
      - NODE_ENV=development
```

## 🚢 デプロイメント

### ステージング環境
```bash
# ステージング用ビルド
docker-compose -f docker-compose.staging.yml build

# ステージング環境起動
docker-compose -f docker-compose.staging.yml up -d
```

### 本番環境
```bash
# 本番用ビルド
docker-compose -f docker-compose.prod.yml build

# 本番環境デプロイ
docker-compose -f docker-compose.prod.yml up -d
```

---

**作成日**: 2025年9月18日  
**バージョン**: 1.0.0  
**対象環境**: Development, Staging, Production
