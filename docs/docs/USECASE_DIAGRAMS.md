# 📊 Chat Analyzer ユースケース図 (実装済み機能)

## 🎯 システム概要図

```mermaid
graph TB
    subgraph "👤 Actors"
        TM[チームメンバー]
        TL[チームリーダー]
        PM[プロジェクトマネージャー]
        SA[システム管理者]
    end
    
    subgraph "🎯 Core System"
        CE[Chrome拡張機能]
        BE[バックエンドサーバー]
        AI[Gemini AI]
    end
    
    subgraph "📋 Use Cases"
        UC1[UC-001: リアルタイム感情分析]
        UC2[UC-002: 既存メッセージ一括処理]
        UC3[UC-003: 統計情報確認]
        TC1[TC-001: 拡張機能インストール]
        TC2[TC-002: サーバーセットアップ]
    end
    
    TM --> UC1
    TL --> UC2
    PM --> UC3
    SA --> TC1
    SA --> TC2
    
    UC1 --> CE
    UC2 --> CE
    UC3 --> CE
    CE --> BE
    BE --> AI
```

## 🔄 ユースケースフロー図

### UC-001: リアルタイム感情分析フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant GC as Google Chat
    participant CE as Chrome拡張機能
    participant BE as バックエンド
    participant AI as Gemini AI
    
    U->>GC: メッセージ投稿
    GC->>CE: DOM変更イベント
    CE->>CE: メッセージテキスト抽出
    CE->>BE: POST /api/webhook/test-message
    BE->>AI: 感情分析リクエスト
    AI->>BE: 分析結果返却
    BE->>CE: 感情データ返却
    CE->>GC: 感情アイコン挿入
    GC->>U: アイコン表示
```

### UC-002: 既存メッセージ一括処理フロー

```mermaid
flowchart TD
    A[ユーザーがボタンクリック] --> B[画面上のメッセージを検出]
    B --> C{メッセージが存在？}
    C -->|Yes| D[メッセージリストを作成]
    C -->|No| E[処理完了メッセージ表示]
    D --> F[各メッセージを順次処理]
    F --> G[感情分析API呼び出し]
    G --> H[アイコンをDOM挿入]
    H --> I{次のメッセージ？}
    I -->|Yes| F
    I -->|No| J[全処理完了]
    J --> E
```

## 🎯 ユーザージャーニーマップ

```mermaid
journey
    title Chat Analyzer ユーザージャーニー
    section セットアップ
      拡張機能インストール: 3: SA
      バックエンド起動: 4: SA
      Google Chat開く: 5: TM
    section 日常利用
      メッセージ投稿: 5: TM
      感情アイコン確認: 4: TM
      統計データ確認: 3: PM
      既存メッセージ処理: 4: TL
```

## 📊 実装済み機能マトリックス

```mermaid
quadrantChart
    title 実装済み機能の特性
    x-axis 実装難易度低 --> 実装難易度高
    y-axis ビジネス価値低 --> ビジネス価値高
    
    quadrant-1 Quick Wins
    quadrant-2 Major Projects
    quadrant-3 Fill-ins
    quadrant-4 Thankless Tasks
    
    リアルタイム分析: [0.2, 0.9]
    既存メッセージ処理: [0.3, 0.7]
    統計情報表示: [0.4, 0.6]
```

## 🔄 状態遷移図

```mermaid
stateDiagram-v2
    [*] --> 未インストール
    未インストール --> インストール済み : 拡張機能インストール
    インストール済み --> 初期化中 : Google Chat開く
    初期化中--> 待機中 : 初期化完了
    待機中 --> 分析中 : 新メッセージ検知
    分析中 --> 表示中 : 分析完了
    表示中 --> 待機中 : アイコン表示
    待機中 --> 一括処理中 : 既存メッセージ処理
    一括処理中 --> 待機中 : 処理完了
    待機中 --> エラー状態 : API エラー
    エラー状態 --> 待機中 : エラー回復
```
