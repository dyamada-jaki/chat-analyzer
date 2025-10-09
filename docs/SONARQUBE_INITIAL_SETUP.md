# 🚀 SonarQube 初期設定ガイド

## 📋 Web UI での初期設定手順

### 1️⃣ SonarQube Web UI アクセス
```
URL: http://localhost:9000
初期ログイン: admin / admin
```

### 2️⃣ 必須初期設定
1. **パスワード変更**
   - 初回ログイン時に新しいパスワードの設定が求められます
   - 強力なパスワードを設定してください

2. **プロジェクト作成**
   - 右上の「Create Project」をクリック
   - 「Manually」を選択
   - Project key: `chat-analyzer`
   - Display name: `Chat Analyzer`
   - 「Set Up」をクリック

3. **認証トークン生成**
   - 「Locally」を選択
   - 「Generate a token」をクリック
   - Token name: `chat-analyzer-token`
   - 「Generate」をクリック
   - **⚠️ 重要**: 生成されたトークンをコピーして保存

### 3️⃣ トークン設定
生成されたトークンを `sonar-project.properties` に追加:
```properties
sonar.login=your_generated_token_here
```

### 4️⃣ コード解析実行
```bash
# プロジェクトルートで実行
sonar-scanner
```

## 🎯 期待される結果
- コード品質メトリクス
- 脆弱性検出
- 重複コード検出
- テストカバレッジ
- 技術的負債の可視化

## 🔧 トラブルシューティング

### エラー: "Project not found"
- プロジェクトキーが正しいか確認
- Web UIでプロジェクトが作成されているか確認

### エラー: "Authentication failed"
- トークンが正しく設定されているか確認
- `sonar-project.properties` の `sonar.login` を確認

### エラー: "Connection refused"
- SonarQubeが起動しているか確認: `docker compose -f docker-compose.sonarqube.yml ps`
- ポート9000が開いているか確認: `curl http://localhost:9000/api/system/status`
