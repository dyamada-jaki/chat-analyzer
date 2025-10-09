# 📋 Chat Analyzer ユースケース集

## 🎯 概要
このディレクトリには、Chat Analyzerの各機能に関するユースケースが整理されています。

## 📁 構造
```
docs/usecases/
├── README.md              # このファイル
├── user-stories/          # ユーザーストーリー
│   ├── UC-001-realtime-analysis.md
│   ├── UC-002-batch-processing.md
│   └── UC-003-statistics.md
├── technical/             # 技術的ユースケース
│   ├── TC-001-installation.md
│   ├── TC-002-backend-setup.md
│   └── TC-003-api-integration.md
├── scenarios/             # 詳細シナリオ
│   ├── normal-flow.md
│   ├── error-handling.md
│   └── edge-cases.md
└── acceptance-criteria/   # 受け入れ基準
    ├── functional.md
    ├── performance.md
    └── security.md
```

## 🔗 主要ユースケース

### 👤 ユーザーストーリー
- [UC-001: リアルタイム感情分析](user-stories/UC-001-realtime-analysis.md)
- [UC-002: 既存メッセージ一括処理](user-stories/UC-002-batch-processing.md)
- [UC-003: 統計情報確認](user-stories/UC-003-statistics.md)

### 🔧 技術的ユースケース
- [TC-001: Chrome拡張機能インストール](technical/TC-001-installation.md)
- [TC-002: バックエンドセットアップ](technical/TC-002-backend-setup.md)
- [TC-003: API統合](technical/TC-003-api-integration.md)

### 📊 受け入れ基準
- [機能要件](acceptance-criteria/functional.md)
- [パフォーマンス要件](acceptance-criteria/performance.md)
- [セキュリティ要件](acceptance-criteria/security.md)

## 🎯 使い方
1. 新機能開発時は該当するユースケースを参照
2. テスト設計時は受け入れ基準を確認
3. ドキュメント更新時は関連ファイルを同時更新
