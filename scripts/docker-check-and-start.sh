#!/bin/bash

echo "🔐 Docker Hub認証確認中..."

# Docker認証状態確認
if docker info >/dev/null 2>&1; then
    echo "✅ Docker デーモン: 起動中"
else
    echo "❌ Docker デーモン: 停止中"
    exit 1
fi

# Docker Hub認証確認
if docker pull hello-world >/dev/null 2>&1; then
    echo "✅ Docker Hub: 認証済み"
    docker rmi hello-world >/dev/null 2>&1
else
    echo "❌ Docker Hub: 認証が必要です"
    echo ""
    echo "以下のコマンドでログインしてください："
    echo "docker login"
    echo ""
    echo "または Docker Desktop からサインインしてください"
    exit 1
fi

echo ""
echo "🚀 SonarQube起動中..."
docker compose -f docker-compose.sonarqube.yml up -d

echo ""
echo "📊 起動状態確認..."
docker compose -f docker-compose.sonarqube.yml ps

echo ""
echo "🎯 SonarQube アクセス情報:"
echo "URL: http://localhost:9000"
echo "初期ログイン: admin / admin"
