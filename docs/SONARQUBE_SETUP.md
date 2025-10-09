# 🔍 SonarQube Docker環境セットアップガイド

## 📋 前提条件

### Docker Desktop 起動
```bash
# macOSの場合、Docker Desktopアプリケーションを起動してください
# Applications > Docker > Docker Desktop.app

# 起動確認
docker --version
docker ps
```

## 🚀 SonarQube 起動手順

### 1. Docker Desktop起動後、以下のコマンドでSonarQubeを起動
```bash
# プロジェクトルートで実行
docker-compose -f docker-compose.sonarqube.yml up -d
```

### 2. 起動確認
```bash
# コンテナ状態確認
docker-compose -f docker-compose.sonarqube.yml ps

# ログ確認
docker-compose -f docker-compose.sonarqube.yml logs -f sonarqube
```

### 3. SonarQube アクセス
- **URL**: http://localhost:9000
- **初期ログイン**: admin / admin
- **初回ログイン後**: パスワード変更が必要

## 🔧 管理コマンド

### 便利スクリプト使用
```bash
# 起動
./scripts/sonarqube.sh start

# 停止
./scripts/sonarqube.sh stop
```

### 手動コマンド
```bash
# 起動
docker-compose -f docker-compose.sonarqube.yml up -d

# 停止
docker-compose -f docker-compose.sonarqube.yml down

# データ削除（リセット）
docker-compose -f docker-compose.sonarqube.yml down -v
```

## 📊 コード解析実行

### SonarQube Scanner インストール
```bash
# Homebrewでインストール（macOS）
brew install sonar-scanner

# または手動ダウンロード
# https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/
```

### 解析実行
```bash
# プロジェクトルートで実行
sonar-scanner

# または特定の設定ファイルを指定
sonar-scanner -Dproject.settings=sonar-project.properties
```

## 🎯 初期設定

### 1. SonarQube Web UI での設定
1. http://localhost:9000 にアクセス
2. admin/admin でログイン
3. パスワード変更
4. プロジェクト作成
   - Project key: `chat-analyzer`
   - Display name: `Chat Analyzer`

### 2. 認証トークン生成
1. My Account > Security > Generate Tokens
2. トークンを `sonar-project.properties` に追加:
   ```
   sonar.login=your_generated_token_here
   ```

## 🛠️ トラブルシューティング

### Docker Desktop が起動しない場合
1. Applications フォルダから Docker Desktop を起動
2. システムトレイで Docker アイコンが緑色になるまで待機
3. `docker ps` コマンドで動作確認

### SonarQube が起動しない場合
```bash
# ログ確認
docker-compose -f docker-compose.sonarqube.yml logs sonarqube

# コンテナ状態確認
docker-compose -f docker-compose.sonarqube.yml ps

# リセット
docker-compose -f docker-compose.sonarqube.yml down -v
docker-compose -f docker-compose.sonarqube.yml up -d
```

### ポート競合の場合
`docker-compose.sonarqube.yml` の ports セクションを変更:
```yaml
ports:
  - "9001:9000"  # 9000 → 9001 に変更
```
