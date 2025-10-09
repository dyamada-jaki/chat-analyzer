#!/bin/bash

# Gemini API設定確認スクリプト

echo "🔍 Gemini API設定確認中..."

# .envファイルの存在確認
if [ -f "backend/.env" ]; then
    echo "✅ .envファイルが存在します"
    
    # GEMINI_API_KEYの設定確認（値は表示しない）
    if grep -q "GEMINI_API_KEY=" backend/.env; then
        if grep -q "GEMINI_API_KEY=your_" backend/.env; then
            echo "⚠️  GEMINI_API_KEYがデフォルト値のままです"
            echo "   実際のAPIキーを設定してください"
        else
            echo "✅ GEMINI_API_KEYが設定されています"
        fi
    else
        echo "❌ GEMINI_API_KEYが設定されていません"
    fi
else
    echo "❌ .envファイルが存在しません"
    echo "   backend/.env.exampleをコピーして作成してください"
fi

echo ""
echo "📋 設定手順:"
echo "1. https://makersuite.google.com/app/apikey でAPIキー取得"
echo "2. backend/.env の GEMINI_API_KEY= に実際のキー設定"
echo "3. バックエンドサーバー再起動"
