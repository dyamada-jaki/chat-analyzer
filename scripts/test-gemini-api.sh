#!/bin/bash

echo "🔍 Gemini API動作確認テスト"
echo "================================"

# 1. 環境変数確認
echo "📋 Step 1: 環境変数確認"
if [ -f ".env" ]; then
    echo "✅ .envファイル存在"
    if grep -q "GEMINI_API_KEY=" .env && ! grep -q "GEMINI_API_KEY=your_" .env; then
        echo "✅ GEMINI_API_KEYが設定済み"
        # APIキーの最初の10文字のみ表示（セキュリティ）
        API_KEY=$(grep "GEMINI_API_KEY=" .env | cut -d'=' -f2)
        echo "   APIキー: ${API_KEY:0:10}..."
    else
        echo "❌ GEMINI_API_KEYが未設定または無効"
        exit 1
    fi
else
    echo "❌ .envファイルが存在しません"
    exit 1
fi

echo ""

# 2. サーバー起動確認
echo "📋 Step 2: サーバー起動確認"
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ サーバーが起動中"
else
    echo "❌ サーバーが起動していません"
    exit 1
fi

echo ""

# 3. Gemini API実際のテスト
echo "📋 Step 3: Gemini API動作テスト"
echo "テストメッセージ: 'I am extremely excited and happy!'"

RESPONSE=$(curl -X POST http://localhost:3001/api/webhook/test-message \
  -H "Content-Type: application/json" \
  -d '{"content": "I am extremely excited and happy!", "userName": "TestUser", "userId": "gemini_test"}' \
  -s)

echo "レスポンス:"
echo "$RESPONSE" | jq '.'

# 結果分析
EMOTION=$(echo "$RESPONSE" | jq -r '.emotion.emotion')
CONFIDENCE=$(echo "$RESPONSE" | jq -r '.emotion.confidence')

echo ""
echo "📊 結果分析:"
echo "感情: $EMOTION"
echo "確信度: $CONFIDENCE"

if [ "$EMOTION" = "positive" ] && [ "$(echo "$CONFIDENCE > 0.7" | bc -l)" = "1" ]; then
    echo "🎉 Gemini API正常動作！"
    echo "   - ポジティブな感情を正しく検出"
    echo "   - 高い確信度 ($CONFIDENCE)"
elif [ "$EMOTION" = "neutral" ] && [ "$CONFIDENCE" = "0.6" ]; then
    echo "⚠️  フォールバック分析が動作中"
    echo "   - Gemini APIエラーまたは未設定"
    echo "   - シンプル分析にフォールバック"
    
    echo ""
    echo "🔍 サーバーログを確認してください:"
    echo "   tail -f /path/to/server/logs"
    echo ""
    echo "🛠️  トラブルシューティング:"
    echo "   1. APIキーが正しいか確認"
    echo "   2. Google AI Studioでキーが有効か確認"
    echo "   3. サーバーを再起動"
else
    echo "❓ 予期しない結果"
fi

echo ""
echo "================================"
